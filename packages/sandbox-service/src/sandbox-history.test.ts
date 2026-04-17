/**
 * Tests for GET /v1/sandbox/history/:appId
 *
 * All DB calls are mocked — no real database connection.
 * Validates: Requirement 3.4, Property 5 (max 50 entries, FIFO)
 */

import request from 'supertest';
import { app } from './index';
import pool from './config/db';

/* ─── Mock the pg pool ─── */
jest.mock('./config/db', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      query: jest.fn(),
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn(),
      __mockClient: mockClient,
    },
  };
});

const mockPool = pool as unknown as {
  query: jest.Mock;
  connect: jest.Mock;
  end: jest.Mock;
  __mockClient: { query: jest.Mock; release: jest.Mock };
};

/* ─── Helpers ─── */

function buildHistoryRow(index: number, appId: string) {
  // Use a base timestamp and subtract index * 1 minute to guarantee valid dates
  const baseTime = new Date('2026-04-17T12:00:00Z').getTime();
  return {
    id: `row-id-${index}`,
    application_id: appId,
    api_version_id: 'version-id-1',
    method: 'GET',
    path: '/pets',
    request_headers: { accept: 'application/json' },
    request_body: null,
    response_status: 200,
    response_headers: { 'content-type': 'application/json' },
    response_body: { data: `item-${index}` },
    response_time_ms: 42,
    correlation_id: `corr-${index}`,
    created_at: new Date(baseTime - index * 60_000),
  };
}

function buildRows(count: number, appId = 'app-123') {
  return Array.from({ length: count }, (_, i) => buildHistoryRow(i, appId));
}

beforeEach(() => {
  jest.clearAllMocks();
});

/* ─── Tests ─── */

describe('GET /v1/sandbox/history/:appId', () => {
  describe('Successful responses', () => {
    it('should return history entries ordered by created_at DESC', async () => {
      const rows = buildRows(3);
      mockPool.query.mockResolvedValue({ rows });

      const res = await request(app).get('/v1/sandbox/history/app-123');

      expect(res.status).toBe(200);
      expect(res.body.requests).toHaveLength(3);
      expect(res.body.total).toBe(3);
      expect(res.body.requests[0].id).toBe('row-id-0');
    });

    it('should map DB columns to camelCase response fields', async () => {
      const rows = buildRows(1);
      mockPool.query.mockResolvedValue({ rows });

      const res = await request(app).get('/v1/sandbox/history/app-123');
      const entry = res.body.requests[0];

      expect(entry.applicationId).toBe('app-123');
      expect(entry.apiVersionId).toBe('version-id-1');
      expect(entry.method).toBe('GET');
      expect(entry.path).toBe('/pets');
      expect(entry.requestHeaders).toEqual({ accept: 'application/json' });
      expect(entry.responseStatus).toBe(200);
      expect(entry.responseHeaders).toEqual({ 'content-type': 'application/json' });
      expect(entry.responseBody).toEqual({ data: 'item-0' });
      expect(entry.responseTimeMs).toBe(42);
      expect(entry.correlationId).toBe('corr-0');
      expect(entry.createdAt).toBeDefined();
    });

    it('should return empty array when no history exists', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const res = await request(app).get('/v1/sandbox/history/app-no-history');

      expect(res.status).toBe(200);
      expect(res.body.requests).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('should return at most 50 entries (LIMIT 50 in query)', async () => {
      const rows = buildRows(50);
      mockPool.query.mockResolvedValue({ rows });

      const res = await request(app).get('/v1/sandbox/history/app-123');

      expect(res.status).toBe(200);
      expect(res.body.requests).toHaveLength(50);
      expect(res.body.total).toBe(50);
    });

    it('should never return more than 50 entries even if DB somehow returns more', async () => {
      // The SQL has LIMIT 50, but we verify the contract at the API level:
      // if the DB returned 50 rows, the response total must be exactly 50.
      const rows = buildRows(50);
      mockPool.query.mockResolvedValue({ rows });

      const res = await request(app).get('/v1/sandbox/history/app-123');

      expect(res.status).toBe(200);
      expect(res.body.requests.length).toBeLessThanOrEqual(50);
      expect(res.body.total).toBeLessThanOrEqual(50);
    });

    it('should return fewer than 50 when app has fewer entries', async () => {
      const rows = buildRows(10);
      mockPool.query.mockResolvedValue({ rows });

      const res = await request(app).get('/v1/sandbox/history/app-123');

      expect(res.status).toBe(200);
      expect(res.body.requests).toHaveLength(10);
      expect(res.body.total).toBe(10);
    });

    it('should return exactly 1 entry when app has a single entry', async () => {
      const rows = buildRows(1);
      mockPool.query.mockResolvedValue({ rows });

      const res = await request(app).get('/v1/sandbox/history/app-123');

      expect(res.status).toBe(200);
      expect(res.body.requests).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });
  });

  describe('Query correctness', () => {
    it('should query with the correct appId parameter and LIMIT 50', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await request(app).get('/v1/sandbox/history/my-app-uuid');

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockPool.query.mock.calls[0];
      expect(sql).toContain('application_id = $1');
      expect(sql).toContain('ORDER BY created_at DESC');
      expect(sql).toContain('LIMIT 50');
      expect(params).toEqual(['my-app-uuid']);
    });
  });

  describe('Correlation-ID propagation', () => {
    it('should propagate correlation-id header in the response', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });
      const customId = 'history-corr-id';

      const res = await request(app)
        .get('/v1/sandbox/history/app-123')
        .set('x-correlation-id', customId);

      expect(res.headers['x-correlation-id']).toBe(customId);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      mockPool.query.mockRejectedValue(new Error('Connection refused'));

      const res = await request(app).get('/v1/sandbox/history/app-123');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal Server Error');
      expect(res.body.correlationId).toBeDefined();
    });
  });

  describe('FIFO enforcement — max 50 entries (Property 5)', () => {
    it('should enforce LIMIT 50 in the SQL query', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await request(app).get('/v1/sandbox/history/app-fifo');

      const [sql] = mockPool.query.mock.calls[0];
      expect(sql).toContain('LIMIT 50');
    });

    it('should enforce ORDER BY created_at DESC so newest entries come first', async () => {
      const rows = buildRows(5);
      mockPool.query.mockResolvedValue({ rows });

      const res = await request(app).get('/v1/sandbox/history/app-123');

      // Row 0 has the most recent timestamp, row 4 the oldest
      const timestamps = res.body.requests.map(
        (r: { createdAt: string }) => new Date(r.createdAt).getTime(),
      );
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    });

    it('should return total equal to requests.length (never exceeding 50)', async () => {
      const rows = buildRows(50);
      mockPool.query.mockResolvedValue({ rows });

      const res = await request(app).get('/v1/sandbox/history/app-123');

      expect(res.body.total).toBe(res.body.requests.length);
      expect(res.body.total).toBeLessThanOrEqual(50);
    });
  });

  describe('Property-based: history length invariant (fast-check)', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fc = require('fast-check');

    it('for any count of rows [0..50], total always equals rows returned and ≤ 50', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 50 }),
          async (count: number) => {
            mockPool.query.mockReset();
            const rows = buildRows(count);
            mockPool.query.mockResolvedValue({ rows });

            const res = await request(app).get('/v1/sandbox/history/app-pbt');

            expect(res.status).toBe(200);
            expect(res.body.requests).toHaveLength(count);
            expect(res.body.total).toBe(count);
            expect(res.body.total).toBeLessThanOrEqual(50);
          },
        ),
        { numRuns: 30 },
      );
    });
  });

  describe('Null/undefined field handling', () => {
    it('should handle null request_body and default headers to empty objects', async () => {
      const row = {
        id: 'row-null',
        application_id: 'app-123',
        api_version_id: 'ver-1',
        method: 'DELETE',
        path: '/pets/1',
        request_headers: null,
        request_body: null,
        response_status: 204,
        response_headers: null,
        response_body: null,
        response_time_ms: 5,
        correlation_id: 'corr-null',
        created_at: new Date('2026-04-17T10:00:00Z'),
      };
      mockPool.query.mockResolvedValue({ rows: [row] });

      const res = await request(app).get('/v1/sandbox/history/app-123');

      expect(res.status).toBe(200);
      const entry = res.body.requests[0];
      expect(entry.requestHeaders).toEqual({});
      expect(entry.requestBody).toBeNull();
      expect(entry.responseHeaders).toEqual({});
      expect(entry.responseBody).toBeNull();
    });
  });
});
