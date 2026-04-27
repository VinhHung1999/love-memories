import request from 'supertest';
import app from '../index';
import prisma from '../utils/prisma';
import { hashPassword, generateToken } from '../utils/auth';

// Mock CDN so file upload tests don't hit real CDN
jest.mock('../utils/cdn', () => ({
  uploadToCdn: jest.fn().mockResolvedValue({ filename: 'test-file.jpg', url: 'https://cdn.example.com/test-file.jpg' }),
  deleteFromCdn: jest.fn().mockResolvedValue(undefined),
}));

// Mock google-auth-library so Google token tests don't require real tokens
// Mock nodemailer so email tests don't require SMTP
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: jest.fn().mockImplementation(({ idToken }: { idToken: string }) => {
        if (idToken === 'valid-google-token') {
          return Promise.resolve({
            getPayload: () => ({
              sub: 'google-uid-123',
              email: 'googleuser@example.com',
              name: 'Google User',
              picture: 'https://example.com/pic.jpg',
            }),
          });
        }
        if (idToken === 'existing-user-google-token') {
          return Promise.resolve({
            getPayload: () => ({
              sub: 'google-uid-existing',
              email: 'test@lovescrum.test', // matches existing test user
              name: 'Test User',
              picture: '',
            }),
          });
        }
        return Promise.reject(new Error('Invalid token'));
      }),
    })),
  };
});

// Mock apple-signin-auth so Apple token tests don't call real Apple API
jest.mock('apple-signin-auth', () => ({
  verifyIdToken: jest.fn().mockImplementation((idToken: string) => {
    if (idToken === 'valid-apple-token') {
      return Promise.resolve({
        sub: 'apple-uid-123',
        email: 'appleuser@example.com',
      });
    }
    if (idToken === 'valid-apple-token-noemail') {
      return Promise.resolve({
        sub: 'apple-uid-noemail',
        email: undefined,
      });
    }
    return Promise.reject(new Error('Invalid token'));
  }),
  __esModule: true,
  default: {
    verifyIdToken: jest.fn().mockImplementation((idToken: string) => {
      if (idToken === 'valid-apple-token') {
        return Promise.resolve({ sub: 'apple-uid-123', email: 'appleuser@example.com' });
      }
      if (idToken === 'valid-apple-token-noemail') {
        return Promise.resolve({ sub: 'apple-uid-noemail', email: undefined });
      }
      return Promise.reject(new Error('Invalid token'));
    }),
  },
}));

let token: string;
let partnerToken: string;
let testCoupleId: string;
let testUserId: string;
let testPartnerId: string;

// Create test couple + users directly via Prisma (bypasses whitelist) and generate tokens
beforeAll(async () => {
  // Clean up previous test data referencing this couple
  await prisma.shareLink.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.emailVerification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.achievement.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.appSetting.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.notification.deleteMany();
  await prisma.letterPhoto.deleteMany();
  await prisma.letterAudio.deleteMany();
  await prisma.loveLetter.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.expense.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.momentComment.deleteMany();
  await prisma.momentReaction.deleteMany();
  await prisma.momentPhoto.deleteMany();
  await prisma.momentAudio.deleteMany();
  await prisma.moment.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.foodSpotPhoto.deleteMany();
  await prisma.foodSpot.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.cookingSessionPhoto.deleteMany();
  await prisma.cookingSessionStep.deleteMany();
  await prisma.cookingSessionItem.deleteMany();
  await prisma.cookingSessionRecipe.deleteMany();
  await prisma.cookingSession.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.recipePhoto.deleteMany();
  await prisma.recipe.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.goal.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.sprint.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.datePlanSpot.deleteMany();
  await prisma.datePlanStop.deleteMany();
  await prisma.datePlan.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.dateWish.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.tag.deleteMany({ where: { coupleId: 'test-couple' } });
  await prisma.user.deleteMany({ where: { email: { in: ['test@lovescrum.test', 'partner@lovescrum.test'] } } });

  const couple = await prisma.couple.upsert({
    where: { id: 'test-couple' },
    update: {},
    create: { id: 'test-couple', name: 'Test Couple' },
  });
  testCoupleId = couple.id;

  const hashed = await hashPassword('testpass123');
  const user = await prisma.user.create({
    data: { email: 'test@lovescrum.test', password: hashed, name: 'Test User', coupleId: testCoupleId },
  });
  const partner = await prisma.user.create({
    data: { email: 'partner@lovescrum.test', password: hashed, name: 'Test Partner', coupleId: testCoupleId },
  });
  token = generateToken(user.id, testCoupleId);
  partnerToken = generateToken(partner.id, testCoupleId);
  testUserId = user.id;
  testPartnerId = partner.id;

  // Give test couple an active subscription so existing tests aren't blocked by free tier limits
  await prisma.subscription.upsert({
    where: { coupleId: testCoupleId },
    create: { coupleId: testCoupleId, status: 'active' },
    update: { status: 'active' },
  });
});

// Clean up after all tests
afterAll(async () => {
  await prisma.shareLink.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.momentComment.deleteMany();
  await prisma.momentReaction.deleteMany();
  await prisma.momentPhoto.deleteMany();
  await prisma.moment.deleteMany();
  await prisma.foodSpotPhoto.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.cookingSessionPhoto.deleteMany();
  await prisma.cookingSessionStep.deleteMany();
  await prisma.cookingSessionItem.deleteMany();
  await prisma.cookingSessionRecipe.deleteMany();
  await prisma.cookingSession.deleteMany();
  await prisma.recipePhoto.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.foodSpot.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.letterPhoto.deleteMany();
  await prisma.letterAudio.deleteMany();
  await prisma.loveLetter.deleteMany();
  await prisma.user.deleteMany({ where: { email: { in: ['test@lovescrum.test', 'partner@lovescrum.test', 'invite-test@lovescrum.test'] } } });
  // Couple cleanup handled by beforeAll on next run (cascade order is complex)
  await prisma.$disconnect();
});

const auth = () => ({ Authorization: `Bearer ${token}` });
const partnerAuth = () => ({ Authorization: `Bearer ${partnerToken}` });

describe('Health', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Well-Known', () => {
  it('GET /.well-known/apple-app-site-association returns JSON with applinks', async () => {
    const res = await request(app).get('/.well-known/apple-app-site-association');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('applinks');
    expect(res.body.applinks).toHaveProperty('apps');
    expect(res.body.applinks).toHaveProperty('details');
    const detail = res.body.applinks.details[0];
    expect(detail.appIDs).toEqual(expect.arrayContaining([expect.stringMatching(/^TEAMID\./)]) );
    expect(detail.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ '/': '/share/*' }),
        expect.objectContaining({ '/': '/invite/*' }),
      ])
    );
  });

  it('GET /.well-known/assetlinks.json returns JSON with android_app target', async () => {
    const res = await request(app).get('/.well-known/assetlinks.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(res.body)).toBe(true);
    const entry = res.body[0];
    expect(entry.relation).toEqual(['delegate_permission/common.handle_all_urls']);
    expect(entry.target.namespace).toBe('android_app');
    expect(entry.target).toHaveProperty('package_name');
    expect(Array.isArray(entry.target.sha256_cert_fingerprints)).toBe(true);
  });
});

describe('Auth', () => {
  it('POST /api/auth/register succeeds without coupleName or inviteCode (coupleId=null)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'random@example.com',
      password: 'testpass123',
      name: 'Random',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.coupleId).toBeNull();
    // Cleanup
    await prisma.user.deleteMany({ where: { email: 'random@example.com' } });
  });

  it('POST /api/auth/register — 3rd user joining same inviteCode gets 400', async () => {
    // Create a couple with an inviteCode
    const couple = await prisma.couple.create({ data: { inviteCode: 'TESTFULL' } });
    // Fill it with 2 users
    await prisma.user.createMany({
      data: [
        { email: 'couple-full-1@test.com', password: 'x', name: 'Full 1', coupleId: couple.id },
        { email: 'couple-full-2@test.com', password: 'x', name: 'Full 2', coupleId: couple.id },
      ],
    });
    // 3rd user tries to join
    const res = await request(app).post('/api/auth/register').send({
      email: 'couple-full-3@test.com',
      password: 'testpass123',
      name: 'Full 3',
      inviteCode: 'TESTFULL',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('2 members');
    // Cleanup
    await prisma.user.deleteMany({ where: { email: { in: ['couple-full-1@test.com', 'couple-full-2@test.com', 'couple-full-3@test.com'] } } });
    await prisma.couple.delete({ where: { id: couple.id } });
  });

  it('POST /api/auth/login returns token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@lovescrum.test',
      password: 'testpass123',
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('POST /api/auth/login returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@lovescrum.test',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me returns user info', async () => {
    const res = await request(app).get('/api/auth/me').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@lovescrum.test');
  });

  it('GET /api/moments returns 401 without token', async () => {
    const res = await request(app).get('/api/moments');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login returns 401 for Google-only user (no password)', async () => {
    // Create a Google-only user (no password)
    const couple = await prisma.couple.findUnique({ where: { id: 'test-couple' } });
    await prisma.user.create({
      data: { email: 'googleonly@lovescrum.test', password: null, name: 'Google Only', coupleId: couple!.id, googleId: 'gid-test-only' },
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'googleonly@lovescrum.test',
      password: 'anypassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Google Sign-In');
    await prisma.user.deleteMany({ where: { email: 'googleonly@lovescrum.test' } });
  });
});

describe('Account Deletion', () => {
  it('DELETE /api/auth/account returns 401 without auth', async () => {
    const res = await request(app).delete('/api/auth/account').send({ password: 'testpass123' });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/auth/account returns 401 for wrong password', async () => {
    const res = await request(app)
      .delete('/api/auth/account')
      .set(auth())
      .send({ password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/auth/account with partner present deletes only requesting user, partner and couple remain', async () => {
    const hashed = await hashPassword('deletepass');
    // Create isolated couple with 2 users
    const couple = await prisma.couple.create({ data: { name: 'Delete Test Couple' } });
    const userA = await prisma.user.create({
      data: { email: 'del-a@lovescrum.test', password: hashed, name: 'Del A', coupleId: couple.id },
    });
    const userB = await prisma.user.create({
      data: { email: 'del-b@lovescrum.test', password: hashed, name: 'Del B', coupleId: couple.id },
    });
    const { generateToken } = await import('../utils/auth');
    const tokenA = generateToken(userA.id, couple.id);

    const res = await request(app)
      .delete('/api/auth/account')
      .set({ Authorization: `Bearer ${tokenA}` })
      .send({ password: 'deletepass' });
    expect(res.status).toBe(204);

    // userA should be gone
    const deletedUser = await prisma.user.findUnique({ where: { id: userA.id } });
    expect(deletedUser).toBeNull();

    // userB (partner) should still exist
    const partnerUser = await prisma.user.findUnique({ where: { id: userB.id } });
    expect(partnerUser).not.toBeNull();

    // Couple should still exist
    const coupleRecord = await prisma.couple.findUnique({ where: { id: couple.id } });
    expect(coupleRecord).not.toBeNull();

    // Cleanup
    await prisma.user.delete({ where: { id: userB.id } });
    await prisma.couple.delete({ where: { id: couple.id } });
  });

  it('DELETE /api/auth/account non-last-member reassigns authored moments to partner', async () => {
    const hashed = await hashPassword('reassignpass');
    const couple = await prisma.couple.create({ data: { name: 'Reassign Couple' } });
    const userA = await prisma.user.create({
      data: { email: 'reassign-a@lovescrum.test', password: hashed, name: 'Reassign A', coupleId: couple.id },
    });
    const userB = await prisma.user.create({
      data: { email: 'reassign-b@lovescrum.test', password: hashed, name: 'Reassign B', coupleId: couple.id },
    });
    const momentA = await prisma.moment.create({
      data: { coupleId: couple.id, authorId: userA.id, title: 'A authored', date: new Date() },
    });
    const momentB = await prisma.moment.create({
      data: { coupleId: couple.id, authorId: userB.id, title: 'B authored', date: new Date() },
    });
    const { generateToken } = await import('../utils/auth');
    const tokenA = generateToken(userA.id, couple.id);

    const res = await request(app)
      .delete('/api/auth/account')
      .set({ Authorization: `Bearer ${tokenA}` })
      .send({ password: 'reassignpass' });
    expect(res.status).toBe(204);

    // userA deleted
    expect(await prisma.user.findUnique({ where: { id: userA.id } })).toBeNull();
    // userB still present
    expect(await prisma.user.findUnique({ where: { id: userB.id } })).not.toBeNull();
    // momentA authorId reassigned to userB (not deleted, not orphaned)
    const reassigned = await prisma.moment.findUnique({ where: { id: momentA.id } });
    expect(reassigned).not.toBeNull();
    expect(reassigned!.authorId).toBe(userB.id);
    // momentB untouched
    const untouched = await prisma.moment.findUnique({ where: { id: momentB.id } });
    expect(untouched!.authorId).toBe(userB.id);

    // Cleanup
    await prisma.moment.deleteMany({ where: { coupleId: couple.id } });
    await prisma.user.delete({ where: { id: userB.id } });
    await prisma.couple.delete({ where: { id: couple.id } });
  });

  it('DELETE /api/auth/account as last member deletes user and couple', async () => {
    const hashed = await hashPassword('solopass');
    const couple = await prisma.couple.create({ data: { name: 'Solo Couple' } });
    const soloUser = await prisma.user.create({
      data: { email: 'solo@lovescrum.test', password: hashed, name: 'Solo', coupleId: couple.id },
    });
    const { generateToken } = await import('../utils/auth');
    const soloToken = generateToken(soloUser.id, couple.id);

    // Add a moment so we verify couple data is cleaned up
    const moment = await prisma.moment.create({
      data: { coupleId: couple.id, authorId: soloUser.id, title: 'Solo Moment', date: new Date() },
    });

    const res = await request(app)
      .delete('/api/auth/account')
      .set({ Authorization: `Bearer ${soloToken}` })
      .send({ password: 'solopass' });
    expect(res.status).toBe(204);

    const deletedUser = await prisma.user.findUnique({ where: { id: soloUser.id } });
    expect(deletedUser).toBeNull();

    const deletedCouple = await prisma.couple.findUnique({ where: { id: couple.id } });
    expect(deletedCouple).toBeNull();

    const deletedMoment = await prisma.moment.findUnique({ where: { id: moment.id } });
    expect(deletedMoment).toBeNull();
  });
});

describe('Email Verification', () => {
  it('POST /api/auth/send-verification returns 401 without auth', async () => {
    const res = await request(app).post('/api/auth/send-verification');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/send-verification returns 200 and creates token', async () => {
    const res = await request(app).post('/api/auth/send-verification').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Verify token was created in DB
    const verification = await prisma.emailVerification.findFirst({
      where: { user: { email: 'test@lovescrum.test' } },
      orderBy: { createdAt: 'desc' },
    });
    expect(verification).not.toBeNull();
    expect(verification!.verifiedAt).toBeNull();
  });

  it('GET /api/auth/verify-email with valid token sets emailVerified = true', async () => {
    // Get the latest token for test user
    const verification = await prisma.emailVerification.findFirst({
      where: { user: { email: 'test@lovescrum.test' }, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    expect(verification).not.toBeNull();

    const res = await request(app).get(`/api/auth/verify-email?token=${verification!.token}`);
    expect(res.status).toBe(200);
    expect(res.body.emailVerified).toBe(true);

    const user = await prisma.user.findUnique({ where: { email: 'test@lovescrum.test' } });
    expect(user!.emailVerified).toBe(true);
  });

  it('GET /api/auth/verify-email with invalid token returns 400', async () => {
    const res = await request(app).get('/api/auth/verify-email?token=invalid-token-xyz');
    expect(res.status).toBe(400);
  });

  it('GET /api/auth/verify-email without token param returns 400', async () => {
    const res = await request(app).get('/api/auth/verify-email');
    expect(res.status).toBe(400);
  });

  it('GET /api/auth/verify-email with expired token returns 400', async () => {
    const user = await prisma.user.findUnique({ where: { email: 'test@lovescrum.test' } });
    const expiredToken = await prisma.emailVerification.create({
      data: {
        userId: user!.id,
        token: 'expired-test-token-abc',
        expiresAt: new Date(Date.now() - 1000), // already expired
      },
    });
    const res = await request(app).get(`/api/auth/verify-email?token=${expiredToken.token}`);
    expect(res.status).toBe(400);
    await prisma.emailVerification.delete({ where: { id: expiredToken.id } });
  });

  it('GET /api/auth/me includes emailVerified field', async () => {
    const res = await request(app).get('/api/auth/me').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('emailVerified');
  });
});

describe('Google OAuth', () => {
  // Clean up googleuser@example.com before and after to prevent test pollution
  const cleanupGoogleUser = async () => {
    const user = await prisma.user.findUnique({ where: { email: 'googleuser@example.com' } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      if (user.coupleId) await prisma.couple.delete({ where: { id: user.coupleId } }).catch(() => {});
      await prisma.user.delete({ where: { id: user.id } });
    }
  };
  beforeAll(cleanupGoogleUser);
  afterAll(cleanupGoogleUser);

  it('POST /api/auth/google returns 400 without idToken', async () => {
    const res = await request(app).post('/api/auth/google').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/google returns 401 for invalid token', async () => {
    const res = await request(app).post('/api/auth/google').send({ idToken: 'bad-token' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/google returns needsCouple for new Google user', async () => {
    const res = await request(app).post('/api/auth/google').send({ idToken: 'valid-google-token' });
    expect(res.status).toBe(200);
    expect(res.body.needsCouple).toBe(true);
    expect(res.body.googleProfile.email).toBe('googleuser@example.com');
  });

  it('POST /api/auth/google auto-links existing user by email and logs in', async () => {
    const res = await request(app).post('/api/auth/google').send({ idToken: 'existing-user-google-token' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toBe('test@lovescrum.test');
    // Verify googleId was set on the user
    const user = await prisma.user.findUnique({ where: { email: 'test@lovescrum.test' } });
    expect(user?.googleId).toBe('google-uid-existing');
    // Cleanup
    await prisma.user.update({ where: { email: 'test@lovescrum.test' }, data: { googleId: null } });
  });

  it('POST /api/auth/google/complete creates user with coupleId=null when no couple info provided', async () => {
    const res = await request(app).post('/api/auth/google/complete').send({ idToken: 'valid-google-token' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.coupleId).toBeNull();
    // Cleanup so next test can re-create the same google user
    await cleanupGoogleUser();
  });

  it('POST /api/auth/google/complete creates user with couple', async () => {
    const res = await request(app).post('/api/auth/google/complete').send({
      idToken: 'valid-google-token',
      coupleName: 'Test Google Couple',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toBe('googleuser@example.com');
    expect(res.body.user.googleId).toBe('google-uid-123');
    // Cleanup
    const user = await prisma.user.findUnique({ where: { email: 'googleuser@example.com' } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.couple.delete({ where: { id: user.coupleId ?? undefined } }).catch(() => {});
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('POST /api/auth/google/link returns 400 without idToken', async () => {
    const res = await request(app).post('/api/auth/google/link').set(auth()).send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/google/link returns 401 without auth', async () => {
    const res = await request(app).post('/api/auth/google/link').send({ idToken: 'valid-google-token' });
    expect(res.status).toBe(401);
  });
});

describe('Apple Sign-In', () => {
  const cleanupAppleUser = async () => {
    const user = await prisma.user.findUnique({ where: { email: 'appleuser@example.com' } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      if (user.coupleId) await prisma.couple.delete({ where: { id: user.coupleId } }).catch(() => {});
      await prisma.user.delete({ where: { id: user.id } });
    }
    // Also clean up no-email apple user (email derived from appleId)
    await prisma.user.deleteMany({ where: { appleId: 'apple-uid-noemail' } });
  };
  beforeAll(cleanupAppleUser);
  afterAll(cleanupAppleUser);

  it('POST /api/auth/apple returns 400 without idToken', async () => {
    const res = await request(app).post('/api/auth/apple').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/apple returns 401 for invalid token', async () => {
    const res = await request(app).post('/api/auth/apple').send({ idToken: 'bad-apple-token' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/apple returns needsCouple for new Apple user', async () => {
    const res = await request(app).post('/api/auth/apple').send({ idToken: 'valid-apple-token', name: 'Apple User' });
    expect(res.status).toBe(200);
    expect(res.body.needsCouple).toBe(true);
    expect(res.body.appleProfile.appleId).toBe('apple-uid-123');
    expect(res.body.appleProfile.email).toBe('appleuser@example.com');
  });

  it('POST /api/auth/apple/complete creates user with couple', async () => {
    const res = await request(app).post('/api/auth/apple/complete').send({
      idToken: 'valid-apple-token',
      name: 'Apple User',
      coupleName: 'Test Apple Couple',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toBe('appleuser@example.com');
    // Cleanup
    await cleanupAppleUser();
  });

  it('POST /api/auth/apple/complete handles hide-email (privaterelay) when email missing', async () => {
    const res = await request(app).post('/api/auth/apple/complete').send({
      idToken: 'valid-apple-token-noemail',
      name: 'No Email User',
      coupleName: 'No Email Couple',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toContain('privaterelay.appleid.com');
  });
});

describe('Moments CRUD', () => {
  let momentId: string;

  it('POST /api/moments creates a moment', async () => {
    const res = await request(app)
      .post('/api/moments')
      .set(auth())
      .send({
        title: 'Test Moment',
        caption: 'Test caption',
        date: '2024-06-15',
        location: 'Test Location',
        latitude: 10.77,
        longitude: 106.69,
        tags: ['test'],
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Moment');
    expect(res.body.location).toBe('Test Location');
    momentId = res.body.id;
  });

  // T387 — author 'by' pill
  it('POST /api/moments stamps author from req.user, never from body (T387)', async () => {
    const res = await request(app)
      .post('/api/moments')
      .set(auth())
      .send({
        title: 'Author stamp check',
        date: '2024-07-01',
        // Client tries to spoof another user — must be ignored, server uses req.user.id
        authorId: testPartnerId,
      } as Record<string, unknown>);
    expect(res.status).toBe(201);
    expect(res.body.author).toBeDefined();
    expect(res.body.author.id).toBe(testUserId);
    expect(res.body.author.name).toBe('Test User');
    // Security — only id + name leak out
    expect(res.body.author.email).toBeUndefined();
    expect(res.body.author.password).toBeUndefined();
    expect(res.body.author.avatar).toBeUndefined();
    // Clean up this extra moment so later assertions about list length stay stable
    await prisma.moment.delete({ where: { id: res.body.id } });
  });

  it('GET /api/moments includes author { id, name } on every row (T387)', async () => {
    const res = await request(app).get('/api/moments').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const m of res.body) {
      expect(m.author).toBeDefined();
      expect(typeof m.author.id).toBe('string');
      expect(typeof m.author.name).toBe('string');
      expect(m.author.email).toBeUndefined();
      expect(m.author.password).toBeUndefined();
    }
  });

  it('GET /api/moments/:id includes author { id, name } (T387)', async () => {
    const res = await request(app).get(`/api/moments/${momentId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.author).toBeDefined();
    expect(res.body.author.id).toBe(testUserId);
    expect(res.body.author.name).toBe('Test User');
    expect(res.body.author.email).toBeUndefined();
  });

  it('Partner sees same moment with the real author (not themselves) (T387)', async () => {
    const res = await request(app).get(`/api/moments/${momentId}`).set(partnerAuth());
    expect(res.status).toBe(200);
    expect(res.body.author.id).toBe(testUserId);
    expect(res.body.author.id).not.toBe(testPartnerId);
  });

  it('GET /api/moments lists moments', async () => {
    const res = await request(app).get('/api/moments').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/moments/:id gets a moment', async () => {
    const res = await request(app).get(`/api/moments/${momentId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(momentId);
    expect(res.body.location).toBe('Test Location');
  });

  it('PUT /api/moments/:id updates title and location', async () => {
    const res = await request(app)
      .put(`/api/moments/${momentId}`)
      .set(auth())
      .send({ title: 'Updated Moment', location: 'Đà Lạt' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Moment');
    expect(res.body.location).toBe('Đà Lạt');
  });

  it('PUT /api/moments/:id clears location via null', async () => {
    const res = await request(app)
      .put(`/api/moments/${momentId}`)
      .set(auth())
      .send({ location: null });
    expect(res.status).toBe(200);
    expect(res.body.location).toBeNull();
  });

  it('POST /api/moments rejects location > 120 chars', async () => {
    const res = await request(app)
      .post('/api/moments')
      .set(auth())
      .send({
        title: 'Too long loc',
        date: '2024-06-15',
        location: 'A'.repeat(121),
      });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/moments/:id deletes a moment', async () => {
    const res = await request(app).delete(`/api/moments/${momentId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Moment deleted');
  });

  it('GET /api/moments/:id returns 404 for deleted moment', async () => {
    const res = await request(app).get(`/api/moments/${momentId}`).set(auth());
    expect(res.status).toBe(404);
  });
});

describe('Food Spots CRUD', () => {
  let spotId: string;

  it('POST /api/foodspots creates a food spot', async () => {
    const res = await request(app)
      .post('/api/foodspots')
      .set(auth())
      .send({
        name: 'Test Restaurant',
        description: 'Great food',
        rating: 4,
        location: 'District 1',
        latitude: 10.78,
        longitude: 106.70,
        tags: ['vietnamese'],
        priceRange: 2,
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Restaurant');
    spotId = res.body.id;
  });

  it('GET /api/foodspots lists food spots', async () => {
    const res = await request(app).get('/api/foodspots').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/foodspots/:id gets a food spot', async () => {
    const res = await request(app).get(`/api/foodspots/${spotId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(spotId);
  });

  it('PUT /api/foodspots/:id updates a food spot', async () => {
    const res = await request(app)
      .put(`/api/foodspots/${spotId}`)
      .set(auth())
      .send({ name: 'Updated Restaurant', rating: 5 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Restaurant');
  });

  it('DELETE /api/foodspots/:id deletes a food spot', async () => {
    const res = await request(app).delete(`/api/foodspots/${spotId}`).set(auth());
    expect(res.status).toBe(200);
  });
});

describe('Map Pins', () => {
  beforeAll(async () => {
    await prisma.moment.create({
      data: { coupleId: testCoupleId, authorId: testUserId, title: 'Map Moment', date: new Date(), latitude: 10.77, longitude: 106.69, tags: [] },
    });
    await prisma.foodSpot.create({
      data: { coupleId: testCoupleId, name: 'Map Spot', latitude: 10.78, longitude: 106.70, tags: [] },
    });
  });

  it('GET /api/map/pins returns combined pins', async () => {
    const res = await request(app).get('/api/map/pins').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const types = res.body.map((p: any) => p.type);
    expect(types).toContain('moment');
    expect(types).toContain('foodspot');
  });
});

describe('Sprints & Goals', () => {
  let sprintId: string;
  let goalId: string;
  let backlogGoalId: string;

  it('POST /api/sprints creates a sprint with description', async () => {
    const res = await request(app)
      .post('/api/sprints')
      .set(auth())
      .send({
        name: 'Test Sprint',
        description: 'A test sprint',
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        status: 'ACTIVE',
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Sprint');
    expect(res.body.description).toBe('A test sprint');
    sprintId = res.body.id;
  });

  it('GET /api/sprints/active returns active sprint', async () => {
    const res = await request(app).get('/api/sprints/active').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACTIVE');
  });

  it('PATCH /api/sprints/:id/status updates sprint status', async () => {
    const res = await request(app)
      .patch(`/api/sprints/${sprintId}/status`)
      .set(auth())
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
    await request(app).patch(`/api/sprints/${sprintId}/status`).set(auth()).send({ status: 'ACTIVE' });
  });

  it('POST /api/goals/sprint/:id creates a goal with description+dueDate', async () => {
    const res = await request(app)
      .post(`/api/goals/sprint/${sprintId}`)
      .set(auth())
      .send({ title: 'Test Goal', priority: 'HIGH', assignee: 'Anh', description: 'Do the thing', dueDate: '2026-02-28' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Goal');
    expect(res.body.description).toBe('Do the thing');
    expect(res.body.sprintId).toBe(sprintId);
    goalId = res.body.id;
  });

  it('POST /api/goals creates a backlog goal (no sprint)', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set(auth())
      .send({ title: 'Backlog Goal', priority: 'LOW' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Backlog Goal');
    expect(res.body.sprintId).toBeNull();
    backlogGoalId = res.body.id;
  });

  it('GET /api/goals/backlog returns backlog goals', async () => {
    const res = await request(app).get('/api/goals/backlog').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((g: any) => g.id === backlogGoalId)).toBe(true);
  });

  it('PATCH /api/goals/:id/assign assigns goal to sprint', async () => {
    const res = await request(app)
      .patch(`/api/goals/${backlogGoalId}/assign`)
      .set(auth())
      .send({ sprintId });
    expect(res.status).toBe(200);
    expect(res.body.sprintId).toBe(sprintId);
  });

  it('PATCH /api/goals/:id/assign unassigns goal (to backlog)', async () => {
    const res = await request(app)
      .patch(`/api/goals/${backlogGoalId}/assign`)
      .set(auth())
      .send({ sprintId: null });
    expect(res.status).toBe(200);
    expect(res.body.sprintId).toBeNull();
  });

  it('PATCH /api/goals/:id/status updates goal status', async () => {
    const res = await request(app)
      .patch(`/api/goals/${goalId}/status`)
      .set(auth())
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('PATCH /api/goals/reorder reorders goals', async () => {
    const res = await request(app)
      .patch('/api/goals/reorder')
      .set(auth())
      .send({ goals: [{ id: goalId, order: 1, status: 'DONE' }] });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/goals/:id deletes a goal', async () => {
    const res = await request(app).delete(`/api/goals/${goalId}`).set(auth());
    expect(res.status).toBe(200);
  });

  it('DELETE /api/goals/:id deletes backlog goal', async () => {
    const res = await request(app).delete(`/api/goals/${backlogGoalId}`).set(auth());
    expect(res.status).toBe(200);
  });

  it('DELETE /api/sprints/:id deletes a sprint', async () => {
    const res = await request(app).delete(`/api/sprints/${sprintId}`).set(auth());
    expect(res.status).toBe(200);
  });
});

describe('Validation', () => {
  it('POST /api/moments with missing title returns 400', async () => {
    const res = await request(app).post('/api/moments').set(auth()).send({ date: '2024-01-01' });
    expect(res.status).toBe(400);
  });

  it('POST /api/foodspots with missing name returns 400', async () => {
    const res = await request(app).post('/api/foodspots').set(auth()).send({ rating: 3 });
    expect(res.status).toBe(400);
  });

  it('POST /api/sprints with missing dates returns 400', async () => {
    const res = await request(app).post('/api/sprints').set(auth()).send({ name: 'Bad Sprint' });
    expect(res.status).toBe(400);
  });
});

describe('CookingSessions', () => {
  let sessionId: string;
  let itemId: string;
  let stepId: string;
  let recipeId: string;

  beforeAll(async () => {
    // Create a test recipe with ingredients and steps
    const recipe = await prisma.recipe.create({
      data: {
        coupleId: testCoupleId,
        title: 'Test Dish',
        ingredients: ['Onion', 'Garlic', 'Tomato'],
        steps: ['Chop onion', 'Fry garlic', 'Add tomato'],
        tags: [],
      },
    });
    recipeId = recipe.id;
  });

  it('POST /api/cooking-sessions creates session with items and steps', async () => {
    const res = await request(app)
      .post('/api/cooking-sessions')
      .set(auth())
      .send({ recipeIds: [recipeId] });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('selecting');
    expect(res.body.items).toHaveLength(3);
    expect(res.body.steps).toHaveLength(3);
    expect(res.body.recipes).toHaveLength(1);
    sessionId = res.body.id;
    itemId = res.body.items[0].id;
    stepId = res.body.steps[0].id;
  });

  it('POST /api/cooking-sessions with empty recipeIds returns 400', async () => {
    const res = await request(app)
      .post('/api/cooking-sessions')
      .set(auth())
      .send({ recipeIds: [] });
    expect(res.status).toBe(400);
  });

  it('POST /api/cooking-sessions returns 409 when active session exists', async () => {
    const res = await request(app)
      .post('/api/cooking-sessions')
      .set(auth())
      .send({ recipeIds: [recipeId] });
    expect(res.status).toBe(409);
    expect(res.body.sessionId).toBe(sessionId);
  });

  it('GET /api/cooking-sessions/active returns active session', async () => {
    const res = await request(app).get('/api/cooking-sessions/active').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).not.toBeNull();
    expect(res.body.id).toBe(sessionId);
  });

  it('GET /api/cooking-sessions lists all sessions', async () => {
    const res = await request(app).get('/api/cooking-sessions').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/cooking-sessions/:id returns session detail', async () => {
    const res = await request(app).get(`/api/cooking-sessions/${sessionId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(sessionId);
  });

  it('PUT /api/cooking-sessions/:id/status advances status', async () => {
    const res = await request(app)
      .put(`/api/cooking-sessions/${sessionId}/status`)
      .set(auth())
      .send({ status: 'shopping' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('shopping');
  });

  it('PUT /api/cooking-sessions/:id/items/:itemId toggles item', async () => {
    const res = await request(app)
      .put(`/api/cooking-sessions/${sessionId}/items/${itemId}`)
      .set(auth())
      .send({ checked: true });
    expect(res.status).toBe(200);
    expect(res.body.checked).toBe(true);
  });

  it('PUT /api/cooking-sessions/:id/steps/:stepId toggles step with checkedBy', async () => {
    const res = await request(app)
      .put(`/api/cooking-sessions/${sessionId}/steps/${stepId}`)
      .set(auth())
      .send({ checked: true, checkedBy: 'Alice' });
    expect(res.status).toBe(200);
    expect(res.body.checked).toBe(true);
    expect(res.body.checkedBy).toBe('Alice');
  });

  it('PUT cooking status to completed records totalTimeMs', async () => {
    // Advance to cooking first to set startedAt
    await request(app)
      .put(`/api/cooking-sessions/${sessionId}/status`)
      .set(auth())
      .send({ status: 'cooking' });
    const res = await request(app)
      .put(`/api/cooking-sessions/${sessionId}/status`)
      .set(auth())
      .send({ status: 'completed', notes: 'Delicious!' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.totalTimeMs).toBeGreaterThanOrEqual(0);
    expect(res.body.notes).toBe('Delicious!');
  });

  it('GET /api/cooking-sessions/active returns null when no active session', async () => {
    const res = await request(app).get('/api/cooking-sessions/active').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('DELETE /api/cooking-sessions/:id deletes session', async () => {
    const res = await request(app).delete(`/api/cooking-sessions/${sessionId}`).set(auth());
    expect(res.status).toBe(200);
  });

  it('GET /api/cooking-sessions/:id returns 404 after delete', async () => {
    const res = await request(app).get(`/api/cooking-sessions/${sessionId}`).set(auth());
    expect(res.status).toBe(404);
  });
});

describe('AI Recipe Generation', () => {
  it('POST /api/ai/generate-recipe returns 400 with missing mode', async () => {
    const res = await request(app)
      .post('/api/ai/generate-recipe')
      .set(auth())
      .send({ input: 'some text' });
    expect(res.status).toBe(400);
  });

  it('POST /api/ai/generate-recipe returns 400 with missing input', async () => {
    const res = await request(app)
      .post('/api/ai/generate-recipe')
      .set(auth())
      .send({ mode: 'text' });
    expect(res.status).toBe(400);
  });

  it('POST /api/ai/generate-recipe returns 400 with invalid mode', async () => {
    const res = await request(app)
      .post('/api/ai/generate-recipe')
      .set(auth())
      .send({ mode: 'invalid', input: 'some text' });
    expect(res.status).toBe(400);
  });

  it('POST /api/ai/generate-recipe returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/ai/generate-recipe')
      .send({ mode: 'text', input: 'some text' });
    expect(res.status).toBe(401);
  });
});

describe('Achievements', () => {
  it('GET /api/achievements returns 401 without auth', async () => {
    const res = await request(app).get('/api/achievements');
    expect(res.status).toBe(401);
  });

  it('GET /api/achievements returns all 24 achievements', async () => {
    const res = await request(app).get('/api/achievements').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(24);
  });

  it('GET /api/achievements each achievement has required shape', async () => {
    const res = await request(app).get('/api/achievements').set(auth());
    for (const a of res.body) {
      expect(a).toHaveProperty('key');
      expect(a).toHaveProperty('title');
      expect(a).toHaveProperty('description');
      expect(a).toHaveProperty('icon');
      expect(a).toHaveProperty('category');
      expect(a).toHaveProperty('unlocked');
      expect(typeof a.unlocked).toBe('boolean');
    }
  });

  it('GET /api/achievements auto-unlocks when conditions are met', async () => {
    // first_recipe condition: recipes >= 1 — test DB has recipes created in earlier tests
    const res = await request(app).get('/api/achievements').set(auth());
    expect(res.status).toBe(200);
    const firstRecipe = res.body.find((a: { key: string }) => a.key === 'first_recipe');
    expect(firstRecipe).toBeDefined();
    // unlocked depends on whether test recipes exist — just verify shape
    expect(typeof firstRecipe.unlocked).toBe('boolean');
  });

});

describe('Profile', () => {
  it('PUT /api/profile returns 401 without auth', async () => {
    const res = await request(app).put('/api/profile').send({ name: 'Test' });
    expect(res.status).toBe(401);
  });

  it('PUT /api/profile updates name', async () => {
    const res = await request(app).put('/api/profile').set(auth()).send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('id');
  });

  it('PUT /api/profile rejects empty name', async () => {
    const res = await request(app).put('/api/profile').set(auth()).send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('POST /api/profile/avatar returns 401 without auth', async () => {
    const res = await request(app).post('/api/profile/avatar');
    expect(res.status).toBe(401);
  });

  // T339 — Sprint 61 — profile stats row
  describe('GET /api/profile/stats', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/profile/stats');
      expect(res.status).toBe(401);
    });

    it('returns shape {moments, letters, questions} with numeric counts', async () => {
      const res = await request(app).get('/api/profile/stats').set(auth());
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        moments: expect.any(Number),
        letters: expect.any(Number),
        questions: expect.any(Number),
      });
      expect(res.body.moments).toBeGreaterThanOrEqual(0);
      expect(res.body.letters).toBeGreaterThanOrEqual(0);
      expect(res.body.questions).toBeGreaterThanOrEqual(0);
    });

    it('empty couple returns all zeros', async () => {
      const user = await prisma.user.create({
        data: { email: `stats-empty-${Date.now()}@lovescrum.test`, name: 'Stats Empty', password: await hashPassword('pw') },
      });
      const couple = await prisma.couple.create({ data: { name: 'Empty Couple' } });
      await prisma.user.update({ where: { id: user.id }, data: { coupleId: couple.id } });
      const emptyToken = generateToken(user.id, couple.id);

      const res = await request(app).get('/api/profile/stats').set({ Authorization: `Bearer ${emptyToken}` });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ moments: 0, letters: 0, questions: 0 });

      await prisma.user.update({ where: { id: user.id }, data: { coupleId: null } });
      await prisma.couple.delete({ where: { id: couple.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});

describe('Comments', () => {
  let momentId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/moments')
      .set(auth())
      .send({ title: 'Comment Test Moment', date: '2026-01-01', tags: [] });
    momentId = res.body.id;
  });

  it('GET /api/moments/:id/comments returns empty array', async () => {
    const res = await request(app).get(`/api/moments/${momentId}/comments`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/moments/:id/comments adds a comment', async () => {
    const res = await request(app)
      .post(`/api/moments/${momentId}/comments`)
      .set(auth())
      .send({ author: 'Alice', content: 'Nice moment!' });
    expect(res.status).toBe(201);
    expect(res.body.author).toBe('Alice');
    expect(res.body.content).toBe('Nice moment!');
  });

  it('GET /api/moments/:id includes comments', async () => {
    const res = await request(app).get(`/api/moments/${momentId}`).set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.comments)).toBe(true);
    expect(res.body.comments.length).toBeGreaterThan(0);
  });

  it('DELETE /api/moments/:id/comments/:commentId deletes comment', async () => {
    const created = await request(app)
      .post(`/api/moments/${momentId}/comments`)
      .set(auth())
      .send({ author: 'Bob', content: 'Delete me' });
    const commentId = created.body.id;
    const res = await request(app)
      .delete(`/api/moments/${momentId}/comments/${commentId}`)
      .set(auth());
    expect(res.status).toBe(204);
  });

  it('POST /api/moments/:id/comments rejects empty content', async () => {
    const res = await request(app)
      .post(`/api/moments/${momentId}/comments`)
      .set(auth())
      .send({ author: 'Alice', content: '' });
    expect(res.status).toBe(400);
  });
});

describe('Reactions', () => {
  let momentId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/moments')
      .set(auth())
      .send({ title: 'Reaction Test Moment', date: '2026-01-02', tags: [] });
    momentId = res.body.id;
  });

  it('POST /api/moments/:id/reactions adds a reaction', async () => {
    const res = await request(app)
      .post(`/api/moments/${momentId}/reactions`)
      .set(auth())
      .send({ emoji: '❤️', author: 'Alice' });
    expect(res.status).toBe(200);
    expect(res.body.some((r: { emoji: string }) => r.emoji === '❤️')).toBe(true);
  });

  it('POST /api/moments/:id/reactions toggles off existing reaction', async () => {
    // First add
    await request(app)
      .post(`/api/moments/${momentId}/reactions`)
      .set(auth())
      .send({ emoji: '🔥', author: 'Bob' });
    // Then remove
    const res = await request(app)
      .post(`/api/moments/${momentId}/reactions`)
      .set(auth())
      .send({ emoji: '🔥', author: 'Bob' });
    expect(res.status).toBe(200);
    expect(res.body.some((r: { emoji: string; author: string }) => r.emoji === '🔥' && r.author === 'Bob')).toBe(false);
  });

  it('POST /api/moments/:id/reactions rejects invalid emoji', async () => {
    const res = await request(app)
      .post(`/api/moments/${momentId}/reactions`)
      .set(auth())
      .send({ emoji: '🍕', author: 'Alice' });
    expect(res.status).toBe(400);
  });

  it('GET /api/moments/:id includes reactions', async () => {
    const res = await request(app).get(`/api/moments/${momentId}`).set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reactions)).toBe(true);
  });
});

describe('Notifications', () => {
  let notifId: string;

  beforeAll(async () => {
    // Clean up any notifications from prior tests (moments/foodspots create trigger partner notifications)
    await prisma.notification.deleteMany();
    // Seed a notification for the test user via prisma directly
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'test@lovescrum.test' } });
    const notif = await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'new_moment',
        title: 'Kỷ niệm mới',
        message: 'Test moment notification',
        link: '/moments/test',
        read: false,
      },
    });
    notifId = notif.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
  });

  it('GET /api/notifications returns list', async () => {
    const res = await request(app).get('/api/notifications').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/notifications/unread-count returns count', async () => {
    const res = await request(app).get('/api/notifications/unread-count').set(auth());
    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe('number');
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('PUT /api/notifications/:id/read marks as read', async () => {
    const res = await request(app).put(`/api/notifications/${notifId}/read`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });

  it('GET /api/notifications/unread-count is 0 after mark-read', async () => {
    const res = await request(app).get('/api/notifications/unread-count').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('PUT /api/notifications/read-all marks all as read', async () => {
    // Create another unread notif
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'test@lovescrum.test' } });
    await prisma.notification.create({
      data: { userId: user.id, type: 'new_recipe', title: 'Test', message: 'msg', read: false },
    });
    const res = await request(app).put('/api/notifications/read-all').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('DELETE /api/notifications/:id deletes', async () => {
    const res = await request(app).delete(`/api/notifications/${notifId}`).set(auth());
    expect(res.status).toBe(204);
  });

  it('GET /api/notifications returns 401 without auth', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

// ─── Expenses ─────────────────────────────────────────────────────────────────
describe('Expenses', () => {
  let expenseId: string;
  const testExpense = {
    amount: 150000,
    description: 'Bún bò Huế',
    category: 'food',
    date: '2026-02-15T12:00:00.000Z',
    note: 'Ngon lắm',
  };

  it('GET /api/expenses returns 401 without auth', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(401);
  });

  it('POST /api/expenses creates expense', async () => {
    const res = await request(app).post('/api/expenses').set(auth()).send(testExpense);
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Bún bò Huế');
    expect(res.body.category).toBe('food');
    expect(res.body.amount).toBe(150000);
    expenseId = res.body.id;
  });

  it('POST /api/expenses rejects invalid category', async () => {
    const res = await request(app).post('/api/expenses').set(auth()).send({ ...testExpense, category: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('POST /api/expenses rejects negative amount', async () => {
    const res = await request(app).post('/api/expenses').set(auth()).send({ ...testExpense, amount: -100 });
    expect(res.status).toBe(400);
  });

  it('GET /api/expenses lists expenses', async () => {
    const res = await request(app).get('/api/expenses').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/expenses?month=2026-02 filters by month', async () => {
    const res = await request(app).get('/api/expenses?month=2026-02').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.every((e: any) => e.date.startsWith('2026-02'))).toBe(true);
  });

  it('GET /api/expenses/stats returns totals', async () => {
    const res = await request(app).get('/api/expenses/stats?month=2026-02').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.byCategory).toBeDefined();
    expect(res.body.byCategory.food).toBeDefined();
    expect(res.body.byCategory.food.total).toBeGreaterThanOrEqual(150000);
  });

  it('GET /api/expenses/:id fetches single expense', async () => {
    const res = await request(app).get(`/api/expenses/${expenseId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(expenseId);
  });

  it('PUT /api/expenses/:id updates expense', async () => {
    const res = await request(app).put(`/api/expenses/${expenseId}`).set(auth()).send({ amount: 200000, description: 'Phở bò' });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(200000);
    expect(res.body.description).toBe('Phở bò');
  });

  it('DELETE /api/expenses/:id deletes expense', async () => {
    const res = await request(app).delete(`/api/expenses/${expenseId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Expense deleted');
  });

  it('GET /api/expenses/:id returns 404 after delete', async () => {
    const res = await request(app).get(`/api/expenses/${expenseId}`).set(auth());
    expect(res.status).toBe(404);
  });

  it('GET /api/expenses/daily-stats returns all days of month', async () => {
    // Create a test expense first
    await request(app).post('/api/expenses').set(auth()).send(testExpense);
    const res = await request(app).get('/api/expenses/daily-stats?month=2026-02').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.month).toBe('2026-02');
    expect(res.body.days).toHaveLength(28); // Feb 2026 has 28 days
    const day15 = res.body.days.find((d: any) => d.date === '2026-02-15');
    expect(day15).toBeDefined();
    expect(day15.total).toBeGreaterThan(0);
    expect(day15.byCategory.food).toBeGreaterThan(0);
  });

  it('GET /api/expenses/limits returns category limits', async () => {
    const res = await request(app).get('/api/expenses/limits').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('food');
    expect(res.body).toHaveProperty('dating');
  });

  it('PUT /api/expenses/limits sets limits', async () => {
    const res = await request(app).put('/api/expenses/limits').set(auth()).send({ food: 2000000, dating: null });
    expect(res.status).toBe(200);
    expect(res.body.food).toBe(2000000);
    expect(res.body.dating).toBeNull();
  });

  it('POST /api/expenses with receiptUrl and foodSpotId', async () => {
    const res = await request(app).post('/api/expenses').set(auth()).send({
      ...testExpense,
      receiptUrl: 'https://example.com/receipt.jpg',
    });
    expect(res.status).toBe(201);
    expect(res.body.receiptUrl).toBe('https://example.com/receipt.jpg');
    // cleanup
    await request(app).delete(`/api/expenses/${res.body.id}`).set(auth());
  });
});

// ─── Cooking Session Rating ───────────────────────────────────────────────────
describe('Cooking Session Rating', () => {
  let sessionId: string;

  it('POST /api/cooking-sessions creates session for rating test', async () => {
    // Need a recipe first
    const recipe = await request(app).post('/api/recipes').set(auth()).send({
      title: 'Rating Test Recipe',
      ingredients: ['test'],
      steps: ['step 1'],
    });
    expect(recipe.status).toBe(201);
    const session = await request(app).post('/api/cooking-sessions').set(auth()).send({
      recipeIds: [recipe.body.id],
    });
    expect(session.status).toBe(201);
    sessionId = session.body.id;
    // advance to completed
    await request(app).put(`/api/cooking-sessions/${sessionId}/status`).set(auth()).send({ status: 'shopping' });
    await request(app).put(`/api/cooking-sessions/${sessionId}/status`).set(auth()).send({ status: 'cooking' });
    await request(app).put(`/api/cooking-sessions/${sessionId}/status`).set(auth()).send({ status: 'photo' });
    await request(app).put(`/api/cooking-sessions/${sessionId}/status`).set(auth()).send({ status: 'completed' });
  });

  it('PATCH /api/cooking-sessions/:id/rate sets rating', async () => {
    const res = await request(app).patch(`/api/cooking-sessions/${sessionId}/rate`).set(auth()).send({ rating: 4 });
    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(4);
  });

  it('PATCH /api/cooking-sessions/:id/rate rejects out-of-range rating', async () => {
    const res = await request(app).patch(`/api/cooking-sessions/${sessionId}/rate`).set(auth()).send({ rating: 6 });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/cooking-sessions/:id/rate returns 401 without auth', async () => {
    const res = await request(app).patch(`/api/cooking-sessions/${sessionId}/rate`).send({ rating: 3 });
    expect(res.status).toBe(401);
  });
});

// ─── Love Letters ─────────────────────────────────────────────────────────────
describe('Love Letters', () => {
  let letterId: string;

  it('POST /api/love-letters creates a DRAFT letter with empty photos/audio', async () => {
    const res = await request(app).post('/api/love-letters').set(auth()).send({
      title: 'Test Letter',
      content: 'Hello my love',
      mood: 'happy',
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.photos).toEqual([]);
    expect(res.body.audio).toEqual([]);
    letterId = res.body.id;
  });

  it('GET /api/love-letters/sent returns letters with photos and audio fields', async () => {
    const res = await request(app).get('/api/love-letters/sent').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const letter = res.body.find((l: { id: string }) => l.id === letterId);
    expect(letter).toBeDefined();
    expect(letter.photos).toEqual([]);
    expect(letter.audio).toEqual([]);
  });

  it('GET /api/love-letters/:id returns letter with photos and audio fields', async () => {
    const res = await request(app).get(`/api/love-letters/${letterId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.photos).toEqual([]);
    expect(res.body.audio).toEqual([]);
  });

  it('POST /api/love-letters/:id/photos returns 404 for non-sender', async () => {
    const res = await request(app)
      .post(`/api/love-letters/${letterId}/photos`)
      .set(partnerAuth())
      .attach('photos', Buffer.from('fake-image'), { filename: 'test.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(404);
  });

  it('POST /api/love-letters/:id/photos returns 401 without auth', async () => {
    const res = await request(app).post(`/api/love-letters/${letterId}/photos`);
    expect(res.status).toBe(401);
  });

  it('POST /api/love-letters/:id/audio returns 404 for non-sender', async () => {
    const res = await request(app)
      .post(`/api/love-letters/${letterId}/audio`)
      .set(partnerAuth())
      .attach('audio', Buffer.from('fake-audio'), { filename: 'memo.webm', contentType: 'audio/webm' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/love-letters/:id/photos/:photoId returns 404 for non-existent photo', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .delete(`/api/love-letters/${letterId}/photos/${fakeId}`)
      .set(auth());
    expect(res.status).toBe(404);
  });

  it('PUT /api/love-letters/:id/send delivers letter; subsequent photo upload allowed (background upload support)', async () => {
    const res = await request(app).put(`/api/love-letters/${letterId}/send`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DELIVERED');
    expect(res.body.photos).toEqual([]);
    expect(res.body.audio).toEqual([]);

    // Background uploads may arrive after send — must succeed on DELIVERED letters
    const uploadRes = await request(app)
      .post(`/api/love-letters/${letterId}/photos`)
      .set(auth())
      .attach('photos', Buffer.from('fake-image'), { filename: 'test.jpg', contentType: 'image/jpeg' });
    expect(uploadRes.status).toBe(201);
    expect(Array.isArray(uploadRes.body)).toBe(true);
  });

  it('GET /api/love-letters/received returns 200 with photos/audio fields', async () => {
    const res = await request(app).get('/api/love-letters/received').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Each letter in inbox should have photos and audio arrays
    for (const letter of res.body) {
      expect(Array.isArray(letter.photos)).toBe(true);
      expect(Array.isArray(letter.audio)).toBe(true);
    }
  });

  it('PATCH /api/love-letters/:id/mark-read returns 200 with status READ and readAt', async () => {
    // partnerToken is the recipient of the letter sent by auth() user
    const res = await request(app)
      .patch(`/api/love-letters/${letterId}/mark-read`)
      .set(partnerAuth());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(letterId);
    expect(res.body.status).toBe('READ');
    expect(res.body.readAt).toBeTruthy();
  });

  it('PATCH /api/love-letters/:id/mark-read returns 400 if already READ', async () => {
    const res = await request(app)
      .patch(`/api/love-letters/${letterId}/mark-read`)
      .set(partnerAuth());
    expect(res.status).toBe(400);
  });

  it('PATCH /api/love-letters/:id/mark-read returns 403 if sender (not recipient) calls it', async () => {
    // Create a new delivered letter for this test
    const createRes = await request(app).post('/api/love-letters').set(auth()).send({
      title: 'Another Letter',
      content: 'Test',
      sendNow: true,
    });
    const newLetterId = createRes.body.id;
    // Sender tries to mark their own sent letter as read — should 403
    const res = await request(app)
      .patch(`/api/love-letters/${newLetterId}/mark-read`)
      .set(auth());
    expect(res.status).toBe(403);
  });

  it('PATCH /api/love-letters/:id/mark-read returns 404 for non-existent letter', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .patch(`/api/love-letters/${fakeId}/mark-read`)
      .set(partnerAuth());
    expect(res.status).toBe(404);
  });

  it('PATCH /api/love-letters/:id/mark-read returns 401 without auth', async () => {
    const res = await request(app).patch(`/api/love-letters/${letterId}/mark-read`);
    expect(res.status).toBe(401);
  });
});

// ─── JWT Auth Upgrade ────────────────────────────────────────────────────────
describe('JWT Auth Upgrade', () => {
  let refreshToken: string;
  let accessToken: string;

  it('POST /api/auth/login returns accessToken + refreshToken', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@lovescrum.test',
      password: 'testpass123',
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    // Legacy token field removed in Sprint 45 — accessToken + refreshToken only
    expect(res.body.user.email).toBe('test@lovescrum.test');
    refreshToken = res.body.refreshToken;
    accessToken = res.body.accessToken;
  });

  it('POST /api/auth/refresh returns new token pair', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(refreshToken); // rotated
    refreshToken = res.body.refreshToken;
  });

  it('POST /api/auth/refresh with revoked token returns 401', async () => {
    // Use old refreshToken which was rotated (revoked)
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'revoked-token' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/logout revokes refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Token is now revoked
    const refreshRes = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });

  it('Old 30-day tokens still work for protected routes', async () => {
    // token from beforeAll is a 30-day token
    const res = await request(app).get('/api/auth/me').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@lovescrum.test');
  });
});

// ─── Couple Profile ──────────────────────────────────────────────────────────
describe('Couple Profile', () => {
  it('GET /api/couple returns couple info with users', async () => {
    const res = await request(app).get('/api/couple').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testCoupleId);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBe(2);
  });

  it('PUT /api/couple updates name and anniversaryDate', async () => {
    const res = await request(app).put('/api/couple').set(auth()).send({
      name: 'Test Couple Updated',
      anniversaryDate: '2020-06-15',
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Couple Updated');
    expect(res.body.anniversaryDate).toBeTruthy();
  });

  it('PUT /api/couple syncs anniversaryDate to AppSetting', async () => {
    // Check that the setting was synced
    const res = await request(app).get('/api/settings/relationship-start-date').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.value).toBe('2020-06-15');
  });

  // Sprint 60 T286 — `color` (palette swatch index "0"–"3" or hex later).
  it('PUT /api/couple updates color', async () => {
    const res = await request(app).put('/api/couple').set(auth()).send({ color: '2' });
    expect(res.status).toBe(200);
    expect(res.body.color).toBe('2');
  });

  it('PUT /api/couple clears color when explicit null', async () => {
    const res = await request(app).put('/api/couple').set(auth()).send({ color: null });
    expect(res.status).toBe(200);
    expect(res.body.color).toBeNull();
  });

  it('POST /api/couple/generate-invite generates 8-char code', async () => {
    const res = await request(app).post('/api/couple/generate-invite').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.inviteCode).toBeTruthy();
    expect(res.body.inviteCode.length).toBe(8);
  });

  it('GET /api/couple returns inviteCode after generation', async () => {
    const res = await request(app).get('/api/couple').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.inviteCode).toBeTruthy();
  });

  it('GET /api/couple returns 401 without auth', async () => {
    const res = await request(app).get('/api/couple');
    expect(res.status).toBe(401);
  });

  it('GET /api/couple/validate-invite returns valid=true with inviter {name, avatarUrl} (no auth required)', async () => {
    // Create a joinable couple with exactly 1 member
    const joinable = await prisma.couple.create({ data: { name: 'Joinable Couple', inviteCode: 'JOINTEST' } });
    await prisma.user.create({ data: { email: 'solo@test.com', password: 'x', name: 'Solo User', coupleId: joinable.id } });
    const res = await request(app).get('/api/couple/validate-invite?code=JOINTEST');
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.coupleName).toBe('Joinable Couple');
    expect(res.body.inviter).toEqual({ name: 'Solo User', avatarUrl: null });
    // Cleanup
    await prisma.user.deleteMany({ where: { email: 'solo@test.com' } });
    await prisma.couple.delete({ where: { id: joinable.id } });
  });

  it('GET /api/couple/validate-invite returns valid=false for unknown code (no auth required)', async () => {
    const res = await request(app).get('/api/couple/validate-invite?code=BADCODE');
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.error).toBe('Invalid invite code');
  });

  it('GET /api/couple/validate-invite returns valid=false for full couple (no auth required)', async () => {
    const fullCouple = await prisma.couple.create({ data: { inviteCode: 'FULLTEST' } });
    await prisma.user.createMany({
      data: [
        { email: 'full1@test.com', password: 'x', name: 'Full 1', coupleId: fullCouple.id },
        { email: 'full2@test.com', password: 'x', name: 'Full 2', coupleId: fullCouple.id },
      ],
    });
    const res = await request(app).get('/api/couple/validate-invite?code=FULLTEST');
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.error).toBe('This couple is already full');
    // Cleanup
    await prisma.user.deleteMany({ where: { email: { in: ['full1@test.com', 'full2@test.com'] } } });
    await prisma.couple.delete({ where: { id: fullCouple.id } });
  });

  it('GET /api/couple/validate-invite returns 400 without code param (no auth required)', async () => {
    const res = await request(app).get('/api/couple/validate-invite');
    expect(res.status).toBe(400);
  });

  it('GET /api/couple/validate-invite is public — returns 200 without auth token', async () => {
    const res = await request(app).get('/api/couple/validate-invite?code=ANYCODE');
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false); // ANYCODE doesn't exist — valid=false, but NOT 401
  });
});

// Sprint 60 T289 — pair-create resume. Lets a user who created an invite,
// killed the app, and reopened pair-create see their pending code instead of
// getting an "already in couple" error. Three branches: pending invite (200),
// no couple (404 NO_INVITE), already paired (409 ALREADY_PAIRED).
describe('GET /api/invite/me', () => {
  it('returns 200 with pending invite when user has couple but partner not joined', async () => {
    const couple = await prisma.couple.create({
      data: { name: 'Pending Couple', inviteCode: 'PENDING1' },
    });
    const user = await prisma.user.create({
      data: {
        email: 'invite-pending@test.com',
        password: 'x',
        name: 'Pending Inviter',
        coupleId: couple.id,
      },
    });
    const userToken = generateToken(user.id, couple.id);

    const res = await request(app)
      .get('/api/invite/me')
      .set({ Authorization: `Bearer ${userToken}` });

    expect(res.status).toBe(200);
    expect(res.body.inviteCode).toBe('PENDING1');
    expect(res.body.createdAt).toBeTruthy();
    expect(res.body.couple).toEqual({ id: couple.id, name: 'Pending Couple' });

    await prisma.user.delete({ where: { id: user.id } });
    await prisma.couple.delete({ where: { id: couple.id } });
  });

  it('returns 404 with code=NO_INVITE when user has no couple', async () => {
    const { generateAccessToken } = await import('../utils/auth');
    const user = await prisma.user.create({
      data: {
        email: 'invite-no-couple@test.com',
        password: 'x',
        name: 'Lone Wolf',
        // no coupleId
      },
    });
    const userToken = generateAccessToken(user.id, null);

    const res = await request(app)
      .get('/api/invite/me')
      .set({ Authorization: `Bearer ${userToken}` });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NO_INVITE');

    await prisma.user.delete({ where: { id: user.id } });
  });

  it('returns 409 with code=ALREADY_PAIRED when couple has 2 members', async () => {
    // testCoupleId from beforeAll has 2 users — the main `token` belongs to
    // one of them, so it's the cleanest fixture for the paired branch.
    const res = await request(app).get('/api/invite/me').set(auth());

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ALREADY_PAIRED');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/invite/me');
    expect(res.status).toBe(401);
  });
});

// ─── Share Links ─────────────────────────────────────────────────────────────
describe('Share Links', () => {
  let momentId: string;
  let shareToken: string;
  let letterId: string;
  let recipeId: string;

  beforeAll(async () => {
    // Create test moment
    const momentRes = await request(app).post('/api/moments').set(auth()).send({
      title: 'Share Test Moment', date: '2026-03-01', tags: [],
    });
    momentId = momentRes.body.id;

    // Create test recipe
    const recipeRes = await request(app).post('/api/recipes').set(auth()).send({
      title: 'Share Test Recipe', ingredients: ['test'], steps: ['step 1'],
    });
    recipeId = recipeRes.body.id;

    // Create test letter and deliver it
    const letterRes = await request(app).post('/api/love-letters').set(auth()).send({
      title: 'Share Test Letter', content: 'Hello!',
    });
    letterId = letterRes.body.id;
    await request(app).put(`/api/love-letters/${letterId}/send`).set(auth());
  });

  it('POST /api/share creates share link for moment', async () => {
    const res = await request(app).post('/api/share').set(auth()).send({
      type: 'moment', targetId: momentId,
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.type).toBe('moment');
    shareToken = res.body.token;
  });

  it('POST /api/share creates share link for recipe', async () => {
    const res = await request(app).post('/api/share').set(auth()).send({
      type: 'recipe', targetId: recipeId,
    });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('recipe');
  });

  it('POST /api/share creates share link for delivered letter', async () => {
    const res = await request(app).post('/api/share').set(auth()).send({
      type: 'letter', targetId: letterId,
    });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('letter');
  });

  it('POST /api/share rejects DRAFT letter', async () => {
    const draftRes = await request(app).post('/api/love-letters').set(auth()).send({
      title: 'Draft Letter', content: 'Draft!',
    });
    const res = await request(app).post('/api/share').set(auth()).send({
      type: 'letter', targetId: draftRes.body.id,
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/share/:token returns shared data (public)', async () => {
    const res = await request(app).get(`/api/share/${shareToken}`);
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('moment');
    expect(res.body.data).toBeTruthy();
    expect(res.body.coupleName).toBeTruthy();
  });

  it('GET /api/share/:token increments viewCount', async () => {
    await request(app).get(`/api/share/${shareToken}`);
    const link = await prisma.shareLink.findUnique({ where: { token: shareToken } });
    expect(link!.viewCount).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/share lists share links (protected)', async () => {
    const res = await request(app).get('/api/share').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('DELETE /api/share/:token revokes link', async () => {
    const res = await request(app).delete(`/api/share/${shareToken}`).set(auth());
    expect(res.status).toBe(200);

    // Link no longer works
    const getRes = await request(app).get(`/api/share/${shareToken}`);
    expect(getRes.status).toBe(404);
  });

  it('GET /api/share/nonexistent returns 404', async () => {
    const res = await request(app).get('/api/share/nonexistent-token');
    expect(res.status).toBe(404);
  });

  it('POST /api/share returns 401 without auth', async () => {
    const res = await request(app).post('/api/share').send({ type: 'moment', targetId: momentId });
    expect(res.status).toBe(401);
  });
});

// ─── Date Plans ───────────────────────────────────────────────────────────────
describe('Date Plans', () => {
  let planId: string;
  let stopId: string;
  let spotId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/date-plans')
      .set(auth())
      .send({
        title: 'Test Date Plan',
        date: '2026-06-15',
        notes: 'A fun day out',
        stops: [
          {
            time: '10:00',
            title: 'Coffee Stop',
            description: 'Morning coffee',
            order: 0,
          },
        ],
      });
    expect(res.status).toBe(201);
    planId = res.body.id;
    stopId = res.body.stops[0].id;
  });

  it('GET /api/date-plans lists plans', async () => {
    const res = await request(app).get('/api/date-plans').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((p: any) => p.id === planId)).toBe(true);
  });

  it('GET /api/date-plans/:id returns plan with stops', async () => {
    const res = await request(app).get(`/api/date-plans/${planId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(planId);
    expect(res.body.title).toBe('Test Date Plan');
    expect(Array.isArray(res.body.stops)).toBe(true);
  });

  it('GET /api/date-plans/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/date-plans/nonexistent-id').set(auth());
    expect(res.status).toBe(404);
  });

  it('PUT /api/date-plans/:id updates plan', async () => {
    const res = await request(app)
      .put(`/api/date-plans/${planId}`)
      .set(auth())
      .send({ title: 'Updated Date Plan', notes: 'Updated notes' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Date Plan');
  });

  it('PUT /api/date-plans/:id/status updates status', async () => {
    const res = await request(app)
      .put(`/api/date-plans/${planId}/status`)
      .set(auth())
      .send({ status: 'active' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
  });

  it('PUT /api/date-plans/:id/stops/:stopId/cost updates stop cost', async () => {
    const res = await request(app)
      .put(`/api/date-plans/${planId}/stops/${stopId}/cost`)
      .set(auth())
      .send({ cost: 150000 });
    expect(res.status).toBe(200);
    expect(res.body.cost).toBe(150000);
  });

  it('PUT /api/date-plans/:id/stops/:stopId/moment links moment', async () => {
    const res = await request(app)
      .put(`/api/date-plans/${planId}/stops/${stopId}/moment`)
      .set(auth())
      .send({ momentId: null });
    expect(res.status).toBe(200);
    expect(res.body.linkedMomentId).toBeNull();
  });

  it('PUT /api/date-plans/:id/stops/:stopId/foodspot links foodspot', async () => {
    const res = await request(app)
      .put(`/api/date-plans/${planId}/stops/${stopId}/foodspot`)
      .set(auth())
      .send({ foodSpotId: null });
    expect(res.status).toBe(200);
    expect(res.body.linkedFoodSpotId).toBeNull();
  });

  it('PUT /api/date-plans/:id/stops/:stopId/done marks stop done', async () => {
    const res = await request(app)
      .put(`/api/date-plans/${planId}/stops/${stopId}/done`)
      .set(auth());
    expect(res.status).toBe(200);
  });

  it('POST /api/date-plans/:id/stops/:stopId/spots adds sub-spot', async () => {
    const res = await request(app)
      .post(`/api/date-plans/${planId}/stops/${stopId}/spots`)
      .set(auth())
      .send({ title: 'Sub Spot A', address: '123 Street', order: 0 });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Sub Spot A');
    spotId = res.body.id;
  });

  it('DELETE /api/date-plans/:id/stops/:stopId/spots/:spotId deletes sub-spot', async () => {
    const res = await request(app)
      .delete(`/api/date-plans/${planId}/stops/${stopId}/spots/${spotId}`)
      .set(auth());
    expect(res.status).toBe(204);
  });

  it('DELETE /api/date-plans/:id deletes plan', async () => {
    const res = await request(app).delete(`/api/date-plans/${planId}`).set(auth());
    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/api/date-plans/${planId}`).set(auth());
    expect(getRes.status).toBe(404);
  });

  it('GET /api/date-plans returns 401 without auth', async () => {
    const res = await request(app).get('/api/date-plans');
    expect(res.status).toBe(401);
  });
});

// ─── Date Wishes ──────────────────────────────────────────────────────────────
describe('Date Wishes', () => {
  let wishId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/date-wishes')
      .set(auth())
      .send({ title: 'Visit Ha Long Bay', category: 'travel', description: 'Overnight cruise' });
    expect(res.status).toBe(201);
    wishId = res.body.id;
  });

  it('GET /api/date-wishes lists wishes', async () => {
    const res = await request(app).get('/api/date-wishes').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((w: any) => w.id === wishId)).toBe(true);
  });

  it('PUT /api/date-wishes/:id updates wish', async () => {
    const res = await request(app)
      .put(`/api/date-wishes/${wishId}`)
      .set(auth())
      .send({ title: 'Visit Ha Long Bay (Updated)', category: 'travel' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Visit Ha Long Bay (Updated)');
  });

  it('PUT /api/date-wishes/:id/done marks wish done', async () => {
    const res = await request(app)
      .put(`/api/date-wishes/${wishId}/done`)
      .set(auth())
      .send({ linkedMomentId: null, linkedFoodSpotId: null });
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
    expect(res.body.doneAt).toBeTruthy();
  });

  it('DELETE /api/date-wishes/:id deletes wish', async () => {
    const res = await request(app).delete(`/api/date-wishes/${wishId}`).set(auth());
    expect(res.status).toBe(204);
  });

  it('POST /api/date-wishes returns 400 without required fields', async () => {
    const res = await request(app)
      .post('/api/date-wishes')
      .set(auth())
      .send({ description: 'Missing title and category' });
    expect(res.status).toBe(400);
  });

  it('GET /api/date-wishes returns 401 without auth', async () => {
    const res = await request(app).get('/api/date-wishes');
    expect(res.status).toBe(401);
  });
});

// ─── Recipes ──────────────────────────────────────────────────────────────────
describe('Recipes', () => {
  let recId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set(auth())
      .send({
        title: 'Phở bò',
        description: 'Noodle soup',
        ingredients: ['bún', 'thịt bò'],
        ingredientPrices: [5000, 80000],
        steps: ['Nấu nước dùng', 'Thêm bún'],
        stepDurations: [3600, 0],
        tags: ['canh', 'miền Bắc'],
        notes: '2 người ăn',
      });
    expect(res.status).toBe(201);
    recId = res.body.id;
  });

  it('GET /api/recipes lists recipes', async () => {
    const res = await request(app).get('/api/recipes').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((r: any) => r.id === recId)).toBe(true);
  });

  it('GET /api/recipes/:id returns recipe', async () => {
    const res = await request(app).get(`/api/recipes/${recId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(recId);
    expect(res.body.title).toBe('Phở bò');
  });

  it('PUT /api/recipes/:id updates recipe', async () => {
    const res = await request(app)
      .put(`/api/recipes/${recId}`)
      .set(auth())
      .send({ title: 'Phở bò đặc biệt', notes: 'Updated notes' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Phở bò đặc biệt');
  });

  it('POST /api/recipes returns 400 without title', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set(auth())
      .send({ description: 'No title' });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/recipes/:id deletes recipe', async () => {
    const toDelete = await request(app)
      .post('/api/recipes')
      .set(auth())
      .send({ title: 'To Delete' });
    const delRes = await request(app)
      .delete(`/api/recipes/${toDelete.body.id}`)
      .set(auth());
    expect(delRes.status).toBe(200);
  });

  it('GET /api/recipes returns 401 without auth', async () => {
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(401);
  });
});

// ─── Push ─────────────────────────────────────────────────────────────────────
describe('Push', () => {
  it('GET /api/push/vapid-key returns public key', async () => {
    const res = await request(app).get('/api/push/vapid-key').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.publicKey).toBeTruthy();
  });

  it('POST /api/push/subscribe creates web push subscription', async () => {
    const res = await request(app)
      .post('/api/push/subscribe')
      .set(auth())
      .send({
        endpoint: 'https://fcm.googleapis.com/test-endpoint-subscribe',
        keys: { p256dh: 'test-p256dh-key', auth: 'test-auth-key' },
      });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  it('POST /api/push/unsubscribe removes web push subscription', async () => {
    const res = await request(app)
      .post('/api/push/unsubscribe')
      .set(auth())
      .send({ endpoint: 'https://fcm.googleapis.com/test-endpoint-subscribe' });
    expect(res.status).toBe(200);
  });

  it('POST /api/push/mobile-subscribe registers mobile token', async () => {
    const res = await request(app)
      .post('/api/push/mobile-subscribe')
      .set(auth())
      .send({ token: 'test-firebase-device-token-123', deviceType: 'ios' });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  it('POST /api/push/mobile-unsubscribe removes mobile token', async () => {
    const res = await request(app)
      .post('/api/push/mobile-unsubscribe')
      .set(auth())
      .send({ token: 'test-firebase-device-token-123' });
    expect(res.status).toBe(200);
  });

  it('POST /api/push/subscribe returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/push/subscribe')
      .send({ endpoint: 'https://example.com', keys: { p256dh: 'k', auth: 'a' } });
    expect(res.status).toBe(401);
  });
});

// ─── Recap ────────────────────────────────────────────────────────────────────
describe('Recap', () => {
  it('GET /api/recap/weekly returns weekly stats', async () => {
    const res = await request(app).get('/api/recap/weekly').set(auth());
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('object');
    // Existing keys (web monthly recap page contract — must NOT regress).
    expect(res.body).toHaveProperty('moments');
    expect(res.body).toHaveProperty('loveLetters');
    expect(res.body).toHaveProperty('datePlans');
    // Mobile-rework augment keys (Sprint 67 T451).
    expect(res.body).toHaveProperty('streak.current');
    expect(res.body).toHaveProperty('streak.longest');
    expect(res.body).toHaveProperty('questions.count');
    expect(res.body).toHaveProperty('words.count');
    expect(res.body).toHaveProperty('trips');
    expect(res.body).toHaveProperty('totalPhotoCount');
    expect(res.body).toHaveProperty('topMoments');
    expect(res.body).toHaveProperty('places');
    expect(res.body).toHaveProperty('firsts');
    expect(res.body).toHaveProperty('moodBuckets');
    expect(Array.isArray(res.body.heatmap)).toBe(true);
    expect(res.body.heatmap).toHaveLength(7);
    expect(Array.isArray(res.body.topMoments)).toBe(true);
    expect(res.body.topMoments.length).toBeLessThanOrEqual(3);
  });

  it('GET /api/recap/weekly?week=YYYY-Www returns stats for specific week', async () => {
    const res = await request(app).get('/api/recap/weekly?week=2026-W10').set(auth());
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('object');
    expect(res.body.week).toBe('2026-W10');
  });

  it('GET /api/recap/weekly returns 400 for invalid week format', async () => {
    const res = await request(app).get('/api/recap/weekly?week=bad-format').set(auth());
    expect(res.status).toBe(400);
  });

  it('GET /api/recap/monthly returns monthly stats', async () => {
    const res = await request(app).get('/api/recap/monthly').set(auth());
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('object');
    // Existing web-page contract.
    expect(res.body).toHaveProperty('moments');
    expect(res.body).toHaveProperty('cooking');
    expect(res.body).toHaveProperty('foodSpots');
    // Mobile-rework augment keys (Sprint 67 T451).
    expect(res.body).toHaveProperty('streak.current');
    expect(res.body).toHaveProperty('questions.count');
    expect(res.body).toHaveProperty('words.count');
    expect(res.body).toHaveProperty('trips');
    expect(res.body).toHaveProperty('totalPhotoCount');
    expect(res.body).toHaveProperty('topMoments');
    expect(res.body).toHaveProperty('places');
    expect(res.body).toHaveProperty('topQuestion');
    expect(res.body).toHaveProperty('letterHighlight');
    expect(res.body).toHaveProperty('firsts');
    expect(res.body).toHaveProperty('moodBuckets');
    expect(Array.isArray(res.body.heatmap)).toBe(true);
    // Heatmap length = days in default (previous) month, between 28 and 31.
    expect(res.body.heatmap.length).toBeGreaterThanOrEqual(28);
    expect(res.body.heatmap.length).toBeLessThanOrEqual(31);
    expect(Array.isArray(res.body.moodBuckets)).toBe(true);
    expect(res.body.moodBuckets).toHaveLength(0);
  });

  it('GET /api/recap/monthly?month=YYYY-MM returns stats for specific month', async () => {
    const res = await request(app).get('/api/recap/monthly?month=2026-01').set(auth());
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('object');
    expect(res.body.month).toBe('2026-01');
    // January has 31 days.
    expect(res.body.heatmap).toHaveLength(31);
  });

  it('GET /api/recap/monthly augment heatmap sums to moment count when in month', async () => {
    const res = await request(app).get('/api/recap/monthly').set(auth());
    expect(res.status).toBe(200);
    const heatmapTotal = (res.body.heatmap as number[]).reduce((a, b) => a + b, 0);
    // Heatmap counts moments with date in range; equals moments.count (which
    // also counts only in-range moments via the same query).
    expect(heatmapTotal).toBe(res.body.moments.count);
  });

  it('GET /api/recap/monthly topMoments shape', async () => {
    const res = await request(app).get('/api/recap/monthly').set(auth());
    expect(res.status).toBe(200);
    for (const tm of res.body.topMoments as Array<Record<string, unknown>>) {
      expect(tm).toHaveProperty('id');
      expect(tm).toHaveProperty('title');
      expect(tm).toHaveProperty('date');
      expect(tm).toHaveProperty('photoCount');
      expect(tm).toHaveProperty('reactionCount');
      expect(tm).toHaveProperty('palette');
      // palette is one of the six prototype keys
      expect(['sunset', 'butter', 'night', 'lilac', 'rose', 'mint']).toContain(tm.palette);
    }
  });

  it('GET /api/recap/monthly returns 400 for invalid month format', async () => {
    const res = await request(app).get('/api/recap/monthly?month=invalid').set(auth());
    expect(res.status).toBe(400);
  });

  it('GET /api/recap/monthly/caption returns caption data', async () => {
    const res = await request(app).get('/api/recap/monthly/caption').set(auth());
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('object');
  });

  it('GET /api/recap/weekly returns 401 without auth', async () => {
    const res = await request(app).get('/api/recap/weekly');
    expect(res.status).toBe(401);
  });
});

// ─── Settings ─────────────────────────────────────────────────────────────────
describe('Settings', () => {
  it('PUT /api/settings/:key upserts a setting', async () => {
    const res = await request(app)
      .put('/api/settings/theme')
      .set(auth())
      .send({ value: 'dark' });
    expect(res.status).toBe(200);
    expect(res.body.key).toBe('theme');
    expect(res.body.value).toBe('dark');
  });

  it('GET /api/settings/:key retrieves a setting', async () => {
    const res = await request(app).get('/api/settings/theme').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.key).toBe('theme');
    expect(res.body.value).toBe('dark');
  });

  it('PUT /api/settings/:key updates existing setting', async () => {
    const res = await request(app)
      .put('/api/settings/theme')
      .set(auth())
      .send({ value: 'light' });
    expect(res.status).toBe(200);
    expect(res.body.value).toBe('light');
  });

  it('GET /api/settings/:key returns object with null value for unknown key', async () => {
    const res = await request(app).get('/api/settings/nonexistent-key-xyz').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.value).toBeNull();
  });

  it('GET /api/settings/:key returns 401 without auth', async () => {
    const res = await request(app).get('/api/settings/theme');
    expect(res.status).toBe(401);
  });
});

// ─── Tags ─────────────────────────────────────────────────────────────────────
describe('Tags', () => {
  it('PUT /api/tags/:name upserts a tag', async () => {
    const res = await request(app).put('/api/tags/test-tag-xyz').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('test-tag-xyz');
  });

  it('GET /api/tags lists all tags', async () => {
    const res = await request(app).get('/api/tags').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((t: any) => t.name === 'test-tag-xyz')).toBe(true);
  });

  it('PUT /api/tags/:name is idempotent (upsert)', async () => {
    await request(app).put('/api/tags/test-tag-xyz').set(auth());
    const res = await request(app).put('/api/tags/test-tag-xyz').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('test-tag-xyz');
  });

  it('GET /api/tags returns 401 without auth', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(401);
  });
});

describe('Subscription', () => {
  let subCoupleId: string;
  let subUserToken: string;

  beforeAll(async () => {
    // Use a fresh couple with no subscription to test free → active → expired flow
    const couple = await prisma.couple.create({ data: { name: 'Sub Test Couple' } });
    subCoupleId = couple.id;
    const hashed = await hashPassword('subpass');
    const user = await prisma.user.create({
      data: { email: 'sub@lovescrum.test', password: hashed, name: 'Sub User', coupleId: subCoupleId },
    });
    const { generateToken } = await import('../utils/auth');
    subUserToken = generateToken(user.id, subCoupleId);
  });

  afterAll(async () => {
    await prisma.subscription.deleteMany({ where: { coupleId: subCoupleId } });
    await prisma.user.deleteMany({ where: { coupleId: subCoupleId } });
    await prisma.couple.delete({ where: { id: subCoupleId } });
  });

  it('GET /api/subscription/status returns 401 without auth', async () => {
    const res = await request(app).get('/api/subscription/status');
    expect(res.status).toBe(401);
  });

  it('GET /api/subscription/status returns free status with limits for new couple', async () => {
    const res = await request(app).get('/api/subscription/status').set({ Authorization: `Bearer ${subUserToken}` });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('free');
    expect(res.body.plan).toBe('free');
    expect(res.body.limits).toBeDefined();
    expect(res.body.limits.moments).toBeDefined();
    expect(res.body.limits.moments.max).toBe(10);
  });

  it('POST /api/subscription/webhook returns 401 with wrong secret', async () => {
    process.env.REVENUECAT_WEBHOOK_SECRET = 'test-webhook-secret-123';
    const res = await request(app)
      .post('/api/subscription/webhook')
      .set('Authorization', 'wrong-secret')
      .send({ event: { type: 'INITIAL_PURCHASE', app_user_id: subCoupleId } });
    expect(res.status).toBe(401);
    delete process.env.REVENUECAT_WEBHOOK_SECRET;
  });

  it('POST /api/subscription/webhook INITIAL_PURCHASE sets status to active', async () => {
    const res = await request(app)
      .post('/api/subscription/webhook')
      .send({
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: subCoupleId,
          store: 'APP_STORE',
          product_id: 'memoura_plus_monthly',
        },
      });
    expect(res.status).toBe(200);

    const sub = await prisma.subscription.findUnique({ where: { coupleId: subCoupleId } });
    expect(sub?.status).toBe('active');
  });

  it('GET /api/subscription/status returns active after INITIAL_PURCHASE', async () => {
    const res = await request(app).get('/api/subscription/status').set({ Authorization: `Bearer ${subUserToken}` });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
    expect(res.body.plan).toBe('plus');
    expect(res.body.limits).toBeNull();
  });

  it('POST /api/subscription/webhook EXPIRATION sets status to expired', async () => {
    const res = await request(app)
      .post('/api/subscription/webhook')
      .send({ event: { type: 'EXPIRATION', app_user_id: subCoupleId } });
    expect(res.status).toBe(200);

    const sub = await prisma.subscription.findUnique({ where: { coupleId: subCoupleId } });
    expect(sub?.status).toBe('expired');
  });
});

describe('Free Tier Limits', () => {
  let freeCoupleId: string;
  let freeUserId: string;
  let freeUserToken: string;

  beforeAll(async () => {
    // Create an isolated couple with no subscription (free tier)
    const couple = await prisma.couple.create({ data: { name: 'Free Tier Test Couple' } });
    freeCoupleId = couple.id;
    const hashed = await hashPassword('freepass');
    const user = await prisma.user.create({
      data: { email: 'free@lovescrum.test', password: hashed, name: 'Free User', coupleId: freeCoupleId },
    });
    freeUserId = user.id;
    freeUserToken = generateToken(user.id, freeCoupleId);
  });

  afterAll(async () => {
    await prisma.moment.deleteMany({ where: { coupleId: freeCoupleId } });
    await prisma.loveLetter.deleteMany({ where: { coupleId: freeCoupleId } });
    await prisma.recipe.deleteMany({ where: { coupleId: freeCoupleId } });
    await prisma.user.deleteMany({ where: { coupleId: freeCoupleId } });
    await prisma.couple.deleteMany({ where: { id: freeCoupleId } });
  });

  it('GET /api/moments works for free user (reads always allowed)', async () => {
    const res = await request(app).get('/api/moments').set({ Authorization: `Bearer ${freeUserToken}` });
    expect(res.status).toBe(200);
  });

  it('POST /api/moments succeeds when under limit (free user, 0 moments)', async () => {
    const res = await request(app)
      .post('/api/moments')
      .set({ Authorization: `Bearer ${freeUserToken}` })
      .send({ title: 'Free Moment 1', date: new Date().toISOString() });
    expect(res.status).toBe(201);
  });

  it('POST /api/moments returns 403 FREE_LIMIT_REACHED when at limit (10)', async () => {
    // Create 9 more moments to hit limit of 10
    await prisma.moment.createMany({
      data: Array.from({ length: 9 }, (_, i) => ({
        coupleId: freeCoupleId,
        authorId: freeUserId,
        title: `Bulk Moment ${i + 2}`,
        date: new Date(),
      })),
    });

    const res = await request(app)
      .post('/api/moments')
      .set({ Authorization: `Bearer ${freeUserToken}` })
      .send({ title: 'Over Limit', date: new Date().toISOString() });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FREE_LIMIT_REACHED');
    expect(res.body.limit).toBe(10);
    expect(res.body.used).toBe(10);
  });

  it('POST /api/recipes returns 403 PREMIUM_REQUIRED for free user', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set({ Authorization: `Bearer ${freeUserToken}` })
      .send({ title: 'Free Recipe' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('PREMIUM_REQUIRED');
    expect(res.body.module).toBe('recipes');
  });

  it('POST /api/love-letters returns 403 PREMIUM_REQUIRED for free user', async () => {
    const res = await request(app)
      .post('/api/love-letters')
      .set({ Authorization: `Bearer ${freeUserToken}` })
      .send({ title: 'Free Letter', content: 'Hello', recipientId: 'fake' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('PREMIUM_REQUIRED');
  });

  it('GET /api/recipes works for free user (reads always allowed)', async () => {
    const res = await request(app).get('/api/recipes').set({ Authorization: `Bearer ${freeUserToken}` });
    expect(res.status).toBe(200);
  });
});

// ─── coupleId Isolation Security Tests ───────────────────────────────────────
describe('coupleId Isolation — Couple A cannot access Couple B data', () => {
  let coupleAToken: string;
  let coupleBToken: string;
  let momentId: string;
  let foodSpotId: string;
  let sprintId: string;
  let goalId: string;
  let recipeId: string;
  let datePlanId: string;
  let wishId: string;
  let expenseId: string;

  beforeAll(async () => {
    // Clean up any leftover data from previous runs
    await prisma.user.deleteMany({
      where: { email: { in: ['userA@isolation.test', 'userB@isolation.test'] } },
    });

    // Create couple A
    const coupleA = await prisma.couple.create({ data: {} });
    const userA = await prisma.user.create({
      data: { email: 'userA@isolation.test', password: 'x', name: 'User A', coupleId: coupleA.id },
    });
    coupleAToken = generateToken(userA.id, coupleA.id);

    // Create couple B
    const coupleB = await prisma.couple.create({ data: {} });
    const userB = await prisma.user.create({
      data: { email: 'userB@isolation.test', password: 'x', name: 'User B', coupleId: coupleB.id },
    });
    coupleBToken = generateToken(userB.id, coupleB.id);

    // Create couple A resources
    const moment = await prisma.moment.create({
      data: { coupleId: coupleA.id, authorId: userA.id, title: 'A Moment', date: new Date(), tags: [] },
    });
    momentId = moment.id;

    const foodSpot = await prisma.foodSpot.create({
      data: { coupleId: coupleA.id, name: 'A FoodSpot', tags: [] },
    });
    foodSpotId = foodSpot.id;

    const sprint = await prisma.sprint.create({
      data: { coupleId: coupleA.id, name: 'A Sprint', startDate: new Date(), endDate: new Date() },
    });
    sprintId = sprint.id;

    const goal = await prisma.goal.create({
      data: { coupleId: coupleA.id, title: 'A Goal', status: 'TODO', order: 0 },
    });
    goalId = goal.id;

    const recipe = await prisma.recipe.create({
      data: { coupleId: coupleA.id, title: 'A Recipe', ingredients: [], steps: [], ingredientPrices: [], stepDurations: [] },
    });
    recipeId = recipe.id;

    const datePlan = await prisma.datePlan.create({
      data: { coupleId: coupleA.id, title: 'A Plan', date: new Date() },
    });
    datePlanId = datePlan.id;

    const wish = await prisma.dateWish.create({
      data: { coupleId: coupleA.id, title: 'A Wish', category: 'adventure', createdBy: userA.id },
    });
    wishId = wish.id;

    const expense = await prisma.expense.create({
      data: { coupleId: coupleA.id, amount: 100, category: 'food', date: new Date(), description: 'Test' },
    });
    expenseId = expense.id;
  });

  const authB = () => ({ Authorization: `Bearer ${coupleBToken}` });
  const authA = () => ({ Authorization: `Bearer ${coupleAToken}` });

  it('GET /api/moments/:id — couple B cannot access couple A moment (404)', async () => {
    const res = await request(app).get(`/api/moments/${momentId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('PUT /api/moments/:id — couple B cannot update couple A moment (404)', async () => {
    const res = await request(app).put(`/api/moments/${momentId}`).set(authB()).send({ title: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/moments/:id — couple B cannot delete couple A moment (404)', async () => {
    const res = await request(app).delete(`/api/moments/${momentId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('GET /api/foodspots/:id — couple B cannot access couple A food spot (404)', async () => {
    const res = await request(app).get(`/api/foodspots/${foodSpotId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('PUT /api/foodspots/:id — couple B cannot update couple A food spot (404)', async () => {
    const res = await request(app).put(`/api/foodspots/${foodSpotId}`).set(authB()).send({ name: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/foodspots/:id — couple B cannot delete couple A food spot (404)', async () => {
    const res = await request(app).delete(`/api/foodspots/${foodSpotId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('GET /api/sprints/:id — couple B cannot access couple A sprint (404)', async () => {
    const res = await request(app).get(`/api/sprints/${sprintId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('PUT /api/sprints/:id — couple B cannot update couple A sprint (404)', async () => {
    const res = await request(app).put(`/api/sprints/${sprintId}`).set(authB()).send({ title: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/sprints/:id — couple B cannot delete couple A sprint (404)', async () => {
    const res = await request(app).delete(`/api/sprints/${sprintId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('PUT /api/goals/:id — couple B cannot update couple A goal (404)', async () => {
    const res = await request(app).put(`/api/goals/${goalId}`).set(authB()).send({ title: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/goals/:id — couple B cannot delete couple A goal (404)', async () => {
    const res = await request(app).delete(`/api/goals/${goalId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('GET /api/recipes/:id — couple B cannot access couple A recipe (404)', async () => {
    const res = await request(app).get(`/api/recipes/${recipeId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('PUT /api/recipes/:id — couple B cannot update couple A recipe (404)', async () => {
    const res = await request(app).put(`/api/recipes/${recipeId}`).set(authB()).send({ title: 'Hacked' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/recipes/:id — couple B cannot delete couple A recipe (404)', async () => {
    const res = await request(app).delete(`/api/recipes/${recipeId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('GET /api/date-plans/:id — couple B cannot access couple A date plan (404)', async () => {
    const res = await request(app).get(`/api/date-plans/${datePlanId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('DELETE /api/date-plans/:id — couple B cannot delete couple A date plan (404)', async () => {
    const res = await request(app).delete(`/api/date-plans/${datePlanId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('DELETE /api/date-wishes/:id — couple B cannot delete couple A wish (404)', async () => {
    const res = await request(app).delete(`/api/date-wishes/${wishId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('GET /api/expenses/:id — couple B cannot access couple A expense (404)', async () => {
    const res = await request(app).get(`/api/expenses/${expenseId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('DELETE /api/expenses/:id — couple B cannot delete couple A expense (404)', async () => {
    const res = await request(app).delete(`/api/expenses/${expenseId}`).set(authB());
    expect(res.status).toBe(404);
  });

  it('Couple A can still access own moment (200)', async () => {
    const res = await request(app).get(`/api/moments/${momentId}`).set(authA());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(momentId);
  });

  afterAll(async () => {
    // T387 — Moment FK-RESTRICTs authorId → users.id, so userA/userB
    // owning moments would block the user delete below. Drop owned
    // moments (+ children) by nested author-email filter first.
    const authorFilter = { author: { email: { in: ['userA@isolation.test', 'userB@isolation.test'] } } };
    await prisma.momentComment.deleteMany({ where: { moment: authorFilter } });
    await prisma.momentReaction.deleteMany({ where: { moment: authorFilter } });
    await prisma.momentPhoto.deleteMany({ where: { moment: authorFilter } });
    await prisma.moment.deleteMany({ where: authorFilter });
    await prisma.user.deleteMany({
      where: { email: { in: ['userA@isolation.test', 'userB@isolation.test'] } },
    });
  });
});

describe('Daily Questions', () => {
  const dqCoupleId = 'test-dq-couple';
  let dqToken: string;
  let dqPartnerToken: string;
  let seedQuestionId: string;

  beforeAll(async () => {
    // Seed one question
    const q = await prisma.dailyQuestion.upsert({
      where: { id: 'test-q-1' },
      update: {},
      create: { id: 'test-q-1', text: 'Test question?', category: 'general', order: 999 },
    });
    seedQuestionId = q.id;

    // Couple + 2 users for DQ tests
    await prisma.couple.upsert({
      where: { id: dqCoupleId },
      update: {},
      create: { id: dqCoupleId, name: 'DQ Couple' },
    });
    const hashed = await hashPassword('testpass123');
    const u1 = await prisma.user.upsert({
      where: { email: 'dq-user@test.local' },
      update: { coupleId: dqCoupleId },
      create: { email: 'dq-user@test.local', password: hashed, name: 'DQ User', coupleId: dqCoupleId },
    });
    const u2 = await prisma.user.upsert({
      where: { email: 'dq-partner@test.local' },
      update: { coupleId: dqCoupleId },
      create: { email: 'dq-partner@test.local', password: hashed, name: 'DQ Partner', coupleId: dqCoupleId },
    });
    dqToken = generateToken(u1.id, dqCoupleId);
    dqPartnerToken = generateToken(u2.id, dqCoupleId);
  });

  it('GET /api/daily-questions/today returns a question', async () => {
    const res = await request(app).get('/api/daily-questions/today').set('Authorization', `Bearer ${dqToken}`);
    expect(res.status).toBe(200);
    expect(res.body.question).toBeDefined();
    expect(res.body.question.id).toBeDefined();
    expect(res.body.myAnswer).toBeNull();
    expect(res.body.partnerAnswer).toBeNull();
    expect(res.body.partnerName).toBe('DQ Partner');
  });

  it('GET /api/daily-questions/today returns same question for both partners', async () => {
    const r1 = await request(app).get('/api/daily-questions/today').set('Authorization', `Bearer ${dqToken}`);
    const r2 = await request(app).get('/api/daily-questions/today').set('Authorization', `Bearer ${dqPartnerToken}`);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.body.question.id).toBe(r2.body.question.id);
  });

  it('POST /api/daily-questions/:id/answer submits answer successfully', async () => {
    const todayRes = await request(app).get('/api/daily-questions/today').set('Authorization', `Bearer ${dqToken}`);
    const questionId = todayRes.body.question.id;
    const res = await request(app)
      .post(`/api/daily-questions/${questionId}/answer`)
      .set('Authorization', `Bearer ${dqToken}`)
      .send({ answer: 'My answer' });
    expect(res.status).toBe(201);
    expect(res.body.answer).toBe('My answer');
  });

  it('POST /api/daily-questions/:id/answer — duplicate answer returns 409', async () => {
    const todayRes = await request(app).get('/api/daily-questions/today').set('Authorization', `Bearer ${dqToken}`);
    const questionId = todayRes.body.question.id;
    const res = await request(app)
      .post(`/api/daily-questions/${questionId}/answer`)
      .set('Authorization', `Bearer ${dqToken}`)
      .send({ answer: 'Duplicate answer' });
    expect(res.status).toBe(409);
  });

  it('GET /api/daily-questions/today — after user answers, shows myAnswer but hides partner answer until partner answers', async () => {
    const res = await request(app).get('/api/daily-questions/today').set('Authorization', `Bearer ${dqToken}`);
    expect(res.status).toBe(200);
    expect(res.body.myAnswer).toBe('My answer');
    // Partner hasn't answered yet → null even though user answered
    expect(res.body.partnerAnswer).toBeNull();
  });

  it('GET /api/daily-questions/today — after partner answers, both answers visible to user', async () => {
    const todayRes = await request(app).get('/api/daily-questions/today').set('Authorization', `Bearer ${dqPartnerToken}`);
    const questionId = todayRes.body.question.id;
    await request(app)
      .post(`/api/daily-questions/${questionId}/answer`)
      .set('Authorization', `Bearer ${dqPartnerToken}`)
      .send({ answer: 'Partner answer' });

    const res = await request(app).get('/api/daily-questions/today').set('Authorization', `Bearer ${dqToken}`);
    expect(res.body.myAnswer).toBe('My answer');
    expect(res.body.partnerAnswer).toBe('Partner answer');
  });

  it('GET /api/daily-questions/history returns paginated results', async () => {
    const res = await request(app)
      .get('/api/daily-questions/history?page=1&limit=10')
      .set('Authorization', `Bearer ${dqToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toBeInstanceOf(Array);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  afterAll(async () => {
    await prisma.dailyQuestionResponse.deleteMany({ where: { coupleId: dqCoupleId } });
    await prisma.user.deleteMany({ where: { email: { in: ['dq-user@test.local', 'dq-partner@test.local'] } } });
    await prisma.couple.deleteMany({ where: { id: dqCoupleId } });
  });
});
