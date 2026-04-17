import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock pg pool before importing routes
const mockQuery = jest.fn();
jest.mock('../config/database.js', () => ({
  __esModule: true,
  default: { query: mockQuery },
}));

import analyticsRoutes from './analytics.routes.js';
import { correlationIdMiddleware } from '../middleware/correlation-id.js';
import { errorHandler } from '../middleware/error-handler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(correlationIdMiddleware);
  app.use(analyticsRoutes);
  app.use(errorHandler);
  return app;
}

function generateToken(payload = { userId: 'u1', email: 'test@test.com', role: 'consumer' }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('GET /v1/analytics/quota/:appId', () => {
  let app: express.Express;

  beforeAll(() => {
    app = buildApp();
  });

  afterEach(() => {
    mockQuery.mockReset();
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/v1/analytics/quota/app-1');
    expect(res.status).toBe(401);
  });

  it('should return 404 when application does not exist', async () => {
    // App check returns empty
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/v1/analytics/quota/non-existent-app')
      .set('Authorization', `Bearer ${generateToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return quota with plan data when subscription_plan join succeeds', async () => {
    // 1. App exists
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'app-1' }] });
    // 2. Plan query succeeds
    mockQuery.mockResolvedValueOnce({ rows: [{ quota_limit: 5000, quota_period: 'monthly' }] });
    // 3. Usage query
    mockQuery.mockResolvedValueOnce({ rows: [{ total_quota_used: 1250 }] });

    const res = await request(app)
      .get('/v1/analytics/quota/app-1')
      .set('Authorization', `Bearer ${generateToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      appId: 'app-1',
      quotaUsed: 1250,
      quotaLimit: 5000,
      quotaUsedPercent: 25,
      quotaPeriod: 'monthly',
    });
  });

  it('should fall back to default quota when plan join fails', async () => {
    // 1. App exists
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'app-1' }] });
    // 2. Plan query fails (table doesn't exist yet)
    mockQuery.mockRejectedValueOnce(new Error('relation "subscription_plan" does not exist'));
    // 3. Usage query
    mockQuery.mockResolvedValueOnce({ rows: [{ total_quota_used: 300 }] });

    const res = await request(app)
      .get('/v1/analytics/quota/app-1')
      .set('Authorization', `Bearer ${generateToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.quotaLimit).toBe(10000);
    expect(res.body.quotaPeriod).toBe('monthly');
    expect(res.body.quotaUsed).toBe(300);
    expect(res.body.quotaUsedPercent).toBe(3);
  });

  it('should use daily period condition when plan is daily', async () => {
    // 1. App exists
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'app-1' }] });
    // 2. Plan query returns daily
    mockQuery.mockResolvedValueOnce({ rows: [{ quota_limit: 1000, quota_period: 'daily' }] });
    // 3. Usage query
    mockQuery.mockResolvedValueOnce({ rows: [{ total_quota_used: 500 }] });

    const res = await request(app)
      .get('/v1/analytics/quota/app-1')
      .set('Authorization', `Bearer ${generateToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.quotaPeriod).toBe('daily');
    expect(res.body.quotaUsedPercent).toBe(50);

    // Verify the usage SQL contains CURRENT_DATE for daily
    const usageCall = mockQuery.mock.calls[2];
    expect(usageCall[0]).toContain('CURRENT_DATE');
  });

  it('should round quotaUsedPercent to 2 decimal places', async () => {
    // 1. App exists
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'app-1' }] });
    // 2. Plan query
    mockQuery.mockResolvedValueOnce({ rows: [{ quota_limit: 3000, quota_period: 'monthly' }] });
    // 3. Usage query — 1000/3000 = 33.333...%
    mockQuery.mockResolvedValueOnce({ rows: [{ total_quota_used: 1000 }] });

    const res = await request(app)
      .get('/v1/analytics/quota/app-1')
      .set('Authorization', `Bearer ${generateToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.quotaUsedPercent).toBe(33.33);
  });

  it('should return 0 percent when no usage exists', async () => {
    // 1. App exists
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'app-1' }] });
    // 2. Plan query
    mockQuery.mockResolvedValueOnce({ rows: [{ quota_limit: 5000, quota_period: 'yearly' }] });
    // 3. Usage query — no usage
    mockQuery.mockResolvedValueOnce({ rows: [{ total_quota_used: 0 }] });

    const res = await request(app)
      .get('/v1/analytics/quota/app-1')
      .set('Authorization', `Bearer ${generateToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.quotaUsed).toBe(0);
    expect(res.body.quotaUsedPercent).toBe(0);
    expect(res.body.quotaPeriod).toBe('yearly');
  });

  it('should return 500 when usage query fails unexpectedly', async () => {
    // 1. App exists
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'app-1' }] });
    // 2. Plan query succeeds
    mockQuery.mockResolvedValueOnce({ rows: [{ quota_limit: 5000, quota_period: 'monthly' }] });
    // 3. Usage query fails
    mockQuery.mockRejectedValueOnce(new Error('connection refused'));

    const res = await request(app)
      .get('/v1/analytics/quota/app-1')
      .set('Authorization', `Bearer ${generateToken()}`);

    expect(res.status).toBe(500);
  });
});
