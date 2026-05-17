// Sprint 70 T472 — GET /api/map/moments?bounds= tests.
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

const COUPLE_ID = 'map-moments-couple';
const OTHER_COUPLE_ID = 'other-couple';
let userToken: string;

// Three fixture Moments — one inside the test bbox (Hanoi-ish), one outside
// (Saigon-ish), one with NULL lat/lng (no location). The fourth Moment lives
// on a different couple to verify scoping.
const HANOI_LAT = 21.0285;
const HANOI_LNG = 105.8542;
const SAIGON_LAT = 10.7626;
const SAIGON_LNG = 106.6602;

beforeAll(async () => {
  await prisma.couple.create({ data: { id: COUPLE_ID, name: 'Memory Map Couple' } });
  await prisma.couple.create({ data: { id: OTHER_COUPLE_ID, name: 'Other Couple' } });

  const hashed = await hashPassword('pw-12345');
  const user = await prisma.user.create({
    data: {
      email: 't472-author@test.local',
      password: hashed,
      name: 'Pin Author',
      coupleId: COUPLE_ID,
    },
  });
  const otherUser = await prisma.user.create({
    data: {
      email: 't472-other@test.local',
      password: hashed,
      name: 'Other',
      coupleId: OTHER_COUPLE_ID,
    },
  });
  userToken = generateToken(user.id, COUPLE_ID);

  // In-bbox Moment with photo (polaroid pin expected)
  const mInside = await prisma.moment.create({
    data: {
      coupleId: COUPLE_ID,
      authorId: user.id,
      title: 'Cafe in Hanoi',
      date: new Date('2026-05-01'),
      location: 'Hoan Kiem',
      latitude: HANOI_LAT,
      longitude: HANOI_LNG,
    },
  });
  await prisma.momentPhoto.create({
    data: {
      momentId: mInside.id,
      url: 'https://cdn.example/hanoi.jpg',
      filename: 'hanoi.jpg',
    },
  });

  // Out-of-bbox Moment without photo (heart pin if it were in-bbox)
  await prisma.moment.create({
    data: {
      coupleId: COUPLE_ID,
      authorId: user.id,
      title: 'Saigon walk',
      date: new Date('2026-05-02'),
      location: 'District 1',
      latitude: SAIGON_LAT,
      longitude: SAIGON_LNG,
    },
  });

  // Null-location Moment (must not appear in any bbox query)
  await prisma.moment.create({
    data: {
      coupleId: COUPLE_ID,
      authorId: user.id,
      title: 'No location',
      date: new Date('2026-05-03'),
      location: null,
      latitude: null,
      longitude: null,
    },
  });

  // Different-couple Moment in the same bbox (must not leak across couples)
  await prisma.moment.create({
    data: {
      coupleId: OTHER_COUPLE_ID,
      authorId: otherUser.id,
      title: 'Stranger pin',
      date: new Date('2026-05-04'),
      location: 'Hanoi',
      latitude: HANOI_LAT,
      longitude: HANOI_LNG,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Sprint 70 T472 — GET /api/map/moments?bounds=', () => {
  const HANOI_BBOX = '20,104,22,107'; // south,west,north,east — covers Hanoi

  it('returns only the in-bbox Moment for the auth couple', async () => {
    const res = await request(app)
      .get(`/api/map/moments?bounds=${HANOI_BBOX}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Cafe in Hanoi');
    expect(res.body[0].kind).toBe('polaroid'); // has 1 photo
    expect(res.body[0].thumbnailUrl).toBe('https://cdn.example/hanoi.jpg');
    expect(res.body[0].hasAudio).toBe(false);
    expect(res.body[0].author.name).toBe('Pin Author');
  });

  it('returns empty array when bbox covers no Moments', async () => {
    const res = await request(app)
      .get('/api/map/moments?bounds=0,0,1,1') // off the coast of Africa
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('excludes Moments with null lat/lng even if other rows match', async () => {
    // World-wide bbox — would include null-coord row if filter is wrong.
    const res = await request(app)
      .get('/api/map/moments?bounds=-90,-180,90,180')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    // Should be the 2 placed Moments (Hanoi + Saigon), not 3.
    expect(res.body).toHaveLength(2);
    expect(res.body.find((m: { title: string }) => m.title === 'No location')).toBeUndefined();
  });

  it('does not leak Moments from other couples', async () => {
    const res = await request(app)
      .get(`/api/map/moments?bounds=${HANOI_BBOX}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.find((m: { title: string }) => m.title === 'Stranger pin')).toBeUndefined();
  });

  it('400 when bounds query is missing', async () => {
    const res = await request(app)
      .get('/api/map/moments')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
  });

  it('400 when bounds has wrong number of parts', async () => {
    const res = await request(app)
      .get('/api/map/moments?bounds=1,2,3')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
  });

  it('400 when SW corner is north of NE corner (bounds inverted)', async () => {
    const res = await request(app)
      .get('/api/map/moments?bounds=22,104,20,107')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
  });

  it('401 without auth header', async () => {
    const res = await request(app).get(`/api/map/moments?bounds=${HANOI_BBOX}`);
    expect(res.status).toBe(401);
  });
});
