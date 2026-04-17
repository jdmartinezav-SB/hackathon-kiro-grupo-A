import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { correlationIdMiddleware } from '../middleware/correlation-id';
import { errorHandler } from '../middleware/error-handler';
import analyticsRoutes from './analytics.routes';
import pool from '../config/database';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockQuery = pool.query as jest.Mock;

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

function makeToken(role: string): string {
  return jwt.sign({ userId: 'u1', email: 'a@b.com', role }, JWT_SECRET);
}

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(correlationIdMiddleware);
  app.use(analyticsRoutes);
  app.use(errorHandler);
  return app;
}

describe('GET /v1/analytics/dashboard/:appId', () => {
  const app = buildApp();
  const token = makeToken('consumer');
  const appId = 'aaaa-bbbb-cccc-dddd';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/v1/analytics/dashboard/' + appId);
    expect(res.status).toBe(401);
  });

  it('should return 200 with zeros and empty timeSeries when no data', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_requests: 0, success_count: 0, error_count: 0, weighted_latency_sum: '0' }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/v1/analytics/dashboard/' + appId)
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalRequests: 0,
      successRate: 0,
      errorRate: 0,
      avgLatencyMs: 0,
      timeSeries: [],
    });
  });

  it('should return 200 with correct aggregated metrics', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{
          total_requests: 100,
          success_count: 85,
          error_count: 15,
          weighted_latency_sum: '12000',
        }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            metric_date: '2025-01-15',
            total_requests: 60,
            success_count: 50,
            error_count: 10,
            avg_latency_ms: '110.5',
          },
          {
            metric_date: '2025-01-16',
            total_requests: 40,
            success_count: 35,
            error_count: 5,
            avg_latency_ms: '130.0',
          },
        ],
      });

    const res = await request(app)
      .get('/v1/analytics/dashboard/' + appId)
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    expect(res.body.totalRequests).toBe(100);
    expect(res.body.successRate).toBe(85);
    expect(res.body.errorRate).toBe(15);
    expect(res.body.avgLatencyMs).toBe(120);
    expect(res.body.timeSeries).toHaveLength(2);
    expect(res.body.timeSeries[0].date).toBe('2025-01-15');
    expect(res.body.timeSeries[1].date).toBe('2025-01-16');
  });

  it('should apply from filter', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_requests: 0, success_count: 0, error_count: 0, weighted_latency_sum: '0' }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/v1/analytics/dashboard/' + appId + '?from=2025-01-01')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    const aggCall = mockQuery.mock.calls[0];
    expect(aggCall[0]).toContain('metric_date >= $2');
    expect(aggCall[1]).toEqual([appId, '2025-01-01']);
  });

  it('should apply to filter', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_requests: 0, success_count: 0, error_count: 0, weighted_latency_sum: '0' }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/v1/analytics/dashboard/' + appId + '?to=2025-01-31')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    const aggCall = mockQuery.mock.calls[0];
    expect(aggCall[0]).toContain('metric_date <= $2');
    expect(aggCall[1]).toEqual([appId, '2025-01-31']);
  });

  it('should apply apiId filter', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_requests: 0, success_count: 0, error_count: 0, weighted_latency_sum: '0' }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const apiId = 'api-version-uuid';
    const res = await request(app)
      .get('/v1/analytics/dashboard/' + appId + '?apiId=' + apiId)
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    const aggCall = mockQuery.mock.calls[0];
    expect(aggCall[0]).toContain('api_version_id = $2');
    expect(aggCall[1]).toEqual([appId, apiId]);
  });

  it('should apply all filters together', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_requests: 0, success_count: 0, error_count: 0, weighted_latency_sum: '0' }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/v1/analytics/dashboard/' + appId + '?from=2025-01-01&to=2025-01-31&apiId=api-1')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    const aggCall = mockQuery.mock.calls[0];
    expect(aggCall[0]).toContain('application_id = $1');
    expect(aggCall[0]).toContain('metric_date >= $2');
    expect(aggCall[0]).toContain('metric_date <= $3');
    expect(aggCall[0]).toContain('api_version_id = $4');
    expect(aggCall[1]).toEqual([appId, '2025-01-01', '2025-01-31', 'api-1']);
  });

  it('should return 500 when database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app)
      .get('/v1/analytics/dashboard/' + appId)
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(500);
  });

  it('should compute successRate and errorRate with 2 decimal precision', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{
          total_requests: 3,
          success_count: 2,
          error_count: 1,
          weighted_latency_sum: '300',
        }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/v1/analytics/dashboard/' + appId)
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    expect(res.body.successRate).toBe(66.67);
    expect(res.body.errorRate).toBe(33.33);
    expect(res.body.avgLatencyMs).toBe(100);
  });
});
