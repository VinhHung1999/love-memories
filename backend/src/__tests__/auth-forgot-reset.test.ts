// Phase 1B (Boss directive 2026-04-28) — mock Prisma via prismock so
// this suite never opens a real Postgres connection. See api.test.ts
// for the full incident write-up.
jest.mock('../utils/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismockClient } = require('prismock');
  const instance = new PrismockClient();
  return { __esModule: true, default: instance };
});

import request from 'supertest';
import app from '../index';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword, generateAccessToken } from '../utils/auth';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

const RESET_EMAIL = 'reset-test@lovescrum.test';
const RESET_GOOGLE_EMAIL = 'reset-google@lovescrum.test';
const ORIGINAL_PASSWORD = 'original-pass-123';
const NEW_PASSWORD = 'brand-new-pass-456';

let userId: string;
let googleOnlyUserId: string;

// Prismock starts empty — no cleanup needed.
beforeAll(async () => {
  const passwordUser = await prisma.user.create({
    data: {
      email: RESET_EMAIL,
      password: await hashPassword(ORIGINAL_PASSWORD),
      name: 'Reset Tester',
    },
  });
  userId = passwordUser.id;

  const googleUser = await prisma.user.create({
    data: {
      email: RESET_GOOGLE_EMAIL,
      password: null,
      googleId: 'google-reset-test-uid',
      name: 'Google Only',
    },
  });
  googleOnlyUserId = googleUser.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/forgot-password', () => {
  it('returns 400 for missing email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('returns 200 + creates token for registered password user', async () => {
    const before = await prisma.passwordReset.count({ where: { userId } });
    const res = await request(app).post('/api/auth/forgot-password').send({ email: RESET_EMAIL });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const after = await prisma.passwordReset.count({ where: { userId } });
    expect(after).toBe(before + 1);
  });

  it('returns 200 + skips token creation for unknown email (no enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody-here@lovescrum.test' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 200 + skips token creation for Google-only account', async () => {
    const before = await prisma.passwordReset.count({ where: { userId: googleOnlyUserId } });
    const res = await request(app).post('/api/auth/forgot-password').send({ email: RESET_GOOGLE_EMAIL });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const after = await prisma.passwordReset.count({ where: { userId: googleOnlyUserId } });
    expect(after).toBe(before);
  });

  it('replaces previous unused tokens (only newest is valid)', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: RESET_EMAIL });
    await request(app).post('/api/auth/forgot-password').send({ email: RESET_EMAIL });
    const unused = await prisma.passwordReset.count({ where: { userId, usedAt: null } });
    expect(unused).toBe(1);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('returns 400 for missing token', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ newPassword: 'whatever-123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for too-short password', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'anything', newPassword: 'abc' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for unknown token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'definitely-not-a-real-token', newPassword: NEW_PASSWORD });
    expect(res.status).toBe(400);
  });

  it('returns 400 for expired token', async () => {
    const expired = await prisma.passwordReset.create({
      data: { userId, token: 'expired-reset-token-xyz', expiresAt: new Date(Date.now() - 1000) },
    });
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: expired.token, newPassword: NEW_PASSWORD });
    expect(res.status).toBe(400);
    await prisma.passwordReset.delete({ where: { id: expired.id } });
  });

  it('updates password, marks token used, revokes refresh tokens', async () => {
    // Issue a fresh reset and capture the token directly from DB
    await prisma.passwordReset.deleteMany({ where: { userId, usedAt: null } });
    await request(app).post('/api/auth/forgot-password').send({ email: RESET_EMAIL });
    const reset = await prisma.passwordReset.findFirst({
      where: { userId, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    expect(reset).not.toBeNull();

    // Simulate an active session for this user before the reset
    await prisma.refreshToken.create({
      data: {
        userId,
        token: 'active-refresh-token-to-be-revoked',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: reset!.token, newPassword: NEW_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Token marked used
    const after = await prisma.passwordReset.findUnique({ where: { id: reset!.id } });
    expect(after!.usedAt).not.toBeNull();

    // Password actually updated
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(await comparePassword(NEW_PASSWORD, user!.password!)).toBe(true);
    expect(await comparePassword(ORIGINAL_PASSWORD, user!.password!)).toBe(false);

    // All refresh tokens revoked
    const liveRefresh = await prisma.refreshToken.count({ where: { userId, revokedAt: null } });
    expect(liveRefresh).toBe(0);

    // New password works for login
    const login = await request(app).post('/api/auth/login').send({ email: RESET_EMAIL, password: NEW_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeTruthy();
  });

  it('returns 400 for already-used token', async () => {
    const reset = await prisma.passwordReset.findFirst({
      where: { userId, usedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    expect(reset).not.toBeNull();
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: reset!.token, newPassword: 'another-new-pass-789' });
    expect(res.status).toBe(400);
  });
});

// Suppress unused-variable warnings (kept for parity with api.test.ts patterns).
void generateAccessToken;
