import request from 'supertest';
import app from '../index';
import prisma from '../utils/prisma';

// Clean up after all tests
afterAll(async () => {
  await prisma.momentPhoto.deleteMany();
  await prisma.moment.deleteMany();
  await prisma.foodSpotPhoto.deleteMany();
  await prisma.foodSpot.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.$disconnect();
});

describe('Health', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Moments CRUD', () => {
  let momentId: string;

  it('POST /api/moments creates a moment', async () => {
    const res = await request(app)
      .post('/api/moments')
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
    const res = await request(app).get('/api/moments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/moments/:id gets a moment', async () => {
    const res = await request(app).get(`/api/moments/${momentId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(momentId);
  });

  it('PUT /api/moments/:id updates a moment', async () => {
    const res = await request(app)
      .put(`/api/moments/${momentId}`)
      .send({ title: 'Updated Moment' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Moment');
  });

  it('DELETE /api/moments/:id deletes a moment', async () => {
    const res = await request(app).delete(`/api/moments/${momentId}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Moment deleted');
  });

  it('GET /api/moments/:id returns 404 for deleted moment', async () => {
    const res = await request(app).get(`/api/moments/${momentId}`);
    expect(res.status).toBe(404);
  });
});

describe('Food Spots CRUD', () => {
  let spotId: string;

  it('POST /api/foodspots creates a food spot', async () => {
    const res = await request(app)
      .post('/api/foodspots')
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
    const res = await request(app).get('/api/foodspots');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/foodspots/:id gets a food spot', async () => {
    const res = await request(app).get(`/api/foodspots/${spotId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(spotId);
  });

  it('PUT /api/foodspots/:id updates a food spot', async () => {
    const res = await request(app)
      .put(`/api/foodspots/${spotId}`)
      .send({ name: 'Updated Restaurant', rating: 5 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Restaurant');
  });

  it('DELETE /api/foodspots/:id deletes a food spot', async () => {
    const res = await request(app).delete(`/api/foodspots/${spotId}`);
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
    const res = await request(app).get('/api/map/pins');
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
    const res = await request(app).get('/api/sprints/active');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACTIVE');
  });

  it('PATCH /api/sprints/:id/status updates sprint status', async () => {
    const res = await request(app)
      .patch(`/api/sprints/${sprintId}/status`)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
    // Reset back to ACTIVE for subsequent tests
    await request(app).patch(`/api/sprints/${sprintId}/status`).send({ status: 'ACTIVE' });
  });

  it('POST /api/goals/sprint/:id creates a goal with description+dueDate', async () => {
    const res = await request(app)
      .post(`/api/goals/sprint/${sprintId}`)
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
      .send({ title: 'Backlog Goal', priority: 'LOW' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Backlog Goal');
    expect(res.body.sprintId).toBeNull();
    backlogGoalId = res.body.id;
  });

  it('GET /api/goals/backlog returns backlog goals', async () => {
    const res = await request(app).get('/api/goals/backlog');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((g: any) => g.id === backlogGoalId)).toBe(true);
  });

  it('PATCH /api/goals/:id/assign assigns goal to sprint', async () => {
    const res = await request(app)
      .patch(`/api/goals/${backlogGoalId}/assign`)
      .send({ sprintId });
    expect(res.status).toBe(200);
    expect(res.body.sprintId).toBe(sprintId);
  });

  it('PATCH /api/goals/:id/assign unassigns goal (to backlog)', async () => {
    const res = await request(app)
      .patch(`/api/goals/${backlogGoalId}/assign`)
      .send({ sprintId: null });
    expect(res.status).toBe(200);
    expect(res.body.sprintId).toBeNull();
  });

  it('PATCH /api/goals/:id/status updates goal status', async () => {
    const res = await request(app)
      .patch(`/api/goals/${goalId}/status`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('PATCH /api/goals/reorder reorders goals', async () => {
    const res = await request(app)
      .patch('/api/goals/reorder')
      .send({ goals: [{ id: goalId, order: 1, status: 'DONE' }] });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/goals/:id deletes a goal', async () => {
    const res = await request(app).delete(`/api/goals/${goalId}`);
    expect(res.status).toBe(200);
  });

  it('DELETE /api/goals/:id deletes backlog goal', async () => {
    const res = await request(app).delete(`/api/goals/${backlogGoalId}`);
    expect(res.status).toBe(200);
  });

  it('DELETE /api/sprints/:id deletes a sprint', async () => {
    const res = await request(app).delete(`/api/sprints/${sprintId}`);
    expect(res.status).toBe(200);
  });
});

describe('Validation', () => {
  it('POST /api/moments with missing title returns 400', async () => {
    const res = await request(app).post('/api/moments').send({ date: '2024-01-01' });
    expect(res.status).toBe(400);
  });

  it('POST /api/foodspots with missing name returns 400', async () => {
    const res = await request(app).post('/api/foodspots').send({ rating: 3 });
    expect(res.status).toBe(400);
  });

  it('POST /api/sprints with missing dates returns 400', async () => {
    const res = await request(app).post('/api/sprints').send({ name: 'Bad Sprint' });
    expect(res.status).toBe(400);
  });
});
