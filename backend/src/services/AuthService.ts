import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import prisma from '../utils/prisma';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshTokenValue,
} from '../utils/auth';
import { deleteFromCdn } from '../utils/cdn';
import { AppError } from '../types/errors';

// Build audience list from named platform vars + legacy comma-sep list
// Token aud differs by platform: iOS=iosClientId, Android=webClientId, Web=webClientId
const GOOGLE_ALLOWED_CLIENT_IDS = [
  ...(process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '').split(',').map((id) => id.trim()),
  process.env.GOOGLE_IOS_CLIENT_ID || '',
  process.env.GOOGLE_ANDROID_CLIENT_ID || '',
].filter((id, i, arr) => Boolean(id) && arr.indexOf(id) === i); // unique non-empty
const googleClient = new OAuth2Client(GOOGLE_ALLOWED_CLIENT_IDS[0]);

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Apple: comma-separated bundle IDs (prod + dev), used as audience
const APPLE_CLIENT_IDS = (process.env.APPLE_CLIENT_IDS || process.env.APPLE_CLIENT_ID || 'com.hungphu.memoura')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

export interface AppleProfile {
  appleId: string;
  email: string | null; // null on subsequent logins — Apple only sends on first sign-in
  name: string | null;
}

type UserAuthShape = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  coupleId: string | null;
  googleId: string | null;
  onboardingComplete: boolean;
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
  refreshToken: string,
) {
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      coupleId: user.coupleId,
      googleId: user.googleId,
      onboardingComplete: user.onboardingComplete,
    },
  };
}

export async function verifyGoogleToken(idToken: string): Promise<GoogleProfile> {
  try {
    console.log('[google-auth] Allowed client IDs:', GOOGLE_ALLOWED_CLIENT_IDS);
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_ALLOWED_CLIENT_IDS,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) throw new Error('Invalid Google token');
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || '',
    };
  } catch (err) {
    console.error('[google-auth] verifyIdToken FAILED:', (err as Error).message);
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

  const hashed = await hashPassword(password);

  let coupleId: string | null = null;
  if (inviteCode) {
    const couple = await prisma.couple.findUnique({ where: { inviteCode } });
    if (!couple) throw new AppError(400, 'Invalid invite code');
    const count = await prisma.user.count({ where: { coupleId: couple.id } });
    if (count >= 2) throw new AppError(400, 'This couple already has 2 members');
    coupleId = couple.id;
  } else if (coupleName) {
    const couple = await prisma.couple.create({ data: { name: coupleName.trim() } });
    coupleId = couple.id;
  }

  const user = await prisma.user.create({
    data: { email, password: hashed, name, coupleId },
  });

  const accessToken = generateAccessToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);
  return buildAuthResponse(user, accessToken, refreshToken);
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
  const refreshToken = await createRefreshToken(user.id);
  return buildAuthResponse(user, accessToken, refreshToken);
}

export async function refresh(token: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: {
      user: { select: { id: true, coupleId: true, email: true, name: true, avatar: true, googleId: true, onboardingComplete: true } },
    },
  });

  if (!stored || stored.revokedAt) throw new AppError(401, 'Invalid refresh token');
  if (stored.expiresAt < new Date()) throw new AppError(401, 'Refresh token expired');

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const newAccessToken = generateAccessToken(stored.user.id, stored.user.coupleId);
  const newRefreshToken = await createRefreshToken(stored.user.id);
  return buildAuthResponse(stored.user, newAccessToken, newRefreshToken);
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
    select: { id: true, email: true, name: true, avatar: true, coupleId: true, googleId: true, emailVerified: true, onboardingComplete: true, createdAt: true },
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
  const refreshToken = await createRefreshToken(user.id);
  return buildAuthResponse(user, accessToken, refreshToken);
}

export async function googleComplete(
  idToken: string,
  inviteCode?: string,
  coupleName?: string,
) {
  const profile = await verifyGoogleToken(idToken);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
  });
  if (existing) {
    throw new AppError(409, 'Account already exists. Please use the Google login button.');
  }

  let coupleId: string | null = null;
  if (inviteCode) {
    const couple = await prisma.couple.findUnique({ where: { inviteCode } });
    if (!couple) throw new AppError(400, 'Invalid invite code');
    const count = await prisma.user.count({ where: { coupleId: couple.id } });
    if (count >= 2) throw new AppError(400, 'This couple already has 2 members');
    coupleId = couple.id;
  } else if (coupleName) {
    const couple = await prisma.couple.create({ data: { name: coupleName.trim() } });
    coupleId = couple.id;
  }

  const user = await prisma.user.create({
    data: {
      email: profile.email,
      name: profile.name,
      avatar: profile.picture || null,
      googleId: profile.googleId,
      password: null,
      coupleId,
    },
  });

  const accessToken = generateAccessToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);
  return buildAuthResponse(user, accessToken, refreshToken);
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

// B3: verify Apple identity token (signed by Apple's public keys)
export async function verifyAppleToken(idToken: string): Promise<AppleProfile> {
  try {
    console.log('[apple-auth] Verifying token. Allowed audiences:', APPLE_CLIENT_IDS);
    const payload = await appleSignin.verifyIdToken(idToken, {
      audience: APPLE_CLIENT_IDS,
      ignoreExpiration: false,
    });
    if (!payload.sub) throw new Error('Invalid Apple token: missing sub');
    return {
      appleId: payload.sub,
      email: payload.email ?? null,
      name: null, // Apple does not include name in JWT — mobile passes nameHint separately
    };
  } catch (err) {
    console.error('[apple-auth] verifyIdToken FAILED:', (err as Error).message);
    throw new Error('Invalid Apple token');
  }
}

// B4a: apple sign-in — find existing user or return needsCouple
export async function appleAuth(
  idToken: string,
  nameHint?: string,
): Promise<{ needsCouple: true; appleProfile: AppleProfile } | ReturnType<typeof buildAuthResponse>> {
  const profile = await verifyAppleToken(idToken);

  let user = await prisma.user.findUnique({ where: { appleId: profile.appleId } });

  // Email-link fallback: if email provided and matches existing account, link appleId
  if (!user && profile.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          appleId: profile.appleId,
          // Update name only if not set and nameHint provided
          ...(nameHint && !byEmail.name ? { name: nameHint } : {}),
        },
      });
    }
  }

  if (!user) {
    return { needsCouple: true, appleProfile: { ...profile, name: nameHint ?? null } };
  }

  const accessToken = generateAccessToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);
  return buildAuthResponse(user, accessToken, refreshToken);
}

// B4b: apple complete — onboarding completion (new user, couple setup)
export async function appleComplete(
  idToken: string,
  inviteCode?: string,
  coupleName?: string,
  nameHint?: string,
): Promise<ReturnType<typeof buildAuthResponse>> {
  const profile = await verifyAppleToken(idToken);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ appleId: profile.appleId }, ...(profile.email ? [{ email: profile.email }] : [])] },
  });
  if (existing) {
    throw new AppError(409, 'Account already exists. Please use the Apple login button.');
  }

  let coupleId: string | null = null;
  if (inviteCode) {
    const couple = await prisma.couple.findUnique({ where: { inviteCode } });
    if (!couple) throw new AppError(400, 'Invalid invite code');
    const count = await prisma.user.count({ where: { coupleId: couple.id } });
    if (count >= 2) throw new AppError(400, 'This couple already has 2 members');
    coupleId = couple.id;
  } else if (coupleName) {
    const couple = await prisma.couple.create({ data: { name: coupleName.trim() } });
    coupleId = couple.id;
  }

  const userName = nameHint || profile.email?.split('@')[0] || 'Apple User';
  const userEmail = profile.email ?? `${profile.appleId}@privaterelay.appleid.com`;

  const user = await prisma.user.create({
    data: {
      email: userEmail,
      name: userName,
      avatar: null,
      appleId: profile.appleId,
      password: null,
      coupleId,
    },
  });

  const accessToken = generateAccessToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);
  return buildAuthResponse(user, accessToken, refreshToken);
}

/**
 * Always returns void (no enumeration of registered emails).
 * If the email matches a password-backed account, issues a reset token and emails it.
 * Google/Apple-only accounts are intentionally skipped — they have no password to reset.
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) return;

  // Best-effort: rate-limit errors should still propagate (caller maps to 429).
  const { sendPasswordResetEmail } = await import('./EmailService');
  await sendPasswordResetEmail(user.id, user.email, user.name);
}

/**
 * Verify reset token, set new password, mark token used, revoke all active refresh tokens.
 * Throws AppError for invalid / expired / already-used tokens.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const record = await prisma.passwordReset.findUnique({ where: { token } });
  if (!record) throw new AppError(400, 'Invalid or expired reset token');
  if (record.usedAt) throw new AppError(400, 'Reset token has already been used');
  if (record.expiresAt < new Date()) throw new AppError(400, 'Reset token has expired');

  const hashed = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
    prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
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

// T301: server-side flag so re-login skips the wizard. Mobile sets true on
// the Finish step; auth responses (login/refresh/me) carry the value back so
// the gate routes a returning user straight to (tabs).
export async function setOnboardingComplete(userId: string, value: boolean) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { onboardingComplete: value },
    select: { id: true, onboardingComplete: true },
  });
  return user;
}
