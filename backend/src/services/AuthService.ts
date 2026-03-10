import { OAuth2Client } from 'google-auth-library';
import prisma from '../utils/prisma';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateAccessToken,
  generateRefreshTokenValue,
} from '../utils/auth';
import { deleteFromCdn } from '../utils/cdn';
import { AppError } from '../types/errors';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

type UserAuthShape = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  coupleId: string;
  googleId: string | null;
};

export async function createRefreshToken(userId: string): Promise<string> {
  const tokenValue = generateRefreshTokenValue();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId, token: tokenValue, expiresAt } });
  return tokenValue;
}

export function buildAuthResponse(
  user: UserAuthShape,
  accessToken: string,
  legacyToken: string,
  refreshToken: string,
) {
  return {
    token: legacyToken,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      coupleId: user.coupleId,
      googleId: user.googleId,
    },
  };
}

export async function verifyGoogleToken(idToken: string): Promise<GoogleProfile> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) throw new Error('Invalid Google token');
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || '',
    };
  } catch {
    throw new Error('Invalid Google token');
  }
}

export async function register(
  email: string,
  password: string,
  name: string,
  inviteCode?: string,
  coupleName?: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'Email already registered');
  if (!inviteCode && !coupleName) {
    throw new AppError(400, 'Must either create a new couple (coupleName) or join one (inviteCode)');
  }

  const hashed = await hashPassword(password);

  let couple;
  if (inviteCode) {
    couple = await prisma.couple.findUnique({ where: { inviteCode } });
    if (!couple) throw new AppError(400, 'Invalid invite code');
    const memberCount = await prisma.user.count({ where: { coupleId: couple.id } });
    if (memberCount >= 2) throw new AppError(400, 'This couple already has 2 members');
  } else {
    couple = await prisma.couple.create({ data: { name: coupleName!.trim() } });
  }

  const user = await prisma.user.create({
    data: { email, password: hashed, name, coupleId: couple.id },
  });

  const accessToken = generateAccessToken(user.id, user.coupleId);
  const legacyToken = generateToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);
  return buildAuthResponse(user, accessToken, legacyToken, refreshToken);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, 'Invalid email or password');
  if (!user.password) {
    throw new AppError(401, 'This account uses Google Sign-In. Please sign in with Google.');
  }
  const valid = await comparePassword(password, user.password);
  if (!valid) throw new AppError(401, 'Invalid email or password');

  const accessToken = generateAccessToken(user.id, user.coupleId);
  const legacyToken = generateToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);
  return buildAuthResponse(user, accessToken, legacyToken, refreshToken);
}

export async function refresh(token: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: {
      user: { select: { id: true, coupleId: true, email: true, name: true, avatar: true, googleId: true } },
    },
  });

  if (!stored || stored.revokedAt) throw new AppError(401, 'Invalid refresh token');
  if (stored.expiresAt < new Date()) throw new AppError(401, 'Refresh token expired');

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const newAccessToken = generateAccessToken(stored.user.id, stored.user.coupleId);
  const newLegacyToken = generateToken(stored.user.id, stored.user.coupleId);
  const newRefreshToken = await createRefreshToken(stored.user.id);
  return buildAuthResponse(stored.user, newAccessToken, newLegacyToken, newRefreshToken);
}

export async function logout(userId: string, refreshToken?: string) {
  if (refreshToken && typeof refreshToken === 'string') {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, userId },
      data: { revokedAt: new Date() },
    });
  }
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatar: true, coupleId: true, googleId: true, emailVerified: true, createdAt: true },
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export async function googleAuth(idToken: string) {
  const profile = await verifyGoogleToken(idToken);

  let user = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: profile.googleId, avatar: byEmail.avatar ?? (profile.picture || null) },
      });
    }
  }

  if (!user) {
    return { needsCouple: true, googleProfile: profile };
  }

  const accessToken = generateAccessToken(user.id, user.coupleId);
  const legacyToken = generateToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);
  return buildAuthResponse(user, accessToken, legacyToken, refreshToken);
}

export async function googleComplete(
  idToken: string,
  inviteCode?: string,
  coupleName?: string,
) {
  if (!inviteCode && !coupleName) {
    throw new AppError(400, 'Must either create a new couple (coupleName) or join one (inviteCode)');
  }

  const profile = await verifyGoogleToken(idToken);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
  });
  if (existing) {
    throw new AppError(409, 'Account already exists. Please use the Google login button.');
  }

  let couple;
  if (inviteCode) {
    couple = await prisma.couple.findUnique({ where: { inviteCode } });
    if (!couple) throw new AppError(400, 'Invalid invite code');
    const memberCount = await prisma.user.count({ where: { coupleId: couple.id } });
    if (memberCount >= 2) throw new AppError(400, 'This couple already has 2 members');
  } else {
    couple = await prisma.couple.create({ data: { name: coupleName!.trim() } });
  }

  const user = await prisma.user.create({
    data: {
      email: profile.email,
      name: profile.name,
      avatar: profile.picture || null,
      googleId: profile.googleId,
      password: null,
      coupleId: couple.id,
    },
  });

  const accessToken = generateAccessToken(user.id, user.coupleId);
  const legacyToken = generateToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);
  return buildAuthResponse(user, accessToken, legacyToken, refreshToken);
}

export async function deleteAccount(userId: string, coupleId: string, password: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  // Verify password (skip for Google-only accounts)
  if (user.password) {
    const valid = await comparePassword(password, user.password);
    if (!valid) throw new AppError(401, 'Incorrect password');
  }

  const memberCount = await prisma.user.count({ where: { coupleId } });
  const isLastMember = memberCount === 1;

  // Collect CDN URLs to delete
  const cdnUrls: string[] = [];
  if (user.avatar) cdnUrls.push(user.avatar);

  if (isLastMember) {
    const [momentPhotos, momentAudios, letterPhotos, letterAudios, foodSpotPhotos, recipePhotos, cookingPhotos] =
      await Promise.all([
        prisma.momentPhoto.findMany({ where: { moment: { coupleId } }, select: { url: true } }),
        prisma.momentAudio.findMany({ where: { moment: { coupleId } }, select: { url: true } }),
        prisma.letterPhoto.findMany({ where: { letter: { coupleId } }, select: { url: true } }),
        prisma.letterAudio.findMany({ where: { letter: { coupleId } }, select: { url: true } }),
        prisma.foodSpotPhoto.findMany({ where: { foodSpot: { coupleId } }, select: { url: true } }),
        prisma.recipePhoto.findMany({ where: { recipe: { coupleId } }, select: { url: true } }),
        prisma.cookingSessionPhoto.findMany({ where: { session: { coupleId } }, select: { url: true } }),
      ]);
    cdnUrls.push(
      ...momentPhotos.map((p) => p.url),
      ...momentAudios.map((p) => p.url),
      ...letterPhotos.map((p) => p.url),
      ...letterAudios.map((p) => p.url),
      ...foodSpotPhotos.map((p) => p.url),
      ...recipePhotos.map((p) => p.url),
      ...cookingPhotos.map((p) => p.url),
    );
  } else {
    const [sentLetterPhotos, sentLetterAudios] = await Promise.all([
      prisma.letterPhoto.findMany({ where: { letter: { senderId: userId } }, select: { url: true } }),
      prisma.letterAudio.findMany({ where: { letter: { senderId: userId } }, select: { url: true } }),
    ]);
    cdnUrls.push(...sentLetterPhotos.map((p) => p.url), ...sentLetterAudios.map((p) => p.url));
  }

  // Delete CDN files (best-effort — don't fail on CDN errors)
  await Promise.allSettled(cdnUrls.map((url) => deleteFromCdn(url)));

  if (isLastMember) {
    await prisma.$transaction(async (tx) => {
      await tx.shareLink.deleteMany({ where: { coupleId } });
      await tx.achievement.deleteMany({ where: { coupleId } });
      await tx.appSetting.deleteMany({ where: { coupleId } });
      await tx.customAchievement.deleteMany({ where: { coupleId } });
      await tx.tag.deleteMany({ where: { coupleId } });
      await tx.goal.deleteMany({ where: { coupleId } });
      await tx.sprint.deleteMany({ where: { coupleId } });
      await tx.datePlan.deleteMany({ where: { coupleId } }); // stops + spots cascade
      await tx.dateWish.deleteMany({ where: { coupleId } });
      await tx.expense.deleteMany({ where: { coupleId } });
      await tx.cookingSession.deleteMany({ where: { coupleId } }); // items/steps/photos/recipes cascade
      await tx.recipe.deleteMany({ where: { coupleId } }); // photos cascade
      await tx.loveLetter.deleteMany({ where: { coupleId } }); // photos/audio cascade
      await tx.foodSpot.deleteMany({ where: { coupleId } }); // photos cascade
      await tx.moment.deleteMany({ where: { coupleId } }); // photos/audios/comments/reactions cascade
      await tx.user.delete({ where: { id: userId } }); // push subs/tokens/notifications/refresh tokens cascade
      await tx.couple.delete({ where: { id: coupleId } });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      // Delete letters where user is sender or recipient (photos/audio cascade)
      await tx.loveLetter.deleteMany({
        where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      });
      // Delete user (notifications/push subs/mobile tokens/refresh tokens cascade)
      await tx.user.delete({ where: { id: userId } });
    });
  }

  console.log(
    `[AccountDeletion] userId=${userId} coupleId=${coupleId} isLastMember=${isLastMember} timestamp=${new Date().toISOString()}`,
  );
}

export async function googleLink(userId: string, idToken: string) {
  const profile = await verifyGoogleToken(idToken);

  const existing = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  if (existing && existing.id !== userId) {
    throw new AppError(409, 'This Google account is already linked to another user');
  }

  const user = await prisma.user.update({ where: { id: userId }, data: { googleId: profile.googleId } });
  return { ok: true, googleId: user.googleId };
}
