import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { correlationIdMiddleware } from '../middleware/correlation-id.js';
import { errorHandler } from '../middleware/error-handler.js';
import auditRoutes from './audit.routes.js';
import pool from '../config/database.js';

jest.mock('../config/database.js', () => ({
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
  app.use(auditRoutes);
  app.use(errorHandler);
  return app;
}

describe('GET /v1/admin/audit/reports', () => {
  const app = buildApp();
  const adminToken = makeToken('admin');
  const userToken = makeToken('consumer');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/v1/admin/audit/reports');
    expect(res.status).toBe(401);
  });

  it('should return 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/v1/admin/audit/reports')
      .set('Authorization', 'Bearer ' + userToken);
    expect(res.status).toBe(403);
  });

  it('should return 200 with default pagination and empty records', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/v1/admin/audit/reports')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      records: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('should apply consumerId filter', async () => {
    const cid = 'aaaa-bbbb-cccc';
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: '1', consumer_id: cid }] });

    const res = await request(app)
      .get('/v1/admin/audit/reports?consumerId=' + cid)
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.records).toHaveLength(1);

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[0]).toContain('consumer_id = $1');
    expect(countCall[1]).toEqual([cid]);
  });

  it('should apply multiple filters', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 5 }] })
      .mockResolvedValueOnce({ rows: Array(5).fill({ id: 'x' }) });

    const res = await request(app)
      .get('/v1/admin/audit/reports?consumerId=c1&apiId=a1&statusCode=200')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[0]).toContain('consumer_id = $1');
    expect(countCall[0]).toContain('api_version_id = $2');
    expect(countCall[0]).toContain('status_code = $3');
    expect(countCall[1]).toEqual(['c1', 'a1', 200]);
  });

  it('should respect page and pageSize params', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 50 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'r1' }] });

    const res = await request(app)
      .get('/v1/admin/audit/reports?page=3&pageSize=10')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(3);
    expect(res.body.pageSize).toBe(10);

    const selectCall = mockQuery.mock.calls[1];
    // LIMIT=10, OFFSET=20 (page 3, size 10)
    expect(selectCall[1]).toEqual([10, 20]);
  });

  it('should cap pageSize at 100', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/v1/admin/audit/reports?pageSize=500')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.status).toBe(200);
    expect(res.body.pageSize).toBe(100);
  });

  it('should apply from/to date filters', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: '1' }, { id: '2' }] });

    const res = await request(app)
      .get('/v1/admin/audit/reports?from=2025-01-01T00:00:00Z&to=2025-01-31T23:59:59Z')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[0]).toContain('created_at >= $1');
    expect(countCall[0]).toContain('created_at <= $2');
    expect(countCall[1]).toEqual(['2025-01-01T00:00:00Z', '2025-01-31T23:59:59Z']);
  });

  it('should return 500 when database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app)
      .get('/v1/admin/audit/reports')
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.status).toBe(500);
  });
});


const EXPORTS_DIR = path.resolve('exports');

describe('POST /v1/admin/audit/export', () => {
  const app = buildApp();
  const adminToken = makeToken('admin');
  const userToken = makeToken('consumer');

  afterEach(() => {
    jest.clearAllMocks();
    // Clean up export files created during tests
    if (fs.existsSync(EXPORTS_DIR)) {
      const files = fs.readdirSync(EXPORTS_DIR);
      for (const f of files) {
        if (f.startsWith('audit-export-')) {
          fs.unlinkSync(path.join(EXPORTS_DIR, f));
        }
      }
    }
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .post('/v1/admin/audit/export')
      .send({ format: 'json' });
    expect(res.status).toBe(401);
  });

  it('should return 403 for non-admin user', async () => {
    const res = await request(app)
      .post('/v1/admin/audit/export')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ format: 'json' });
    expect(res.status).toBe(403);
  });

  it('should return 400 when format is missing', async () => {
    const res = await request(app)
      .post('/v1/admin/audit/export')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when format is invalid', async () => {
    const res = await request(app)
      .post('/v1/admin/audit/export')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ format: 'xml' });
    expect(res.status).toBe(400);
  });

  it('should return 200 with JSON export for small dataset', async () => {
    const mockRecords = [
      { id: '1', consumer_id: 'c1', endpoint: '/api/test', status_code: 200 },
      { id: '2', consumer_id: 'c2', endpoint: '/api/other', status_code: 404 },
    ];
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({ rows: mockRecords });

    const res = await request(app)
      .post('/v1/admin/audit/export')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ format: 'json' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.downloadUrl).toMatch(/^\/v1\/admin\/audit\/exports\/audit-export-\d+\.json$/);
  });

  it('should return 200 with CSV export for small dataset', async () => {
    const mockRecords = [
      { id: '1', consumer_id: 'c1', status_code: 200 },
    ];
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: mockRecords });

    const res = await request(app)
      .post('/v1/admin/audit/export')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ format: 'csv' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.downloadUrl).toMatch(/\.csv$/);
  });

  it('should return 202 when count exceeds 100,000', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: 150000 }] });

    const res = await request(app)
      .post('/v1/admin/audit/export')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ format: 'json' });

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('processing');
    expect(res.body.jobId).toBeDefined();
  });

  it('should apply filters to the export query', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/v1/admin/audit/export')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({
        format: 'json',
        filters: { consumerId: 'c1', statusCode: 200 },
      });

    expect(res.status).toBe(200);
    const countCall = mockQuery.mock.calls[0];
    expect(countCall[0]).toContain('consumer_id = $1');
    expect(countCall[0]).toContain('status_code = $2');
    expect(countCall[1]).toEqual(['c1', 200]);
  });

  it('should return 500 when database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/v1/admin/audit/export')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ format: 'json' });

    expect(res.status).toBe(500);
  });
});

describe('GET /v1/admin/audit/exports/:filename', () => {
  const app = buildApp();
  const adminToken = makeToken('admin');

  afterEach(() => {
    if (fs.existsSync(EXPORTS_DIR)) {
      const files = fs.readdirSync(EXPORTS_DIR);
      for (const f of files) {
        if (f.startsWith('test-')) {
          fs.unlinkSync(path.join(EXPORTS_DIR, f));
        }
      }
    }
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/v1/admin/audit/exports/test.json');
    expect(res.status).toBe(401);
  });

  it('should return 404 for non-existent file', async () => {
    const res = await request(app)
      .get('/v1/admin/audit/exports/nonexistent.json')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(404);
  });

  it('should serve an existing JSON export file', async () => {
    const testFile = 'test-serve.json';
    fs.writeFileSync(path.join(EXPORTS_DIR, testFile), '[]', 'utf-8');

    const res = await request(app)
      .get('/v1/admin/audit/exports/' + testFile)
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.headers['content-disposition']).toContain(testFile);
  });

  it('should serve an existing CSV export file', async () => {
    const testFile = 'test-serve.csv';
    fs.writeFileSync(path.join(EXPORTS_DIR, testFile), 'id,name\n1,test', 'utf-8');

    const res = await request(app)
      .get('/v1/admin/audit/exports/' + testFile)
      .set('Authorization', 'Bearer ' + adminToken);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });
});
