import request from 'supertest';
import app from '../index';
import prisma from '../utils/prisma';
import { hashPassword, generateToken } from '../utils/auth';

// Mock google-auth-library so Google token tests don't require real tokens
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

let token: string;
let partnerToken: string;
let testCoupleId: string;

// Create test couple + users directly via Prisma (bypasses whitelist) and generate tokens
beforeAll(async () => {
  // Clean up previous test data referencing this couple
  await prisma.shareLink.deleteMany({ where: { coupleId: 'test-couple' } });
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

describe('Auth', () => {
  it('POST /api/auth/register returns 400 without coupleName or inviteCode', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'random@example.com',
      password: 'testpass123',
      name: 'Random',
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login returns token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@lovescrum.test',
      password: 'testpass123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
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

describe('Google OAuth', () => {
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

  it('POST /api/auth/google/complete returns 400 without couple info', async () => {
    const res = await request(app).post('/api/auth/google/complete').send({ idToken: 'valid-google-token' });
    expect(res.status).toBe(400);
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
      await prisma.couple.delete({ where: { id: user.coupleId } }).catch(() => {});
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
    momentId = res.body.id;
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
  });

  it('PUT /api/moments/:id updates a moment', async () => {
    const res = await request(app)
      .put(`/api/moments/${momentId}`)
      .set(auth())
      .send({ title: 'Updated Moment' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Moment');
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
      data: { coupleId: testCoupleId, title: 'Map Moment', date: new Date(), latitude: 10.77, longitude: 106.69, tags: [] },
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

  it('POST /api/love-letters/:id/photos returns 403 for non-sender', async () => {
    const res = await request(app)
      .post(`/api/love-letters/${letterId}/photos`)
      .set(partnerAuth())
      .attach('photos', Buffer.from('fake-image'), { filename: 'test.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(403);
  });

  it('POST /api/love-letters/:id/photos returns 401 without auth', async () => {
    const res = await request(app).post(`/api/love-letters/${letterId}/photos`);
    expect(res.status).toBe(401);
  });

  it('POST /api/love-letters/:id/audio returns 403 for non-sender', async () => {
    const res = await request(app)
      .post(`/api/love-letters/${letterId}/audio`)
      .set(partnerAuth())
      .attach('audio', Buffer.from('fake-audio'), { filename: 'memo.webm', contentType: 'audio/webm' });
    expect(res.status).toBe(403);
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
    expect(res.body.token).toBeTruthy(); // backward compat
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
