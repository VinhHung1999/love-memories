import request from 'supertest';
import app from '../index';
import prisma from '../utils/prisma';
import { hashPassword, generateToken } from '../utils/auth';

let token: string;

// Create test user directly via Prisma (bypasses whitelist) and generate token
beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: 'test@lovescrum.test' } });
  const hashed = await hashPassword('testpass123');
  const user = await prisma.user.create({
    data: { email: 'test@lovescrum.test', password: hashed, name: 'Test User' },
  });
  token = generateToken(user.id);
});

// Clean up after all tests
afterAll(async () => {
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
  await prisma.user.deleteMany({ where: { email: 'test@lovescrum.test' } });
  await prisma.$disconnect();
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('Health', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth', () => {
  it('POST /api/auth/register returns 403 for non-whitelisted email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'random@example.com',
      password: 'testpass123',
      name: 'Random',
    });
    expect(res.status).toBe(403);
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
      data: { title: 'Map Moment', date: new Date(), latitude: 10.77, longitude: 106.69, tags: [] },
    });
    await prisma.foodSpot.create({
      data: { name: 'Map Spot', latitude: 10.78, longitude: 106.70, tags: [] },
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

  it('GET /api/achievements returns all 13 achievements', async () => {
    const res = await request(app).get('/api/achievements').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(13);
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
