// Sprint 68 T462 — POST /api/couple atomic create tests.
// Mocked via prismock per the Sprint 67 D11 rule (`jest.mock('../utils/prisma')`
// before any service import) so these run with no real DB connection.

jest.mock('../utils/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismockClient } = require('prismock');
  const instance = new PrismockClient();
  return { __esModule: true, default: instance };
});

import request from 'supertest';
import app from '../index';
import prisma from '../utils/prisma';
import { hashPassword, generateToken } from '../utils/auth';

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
