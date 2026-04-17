/**
 * Tests for POST /v1/sandbox/execute
 *
 * All DB calls are mocked — no real database connection.
 * Validates: Requirements 3.1, 3.2, 3.5, 3.7
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

/* ─── Sample OpenAPI spec ─── */
const sampleSpec = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        parameters: [
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  tag: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

/* ─── Helpers ─── */

function setupDbMock(specOverride?: object): void {
  const spec = specOverride ?? sampleSpec;
  mockPool.query.mockResolvedValue({
    rows: [
      {
        api_version_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        openapi_spec: JSON.stringify(spec),
        format: 'json',
      },
    ],
  });

  const client = mockPool.__mockClient;
  client.query.mockResolvedValue({ rows: [] });
}

beforeEach(() => {
  jest.clearAllMocks();
});

/* ─── Tests ─── */

describe('POST /v1/sandbox/execute', () => {
  describe('Input validation', () => {
    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SANDBOX_001');
      expect(res.body.error.message).toContain('apiId');
      expect(res.body.error.message).toContain('version');
      expect(res.body.error.message).toContain('method');
      expect(res.body.error.message).toContain('path');
    });

    it('should return 400 when only some fields are missing', async () => {
      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({ apiId: 'test-api' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('version');
      expect(res.body.error.message).not.toContain('apiId');
    });
  });

  describe('API version lookup', () => {
    it('should return 404 when API version is not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'nonexistent',
          version: 'v1',
          method: 'GET',
          path: '/pets',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('SANDBOX_002');
      expect(res.body.responseTimeMs).toBeDefined();
    });
  });

  describe('Spec parsing', () => {
    it('should return 422 when stored spec is invalid JSON', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            api_version_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            openapi_spec: 'not-valid-json{{{',
            format: 'json',
          },
        ],
      });

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'test-api',
          version: 'v1',
          method: 'GET',
          path: '/pets',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('SANDBOX_003');
    });
  });

  describe('Request validation against spec', () => {
    it('should return validationErrors when request body is invalid', async () => {
      setupDbMock();

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'test-api',
          version: 'v1',
          method: 'POST',
          path: '/pets',
          body: {},
        });

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.validationErrors).toBeDefined();
      expect(res.body.validationErrors.length).toBeGreaterThan(0);
      expect(res.body.correlationId).toBeDefined();
      expect(res.body.responseTimeMs).toBeDefined();
    });
  });

  describe('Successful mock execution', () => {
    it('should return mock response with correct structure for GET', async () => {
      setupDbMock();

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'test-api',
          version: 'v1',
          method: 'GET',
          path: '/pets',
          appId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        });

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
      expect(res.body.headers).toBeDefined();
      expect(res.body.headers['content-type']).toBe('application/json');
      expect(res.body.body).toBeDefined();
      expect(res.body.responseTimeMs).toBeGreaterThanOrEqual(0);
      expect(res.body.correlationId).toBeDefined();
      expect(res.body.validationErrors).toBeUndefined();
    });

    it('should return mock response for POST with valid body', async () => {
      setupDbMock();

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'test-api',
          version: 'v1',
          method: 'POST',
          path: '/pets',
          body: { name: 'Fido', tag: 'dog' },
          appId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        });

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
      expect(res.body.body).toBeDefined();
    });

    it('should include correlationId from request header', async () => {
      setupDbMock();
      const customCorrelation = 'my-custom-correlation-id';

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .set('x-correlation-id', customCorrelation)
        .send({
          apiId: 'test-api',
          version: 'v1',
          method: 'GET',
          path: '/pets',
        });

      expect(res.body.correlationId).toBe(customCorrelation);
    });
  });

  describe('History recording', () => {
    it('should call DB to insert history and enforce FIFO limit', async () => {
      setupDbMock();

      await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'test-api',
          version: 'v1',
          method: 'GET',
          path: '/pets',
          appId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        });

      const client = mockPool.__mockClient;
      // BEGIN, INSERT, DELETE (FIFO), COMMIT
      expect(client.query).toHaveBeenCalledTimes(4);

      const insertCall = client.query.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO sandbox_history');

      const deleteCall = client.query.mock.calls[2];
      expect(deleteCall[0]).toContain('DELETE FROM sandbox_history');
      expect(deleteCall[0]).toContain('OFFSET 50');
    });

    it('should not fail the response if history recording fails', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            api_version_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            openapi_spec: JSON.stringify(sampleSpec),
            format: 'json',
          },
        ],
      });

      const client = mockPool.__mockClient;
      client.query.mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'test-api',
          version: 'v1',
          method: 'GET',
          path: '/pets',
          appId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        });

      // Response should still succeed
      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
    });
  });

  describe('Path/method not found in spec', () => {
    it('should return mock 404 when path does not exist in spec', async () => {
      setupDbMock();

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'test-api',
          version: 'v1',
          method: 'GET',
          path: '/nonexistent',
        });

      // validateRequest returns errors for unknown path
      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.validationErrors).toBeDefined();
    });
  });
});
