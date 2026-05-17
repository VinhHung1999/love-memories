// Sprint 68 T471 — PUT /api/profile color extension tests.
// Mocked via prismock per the Sprint 67 D11 rule.

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

const COUPLE_ID = 'profile-test-couple';
let userToken: string;

beforeAll(async () => {
  await prisma.couple.create({ data: { id: COUPLE_ID, name: 'Profile Couple' } });
  const hashed = await hashPassword('pw-12345');
  const user = await prisma.user.create({
    data: { email: 'profile-color@t471.test', password: hashed, name: 'Color User', coupleId: COUPLE_ID },
  });
  userToken = generateToken(user.id, COUPLE_ID);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Sprint 68 T471 — PUT /api/profile color', () => {
  it('updates color to a valid token', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ color: 'primary' });

    expect(res.status).toBe(200);
    expect(res.body.color).toBe('primary');
  });

  it('clears color when explicit null', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ color: null });

    expect(res.status).toBe(200);
    expect(res.body.color).toBeNull();
  });

  it('rejects invalid color token (Zod 400)', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ color: 'not-a-token' });

    expect(res.status).toBe(400);
  });

  it('updates name only — color untouched', async () => {
    await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ color: 'accent' });

    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Renamed' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
    expect(res.body.color).toBe('accent');
  });

  it('updates both name and color in one call', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Combo', color: 'secondary' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Combo');
    expect(res.body.color).toBe('secondary');
  });

  // Sprint 68 D1prime — prototype enum extended with sunset + mint.
  it('accepts new sunset key', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ color: 'sunset' });

    expect(res.status).toBe(200);
    expect(res.body.color).toBe('sunset');
  });

  it('accepts new mint key', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ color: 'mint' });

    expect(res.status).toBe(200);
    expect(res.body.color).toBe('mint');
  });
});
