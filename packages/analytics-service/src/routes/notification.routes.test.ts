import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { correlationIdMiddleware } from '../middleware/correlation-id.js';
import { errorHandler } from '../middleware/error-handler.js';
import notificationRoutes from './notification.routes.js';
import pool from '../config/database.js';

jest.mock('../config/database.js', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockQuery = pool.query as jest.Mock;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

function makeToken(payload: { userId: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET);
}

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(correlationIdMiddleware);
  app.use(notificationRoutes);
  app.use(errorHandler);
  return app;
}

const consumerToken = makeToken({ userId: 'consumer-1', email: 'c@test.com', role: 'consumer' });

describe('GET /v1/notifications', () => {
  const app = buildApp();

  beforeEach(() => jest.clearAllMocks());

  it('should return 401 without token', async () => {
    const res = await request(app).get('/v1/notifications');
    expect(res.status).toBe(401);
  });

  it('should return 200 with default pagination', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/v1/notifications')
      .set('Authorization', 'Bearer ' + consumerToken);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ notifications: [], total: 0, page: 1, pageSize: 20 });
  });

  it('should filter by read=true', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'n1', read: true }] });

    const res = await request(app)
      .get('/v1/notifications?read=true')
      .set('Authorization', 'Bearer ' + consumerToken);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[0]).toContain('consumer_id = $1');
    expect(countCall[0]).toContain('read = $2');
    expect(countCall[1]).toEqual(['consumer-1', true]);
  });

  it('should filter by read=false', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'n1' }, { id: 'n2' }] });

    const res = await request(app)
      .get('/v1/notifications?read=false')
      .set('Authorization', 'Bearer ' + consumerToken);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[1]).toEqual(['consumer-1', false]);
  });

  it('should respect page and pageSize params', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 30 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'n1' }] });

    const res = await request(app)
      .get('/v1/notifications?page=2&pageSize=10')
      .set('Authorization', 'Bearer ' + consumerToken);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.pageSize).toBe(10);

    const selectCall = mockQuery.mock.calls[1];
    // LIMIT=10, OFFSET=10 (page 2, size 10)
    expect(selectCall[1]).toEqual(['consumer-1', 10, 10]);
  });

  it('should cap pageSize at 50', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/v1/notifications?pageSize=200')
      .set('Authorization', 'Bearer ' + consumerToken);

    expect(res.status).toBe(200);
    expect(res.body.pageSize).toBe(50);
  });

  it('should return 500 when database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .get('/v1/notifications')
      .set('Authorization', 'Bearer ' + consumerToken);

    expect(res.status).toBe(500);
  });
});

describe('PUT /v1/notifications/:id/read', () => {
  const app = buildApp();

  beforeEach(() => jest.clearAllMocks());

  it('should return 401 without token', async () => {
    const res = await request(app).put('/v1/notifications/some-id/read');
    expect(res.status).toBe(401);
  });

  it('should return 200 and mark notification as read', async () => {
    const notification = { id: 'n1', consumer_id: 'consumer-1', read: true, read_at: '2025-01-01' };
    mockQuery.mockResolvedValueOnce({ rows: [notification] });

    const res = await request(app)
      .put('/v1/notifications/n1/read')
      .set('Authorization', 'Bearer ' + consumerToken);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(notification);

    const call = mockQuery.mock.calls[0];
    expect(call[0]).toContain('UPDATE notification SET read = true');
    expect(call[1]).toEqual(['n1', 'consumer-1']);
  });

  it('should return 404 when notification not found or not owned', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/v1/notifications/unknown-id/read')
      .set('Authorization', 'Bearer ' + consumerToken);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 500 when database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .put('/v1/notifications/n1/read')
      .set('Authorization', 'Bearer ' + consumerToken);

    expect(res.status).toBe(500);
  });
});

describe('PUT /v1/notifications/preferences', () => {
  const app = buildApp();

  beforeEach(() => jest.clearAllMocks());

  it('should return 401 without token', async () => {
    const res = await request(app)
      .put('/v1/notifications/preferences')
      .send({ preferences: [] });
    expect(res.status).toBe(401);
  });

  it('should return 400 when preferences is missing', async () => {
    const res = await request(app)
      .put('/v1/notifications/preferences')
      .set('Authorization', 'Bearer ' + consumerToken)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when preferences is empty array', async () => {
    const res = await request(app)
      .put('/v1/notifications/preferences')
      .set('Authorization', 'Bearer ' + consumerToken)
      .send({ preferences: [] });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid eventType', async () => {
    const res = await request(app)
      .put('/v1/notifications/preferences')
      .set('Authorization', 'Bearer ' + consumerToken)
      .send({
        preferences: [{ eventType: 'invalid_type', emailEnabled: true, portalEnabled: true }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Invalid eventType');
  });

  it('should return 400 when emailEnabled is not boolean', async () => {
    const res = await request(app)
      .put('/v1/notifications/preferences')
      .set('Authorization', 'Bearer ' + consumerToken)
      .send({
        preferences: [{ eventType: 'general', emailEnabled: 'yes', portalEnabled: true }],
      });

    expect(res.status).toBe(400);
  });

  it('should return 200 and upsert preferences', async () => {
    const pref1 = { id: 'p1', consumer_id: 'consumer-1', event_type: 'general', email_enabled: true, portal_enabled: false };
    const pref2 = { id: 'p2', consumer_id: 'consumer-1', event_type: 'sunset', email_enabled: false, portal_enabled: true };
    mockQuery
      .mockResolvedValueOnce({ rows: [pref1] })
      .mockResolvedValueOnce({ rows: [pref2] });

    const res = await request(app)
      .put('/v1/notifications/preferences')
      .set('Authorization', 'Bearer ' + consumerToken)
      .send({
        preferences: [
          { eventType: 'general', emailEnabled: true, portalEnabled: false },
          { eventType: 'sunset', emailEnabled: false, portalEnabled: true },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(mockQuery).toHaveBeenCalledTimes(2);

    const call = mockQuery.mock.calls[0];
    expect(call[0]).toContain('ON CONFLICT (consumer_id, event_type)');
    expect(call[1]).toEqual(['consumer-1', 'general', true, false]);
  });

  it('should return 500 when database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .put('/v1/notifications/preferences')
      .set('Authorization', 'Bearer ' + consumerToken)
      .send({
        preferences: [{ eventType: 'general', emailEnabled: true, portalEnabled: true }],
      });

    expect(res.status).toBe(500);
  });
});

describe('POST /v1/internal/notifications/send', () => {
  const app = buildApp();

  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/v1/internal/notifications/send')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        'consumerId is required',
        'type is required',
        'title is required',
        'message is required',
      ])
    );
  });

  it('should return 400 for invalid type', async () => {
    const res = await request(app)
      .post('/v1/internal/notifications/send')
      .send({ consumerId: 'c1', type: 'bad_type', title: 'T', message: 'M' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(expect.arrayContaining([expect.stringContaining('Invalid type')]));
  });

  it('should return 201 with minimal fields', async () => {
    const created = {
      id: 'n1',
      consumer_id: 'c1',
      type: 'general',
      title: 'Hello',
      message: 'World',
      channel: 'portal',
      priority: 'medium',
    };
    mockQuery.mockResolvedValueOnce({ rows: [created] });

    const res = await request(app)
      .post('/v1/internal/notifications/send')
      .send({ consumerId: 'c1', type: 'general', title: 'Hello', message: 'World' });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(created);

    const call = mockQuery.mock.calls[0];
    expect(call[1]).toEqual(['c1', 'general', 'Hello', 'World', 'portal', 'medium', '{}']);
  });

  it('should return 201 with all optional fields', async () => {
    const created = {
      id: 'n2',
      consumer_id: 'c1',
      type: 'maintenance',
      title: 'Maintenance',
      message: 'Scheduled',
      channel: 'email',
      priority: 'high',
      metadata: { apiId: 'a1' },
    };
    mockQuery.mockResolvedValueOnce({ rows: [created] });

    const res = await request(app)
      .post('/v1/internal/notifications/send')
      .send({
        consumerId: 'c1',
        type: 'maintenance',
        title: 'Maintenance',
        message: 'Scheduled',
        channel: 'email',
        priority: 'high',
        metadata: { apiId: 'a1' },
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(created);

    const call = mockQuery.mock.calls[0];
    expect(call[1]).toEqual([
      'c1', 'maintenance', 'Maintenance', 'Scheduled',
      'email', 'high', JSON.stringify({ apiId: 'a1' }),
    ]);
  });

  it('should not require authentication', async () => {
    const created = { id: 'n3', type: 'general' };
    mockQuery.mockResolvedValueOnce({ rows: [created] });

    const res = await request(app)
      .post('/v1/internal/notifications/send')
      .send({ consumerId: 'c1', type: 'general', title: 'T', message: 'M' });

    expect(res.status).toBe(201);
  });

  it('should return 500 when database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/v1/internal/notifications/send')
      .send({ consumerId: 'c1', type: 'general', title: 'T', message: 'M' });

    expect(res.status).toBe(500);
  });
});
