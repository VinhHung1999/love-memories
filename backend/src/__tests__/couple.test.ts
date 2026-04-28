// Sprint 68 T462 — POST /api/couple atomic create tests.
// Mocked via prismock per the Sprint 67 D11 rule (`jest.mock('../utils/prisma')`
// before any service import) so these run with no real DB connection.

jest.mock('../utils/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismockClient } = require('prismock');
  const instance = new PrismockClient();
  return { __esModule: true, default: instance };
});

// Sprint 68 T463: mock the push fan-out so we can assert it fired without
// touching real APNs / VAPID. Both functions resolve to undefined — the
// caller (createNotification) wraps them in Promise.allSettled and ignores
// failures, so a noop mock matches the silent-fail contract precisely.
jest.mock('../services/PushService', () => ({
  __esModule: true,
  sendPushNotification: jest.fn().mockResolvedValue(undefined),
  sendMobilePushNotification: jest.fn().mockResolvedValue(undefined),
}));

import crypto from 'crypto';
import request from 'supertest';
import app from '../index';
import prisma from '../utils/prisma';
import { hashPassword, generateToken } from '../utils/auth';
import * as PushService from '../services/PushService';

let pairedToken: string;
let unpairedUserA: { id: string; token: string };
let unpairedUserB: { id: string; token: string };

const PAIRED_COUPLE_ID = 'paired-couple-t462';

async function makeUnpairedUser(email: string): Promise<{ id: string; token: string }> {
  const hashed = await hashPassword('pw-12345');
  const user = await prisma.user.create({
    data: { email, password: hashed, name: 'Unpaired User' },
  });
  // generateToken signs `coupleId` into the JWT — null is fine for unpaired users
  // because the auth middleware accepts `coupleId: null` and falls through to
  // the requireCouple gate per route.
  return { id: user.id, token: generateToken(user.id, null as unknown as string) };
}

beforeAll(async () => {
  await prisma.couple.create({ data: { id: PAIRED_COUPLE_ID, name: 'Paired' } });
  const hashed = await hashPassword('pw-12345');
  const paired = await prisma.user.create({
    data: { email: 'paired@t462.test', password: hashed, name: 'Paired User', coupleId: PAIRED_COUPLE_ID },
  });
  pairedToken = generateToken(paired.id, PAIRED_COUPLE_ID);

  unpairedUserA = await makeUnpairedUser('unpaired-a@t462.test');
  unpairedUserB = await makeUnpairedUser('unpaired-b@t462.test');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Sprint 68 T462 — POST /api/couple atomic create', () => {
  it('creates couple + persists slogan in AppSetting + rotates tokens (201)', async () => {
    const res = await request(app)
      .post('/api/couple')
      .set('Authorization', `Bearer ${unpairedUserA.token}`)
      .send({
        name: 'Linh & Minh',
        anniversaryDate: '2023-02-14',
        slogan: 'Our little world, beautifully organized',
      });

    expect(res.status).toBe(201);
    expect(res.body.couple).toMatchObject({
      name: 'Linh & Minh',
      slogan: 'Our little world, beautifully organized',
    });
    expect(res.body.couple.id).toBeDefined();
    expect(res.body.couple.inviteCode).toMatch(/^[a-f0-9]{8}$/);
    expect(res.body.inviteUrl).toContain(`/join/${res.body.couple.inviteCode}`);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // Token rotation contract — memory bugs_refresh_token_rotation Sprint 63.
    expect(res.body.user.coupleId).toBe(res.body.couple.id);

    const slogan = await prisma.appSetting.findUnique({
      where: { key_coupleId: { key: 'app_slogan', coupleId: res.body.couple.id } },
    });
    expect(slogan?.value).toBe('Our little world, beautifully organized');

    const user = await prisma.user.findUnique({ where: { id: unpairedUserA.id } });
    expect(user?.coupleId).toBe(res.body.couple.id);
  });

  it('creates couple WITHOUT AppSetting row when slogan empty', async () => {
    const res = await request(app)
      .post('/api/couple')
      .set('Authorization', `Bearer ${unpairedUserB.token}`)
      .send({ name: 'Solo Couple', anniversaryDate: null, slogan: '' });

    expect(res.status).toBe(201);
    expect(res.body.couple.slogan).toBeNull();

    const slogan = await prisma.appSetting.findUnique({
      where: { key_coupleId: { key: 'app_slogan', coupleId: res.body.couple.id } },
    });
    expect(slogan).toBeNull();
  });

  it('rejects with 409 if user already paired', async () => {
    const res = await request(app)
      .post('/api/couple')
      .set('Authorization', `Bearer ${pairedToken}`)
      .send({ name: 'Should Fail', slogan: 'nope' });

    expect(res.status).toBe(409);
  });

  it('rejects with 400 when name missing (Zod)', async () => {
    const fresh = await makeUnpairedUser('fresh-no-name@t462.test');
    const res = await request(app)
      .post('/api/couple')
      .set('Authorization', `Bearer ${fresh.token}`)
      .send({ slogan: 'no name provided' });

    expect(res.status).toBe(400);
  });

  it('rejects with 400 when slogan exceeds 120 chars', async () => {
    const fresh = await makeUnpairedUser('fresh-long-slogan@t462.test');
    const res = await request(app)
      .post('/api/couple')
      .set('Authorization', `Bearer ${fresh.token}`)
      .send({ name: 'Test', slogan: 'x'.repeat(121) });

    expect(res.status).toBe(400);
  });
});

describe('Sprint 68 T463 — POST /api/couple/join fires partner_joined push', () => {
  beforeEach(() => {
    (PushService.sendMobilePushNotification as jest.Mock).mockClear();
    (PushService.sendPushNotification as jest.Mock).mockClear();
  });

  async function setupCreatorAwaitingJoiner() {
    const hashed = await hashPassword('pw-12345');
    const creator = await prisma.user.create({
      data: { email: `creator-${Math.random()}@t463.test`, password: hashed, name: 'Anh Hùng' },
    });
    const couple = await prisma.couple.create({
      data: { name: 'Awaiting Couple', inviteCode: crypto.randomBytes(4).toString('hex') },
    });
    await prisma.user.update({ where: { id: creator.id }, data: { coupleId: couple.id } });
    return {
      creator,
      inviteCode: couple.inviteCode!,
      coupleId: couple.id,
    };
  }

  it('inserts notification row + fires push to creator on successful redeem', async () => {
    const { creator, inviteCode } = await setupCreatorAwaitingJoiner();
    const joiner = await makeUnpairedUser('joiner-success@t463.test');

    const res = await request(app)
      .post('/api/couple/join')
      .set('Authorization', `Bearer ${joiner.token}`)
      .send({ inviteCode });

    expect(res.status).toBe(200);
    expect(res.body.user.coupleId).toBeDefined();

    const notis = await prisma.notification.findMany({
      where: { userId: creator.id, type: 'partner_joined' },
    });
    expect(notis).toHaveLength(1);
    expect(notis[0].title).toBe('Có người vừa ghép đôi với em rồi 🐶');
    expect(notis[0].message).toContain('Unpaired User');
    expect(notis[0].link).toBe('/(auth)/onboarding-done');

    expect(PushService.sendMobilePushNotification).toHaveBeenCalledTimes(1);
    expect(PushService.sendMobilePushNotification).toHaveBeenCalledWith(
      creator.id,
      'Có người vừa ghép đôi với em rồi 🐶',
      expect.stringContaining('Unpaired User'),
      '/(auth)/onboarding-done',
    );
  });

  it('still inserts notification row when push send fails silently (no token)', async () => {
    (PushService.sendMobilePushNotification as jest.Mock).mockRejectedValueOnce(new Error('no token'));

    const { creator, inviteCode } = await setupCreatorAwaitingJoiner();
    const joiner = await makeUnpairedUser('joiner-no-token@t463.test');

    const res = await request(app)
      .post('/api/couple/join')
      .set('Authorization', `Bearer ${joiner.token}`)
      .send({ inviteCode });

    expect(res.status).toBe(200);
    const notis = await prisma.notification.findMany({
      where: { userId: creator.id, type: 'partner_joined' },
    });
    expect(notis).toHaveLength(1);
  });

  it('does NOT fire push when invite code is invalid', async () => {
    const joiner = await makeUnpairedUser('joiner-bad-code@t463.test');
    const res = await request(app)
      .post('/api/couple/join')
      .set('Authorization', `Bearer ${joiner.token}`)
      .send({ inviteCode: 'definitely-not-real' });

    expect(res.status).toBe(400);
    expect(PushService.sendMobilePushNotification).not.toHaveBeenCalled();
  });
});

describe('Sprint 68 T464 — GET /api/couple paired flag', () => {
  it('returns paired:false when only one user is in the couple', async () => {
    // Reuse PAIRED_COUPLE_ID's existing tests get cluttered by side-effects
    // of T462 / T463 — build a fresh single-user couple instead.
    const coupleId = `solo-couple-t464-${Math.random().toString(16).slice(2, 8)}`;
    await prisma.couple.create({ data: { id: coupleId, name: 'Solo Couple T464' } });
    const hashed = await hashPassword('pw-12345');
    const solo = await prisma.user.create({
      data: { email: `solo-${coupleId}@t464.test`, password: hashed, name: 'Solo User', coupleId },
    });
    const token = generateToken(solo.id, coupleId);

    const res = await request(app)
      .get('/api/couple')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.paired).toBe(false);
    expect(res.body.memberCount).toBe(1);
  });

  it('returns paired:true when both partners are present', async () => {
    const coupleId = `pair-couple-t464-${Math.random().toString(16).slice(2, 8)}`;
    await prisma.couple.create({ data: { id: coupleId, name: 'Pair Couple T464' } });
    const hashed = await hashPassword('pw-12345');
    const a = await prisma.user.create({
      data: { email: `pair-a-${coupleId}@t464.test`, password: hashed, name: 'A', coupleId },
    });
    await prisma.user.create({
      data: { email: `pair-b-${coupleId}@t464.test`, password: hashed, name: 'B', coupleId },
    });
    const token = generateToken(a.id, coupleId);

    const res = await request(app)
      .get('/api/couple')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.paired).toBe(true);
    expect(res.body.memberCount).toBe(2);
  });
});
