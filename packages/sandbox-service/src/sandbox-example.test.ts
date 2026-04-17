/**
 * Tests for GET /v1/sandbox/apis/:apiId/example
 *
 * All DB calls are mocked — no real database connection.
 * Validates: Requirement 3.3
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

function setupDbMock(specOverride?: object, versionTag = 'v1'): void {
  const spec = specOverride ?? sampleSpec;
  mockPool.query.mockResolvedValue({
    rows: [
      {
        openapi_spec: JSON.stringify(spec),
        format: 'json',
        version_tag: versionTag,
      },
    ],
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

/* ─── Tests ─── */

describe('GET /v1/sandbox/apis/:apiId/example', () => {
  describe('Successful example generation', () => {
    it('should return 200 with example for valid apiId', async () => {
      setupDbMock();

      const res = await request(app).get('/v1/sandbox/apis/test-api/example');

      expect(res.status).toBe(200);
      expect(res.body.apiId).toBe('test-api');
      expect(res.body.version).toBe('v1');
      expect(res.body.method).toBe('GET');
      expect(res.body.path).toBe('/pets');
      expect(res.body.headers).toBeDefined();
      expect(res.body.headers['Content-Type']).toBe('application/json');
      expect(res.body.queryParams).toBeDefined();
      expect(res.body.queryParams.limit).toBeDefined();
      expect(res.body.mockResponse).toBeDefined();
      expect(res.body.mockResponse.statusCode).toBe(200);
      expect(res.body.mockResponse.body).toBeDefined();
    });

    it('should return null body for GET endpoints (no requestBody)', async () => {
      setupDbMock();

      const res = await request(app).get('/v1/sandbox/apis/test-api/example');

      expect(res.status).toBe(200);
      expect(res.body.body).toBeNull();
    });

    it('should return sample body for POST endpoints', async () => {
      const postFirstSpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/items': {
            post: {
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        count: { type: 'integer' },
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
                        properties: { id: { type: 'integer' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
      setupDbMock(postFirstSpec);

      const res = await request(app).get('/v1/sandbox/apis/test-api/example');

      expect(res.status).toBe(200);
      expect(res.body.method).toBe('POST');
      expect(res.body.body).toBeDefined();
      expect(res.body.body).not.toBeNull();
      expect(res.body.body.name).toBe('lorem ipsum');
      expect(typeof res.body.body.count).toBe('number');
    });

    it('should include correlationId from request header', async () => {
      setupDbMock();
      const customCorrelation = 'my-example-correlation';

      const res = await request(app)
        .get('/v1/sandbox/apis/test-api/example')
        .set('x-correlation-id', customCorrelation);

      expect(res.headers['x-correlation-id']).toBe(customCorrelation);
    });
  });

  describe('API version not found', () => {
    it('should return 404 when apiId has no active version', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const res = await request(app).get('/v1/sandbox/apis/nonexistent/example');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('SANDBOX_EX_001');
      expect(res.body.error.message).toContain('nonexistent');
      expect(res.body.error.correlationId).toBeDefined();
    });
  });

  describe('Invalid spec', () => {
    it('should return 422 when stored spec is invalid JSON', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            openapi_spec: 'not-valid-json{{{',
            format: 'json',
            version_tag: 'v1',
          },
        ],
      });

      const res = await request(app).get('/v1/sandbox/apis/test-api/example');

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('SANDBOX_EX_002');
    });
  });

  describe('Spec with no paths', () => {
    it('should return 422 when spec has empty paths', async () => {
      const emptyPathsSpec = {
        openapi: '3.0.0',
        info: { title: 'Empty', version: '1.0.0' },
        paths: {},
      };
      setupDbMock(emptyPathsSpec);

      const res = await request(app).get('/v1/sandbox/apis/test-api/example');

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('SANDBOX_EX_003');
    });

    it('should return 422 when spec has no paths key', async () => {
      const noPathsSpec = {
        openapi: '3.0.0',
        info: { title: 'No Paths', version: '1.0.0' },
      };
      setupDbMock(noPathsSpec);

      const res = await request(app).get('/v1/sandbox/apis/test-api/example');

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('SANDBOX_EX_003');
    });
  });

  describe('DB query correctness', () => {
    it('should query for latest active version ordered by published_at', async () => {
      setupDbMock();

      await request(app).get('/v1/sandbox/apis/my-api-id/example');

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockPool.query.mock.calls[0];
      expect(sql).toContain('api_version');
      expect(sql).toContain("status = 'active'");
      expect(sql).toContain('ORDER BY av.published_at DESC');
      expect(params).toEqual(['my-api-id']);
    });
  });
});
