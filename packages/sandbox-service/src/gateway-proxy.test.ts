/**
 * Tests for POST /v1/gateway/proxy/:apiId/:version/*
 *
 * All DB calls are mocked — no real database connection.
 * Validates: Requirements 3, 11 (Sandbox + Capa de Abstracción de Legados)
 * Properties: 14 (round-trip REST↔SOAP), 15 (SOAP error mapping)
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

/* ─── Sample OpenAPI specs ─── */

const restSpec = {
  openapi: '3.0.0',
  info: { title: 'REST API', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
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

const soapSpec = {
  ...restSpec,
  'x-legacy-soap': true,
  info: { title: 'Legacy SOAP API', version: '1.0.0' },
};

/* ─── Helpers ─── */

function setupDbMock(spec: object, category?: string): void {
  mockPool.query.mockResolvedValue({
    rows: [
      {
        api_version_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        openapi_spec: JSON.stringify(spec),
        format: 'json',
        category: category ?? 'general',
      },
    ],
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

/* ─── Tests ─── */

describe('Gateway Proxy — POST /v1/gateway/proxy/:apiId/:version/*', () => {
  describe('API version lookup', () => {
    it('should return 404 when API version is not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .post('/v1/gateway/proxy/nonexistent/v1/pets')
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('GW_001');
      expect(res.body.error.correlationId).toBeDefined();
      expect(res.body.responseTimeMs).toBeDefined();
    });

    it('should return 422 when stored spec is invalid JSON', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            api_version_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            openapi_spec: 'not-valid-json{{{',
            format: 'json',
            category: 'general',
          },
        ],
      });

      const res = await request(app)
        .post('/v1/gateway/proxy/test-api/v1/pets')
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('GW_002');
    });
  });

  describe('REST API (non-legacy)', () => {
    it('should return mock response with REST protocol for a standard API', async () => {
      setupDbMock(restSpec);

      const res = await request(app)
        .get('/v1/gateway/proxy/test-api/v1/pets');

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
      expect(res.body.headers['content-type']).toBe('application/json');
      expect(res.body.headers['x-gateway-protocol']).toBe('REST');
      expect(res.body.body).toBeDefined();
      expect(res.body.responseTimeMs).toBeGreaterThanOrEqual(0);
      expect(res.body.correlationId).toBeDefined();
      expect(res.body.gateway.translated).toBe(false);
      expect(res.body.gateway.protocol).toBe('REST');
    });

    it('should propagate correlation ID from request header', async () => {
      setupDbMock(restSpec);
      const customCorrelation = 'gw-custom-correlation-id';

      const res = await request(app)
        .get('/v1/gateway/proxy/test-api/v1/pets')
        .set('x-correlation-id', customCorrelation);

      expect(res.body.correlationId).toBe(customCorrelation);
    });

    it('should return 400 when request validation fails', async () => {
      setupDbMock(restSpec);

      const res = await request(app)
        .post('/v1/gateway/proxy/test-api/v1/pets')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('GW_003');
      expect(res.body.error.details).toBeDefined();
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe('Legacy SOAP API (x-legacy-soap)', () => {
    it('should translate REST→SOAP→REST and return translated response', async () => {
      setupDbMock(soapSpec);

      const res = await request(app)
        .get('/v1/gateway/proxy/test-api/v1/pets');

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
      expect(res.body.headers['x-gateway-protocol']).toBe('SOAP');
      expect(res.body.body).toBeDefined();
      expect(res.body.gateway.translated).toBe(true);
      expect(res.body.gateway.protocol).toBe('SOAP');
      expect(res.body.gateway.operation).toBeDefined();
      expect(res.body.gateway.operation).toBe('getPets');
    });

    it('should detect legacy API by category containing "soap"', async () => {
      setupDbMock(restSpec, 'legacy-soap-services');

      const res = await request(app)
        .get('/v1/gateway/proxy/test-api/v1/pets');

      expect(res.status).toBe(200);
      expect(res.body.gateway.translated).toBe(true);
      expect(res.body.gateway.protocol).toBe('SOAP');
    });

    it('should derive correct operation name for POST', async () => {
      setupDbMock(soapSpec);

      const res = await request(app)
        .post('/v1/gateway/proxy/test-api/v1/pets')
        .send({ name: 'Fido', tag: 'dog' });

      expect(res.status).toBe(200);
      expect(res.body.gateway.operation).toBe('createPets');
    });

    it('should log sync event for SOAP translations', async () => {
      setupDbMock(soapSpec);

      await request(app)
        .get('/v1/gateway/proxy/test-api/v1/pets');

      // The second pool.query call should be the sync_log INSERT
      const calls = mockPool.query.mock.calls;
      const syncLogCall = calls.find(
        (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('sync_log'),
      );
      expect(syncLogCall).toBeDefined();
      // Verify the status is a valid enum value
      if (syncLogCall) {
        expect(syncLogCall[0]).toContain("'confirmed'");
      }
    });
  });

  describe('Path not found in spec', () => {
    it('should return 400 validation error for unknown path', async () => {
      setupDbMock(restSpec);

      const res = await request(app)
        .get('/v1/gateway/proxy/test-api/v1/nonexistent');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('GW_003');
    });
  });

  describe('HTTP method support', () => {
    it('should handle GET requests', async () => {
      setupDbMock(restSpec);

      const res = await request(app)
        .get('/v1/gateway/proxy/test-api/v1/pets');

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
    });

    it('should handle POST requests with body', async () => {
      setupDbMock(restSpec);

      const res = await request(app)
        .post('/v1/gateway/proxy/test-api/v1/pets')
        .send({ name: 'Buddy', tag: 'dog' });

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
    });
  });
});
