/**
 * Frontend Integration Verification
 *
 * Verifies that the sandbox-service endpoints are consumable by the
 * React frontend (Dev 5) running on http://localhost:5173.
 *
 * Checks:
 * - CORS headers allow the frontend origin
 * - Preflight (OPTIONS) requests succeed
 * - Response contracts match what the frontend expects
 * - Full workflow: get example → execute sandbox → view history
 * - Correlation-ID propagation through the frontend flow
 *
 * All DB calls are mocked — no real database connection.
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

/* ─── Sample OpenAPI spec (same structure Dev 2 stores) ─── */
const sampleSpec = {
  openapi: '3.0.0',
  info: { title: 'Cotización Autos API', version: '1.0.0' },
  paths: {
    '/cotizaciones': {
      get: {
        summary: 'Listar cotizaciones',
        parameters: [
          { name: 'placa', in: 'query', required: false, schema: { type: 'string' } },
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
                      id: { type: 'string' },
                      placa: { type: 'string' },
                      valor: { type: 'number' },
                    },
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

const FRONTEND_ORIGIN = 'http://localhost:5173';
const APP_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const API_ID = 'def-uuid-autos';

/* ─── Helpers ─── */

function setupSpecQuery(): void {
  mockPool.query.mockResolvedValue({
    rows: [
      {
        api_version_id: 'av-uuid-1111',
        openapi_spec: JSON.stringify(sampleSpec),
        format: 'json',
        version_tag: 'v1',
        category: 'autos',
      },
    ],
  });
}

function setupHistoryQuery(entries: unknown[] = []): void {
  mockPool.query.mockResolvedValue({ rows: entries });
}

function setupClientForHistory(): void {
  const client = mockPool.__mockClient;
  client.query.mockResolvedValue({ rows: [] });
}

beforeEach(() => {
  jest.clearAllMocks();
});

/* ═══════════════════════════════════════════════════════════════════
   CORS — Frontend origin allowed
   ═══════════════════════════════════════════════════════════════════ */

describe('CORS: Frontend (Dev 5) origin allowed', () => {
  it('should include Access-Control-Allow-Origin for frontend origin on GET', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', FRONTEND_ORIGIN);

    expect(res.status).toBe(200);
    const allowOrigin = res.headers['access-control-allow-origin'];
    expect(allowOrigin).toBeDefined();
    // cors() with no options allows all origins via '*' or echoes the origin
    expect([FRONTEND_ORIGIN, '*']).toContain(allowOrigin);
  });

  it('should handle OPTIONS preflight for POST /v1/sandbox/execute', async () => {
    const res = await request(app)
      .options('/v1/sandbox/execute')
      .set('Origin', FRONTEND_ORIGIN)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, x-correlation-id');

    expect(res.status).toBeLessThan(400);
    expect(res.headers['access-control-allow-methods']).toBeDefined();
  });

  it('should handle OPTIONS preflight for GET /v1/sandbox/history/:appId', async () => {
    const res = await request(app)
      .options(`/v1/sandbox/history/${APP_ID}`)
      .set('Origin', FRONTEND_ORIGIN)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

    expect(res.status).toBeLessThan(400);
  });

  it('should handle OPTIONS preflight for GET /v1/sandbox/apis/:apiId/example', async () => {
    const res = await request(app)
      .options(`/v1/sandbox/apis/${API_ID}/example`)
      .set('Origin', FRONTEND_ORIGIN)
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBeLessThan(400);
  });

  it('should handle OPTIONS preflight for POST /v1/gateway/proxy', async () => {
    const res = await request(app)
      .options(`/v1/gateway/proxy/${API_ID}/v1/cotizaciones`)
      .set('Origin', FRONTEND_ORIGIN)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type');

    expect(res.status).toBeLessThan(400);
  });
});


/* ═══════════════════════════════════════════════════════════════════
   Response Contracts — Frontend expects specific shapes
   ═══════════════════════════════════════════════════════════════════ */

describe('Response contracts: Frontend expected shapes', () => {
  describe('POST /v1/sandbox/execute — SandboxExecuteResponse', () => {
    it('should return all fields the frontend Sandbox page renders', async () => {
      setupSpecQuery();
      setupClientForHistory();

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .set('Origin', FRONTEND_ORIGIN)
        .set('Content-Type', 'application/json')
        .send({
          apiId: API_ID,
          version: 'v1',
          method: 'GET',
          path: '/cotizaciones',
          appId: APP_ID,
        });

      expect(res.status).toBe(200);

      // Frontend renders: statusCode badge, headers panel, body panel, responseTimeMs, correlationId
      const body = res.body;
      expect(body).toHaveProperty('statusCode');
      expect(body).toHaveProperty('headers');
      expect(body).toHaveProperty('body');
      expect(body).toHaveProperty('responseTimeMs');
      expect(body).toHaveProperty('correlationId');

      expect(typeof body.statusCode).toBe('number');
      expect(typeof body.headers).toBe('object');
      expect(typeof body.responseTimeMs).toBe('number');
      expect(typeof body.correlationId).toBe('string');
    });

    it('should return validation errors in the shape the frontend displays', async () => {
      setupSpecQuery();
      setupClientForHistory();

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .set('Origin', FRONTEND_ORIGIN)
        .set('Content-Type', 'application/json')
        .send({
          apiId: API_ID,
          version: 'v1',
          method: 'GET',
          path: '/nonexistent-path',
        });

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.validationErrors).toBeDefined();
      expect(Array.isArray(res.body.validationErrors)).toBe(true);

      // Each validation error should have field + message for frontend rendering
      if (res.body.validationErrors.length > 0) {
        const firstError = res.body.validationErrors[0];
        expect(firstError).toHaveProperty('field');
        expect(firstError).toHaveProperty('message');
      }
    });

    it('should return error shape with code and message on 400', async () => {
      const res = await request(app)
        .post('/v1/sandbox/execute')
        .set('Origin', FRONTEND_ORIGIN)
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBeDefined();
      expect(res.body.error.message).toBeDefined();
      expect(res.body.error.correlationId).toBeDefined();
    });
  });

  describe('GET /v1/sandbox/history/:appId — SandboxHistoryResponse', () => {
    it('should return requests array and total count', async () => {
      const historyRows = [
        {
          id: 'hist-1',
          application_id: APP_ID,
          api_version_id: 'av-1',
          method: 'GET',
          path: '/cotizaciones',
          request_headers: { 'content-type': 'application/json' },
          request_body: null,
          response_status: 200,
          response_headers: { 'content-type': 'application/json' },
          response_body: { data: [] },
          response_time_ms: 42,
          correlation_id: 'corr-1',
          created_at: new Date('2026-04-17T10:00:00Z'),
        },
      ];
      setupHistoryQuery(historyRows);

      const res = await request(app)
        .get(`/v1/sandbox/history/${APP_ID}`)
        .set('Origin', FRONTEND_ORIGIN);

      expect(res.status).toBe(200);

      // Frontend sidebar renders: requests list with total
      expect(res.body).toHaveProperty('requests');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.requests)).toBe(true);
      expect(typeof res.body.total).toBe('number');

      // Each entry has the fields the frontend history panel shows
      if (res.body.requests.length > 0) {
        const entry = res.body.requests[0];
        expect(entry).toHaveProperty('method');
        expect(entry).toHaveProperty('path');
        expect(entry).toHaveProperty('responseStatus');
        expect(entry).toHaveProperty('responseTimeMs');
        expect(entry).toHaveProperty('correlationId');
        expect(entry).toHaveProperty('createdAt');
      }
    });

    it('should return empty array when no history exists', async () => {
      setupHistoryQuery([]);

      const res = await request(app)
        .get(`/v1/sandbox/history/${APP_ID}`)
        .set('Origin', FRONTEND_ORIGIN);

      expect(res.status).toBe(200);
      expect(res.body.requests).toEqual([]);
      expect(res.body.total).toBe(0);
    });
  });

  describe('GET /v1/sandbox/apis/:apiId/example — ExampleResponse', () => {
    it('should return pre-loaded example the frontend uses to populate the sandbox form', async () => {
      setupSpecQuery();

      const res = await request(app)
        .get(`/v1/sandbox/apis/${API_ID}/example`)
        .set('Origin', FRONTEND_ORIGIN);

      expect(res.status).toBe(200);

      // Frontend Sandbox page pre-fills: method selector, path field, headers, body editor
      const body = res.body;
      expect(body).toHaveProperty('apiId');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('method');
      expect(body).toHaveProperty('path');
      expect(body).toHaveProperty('headers');
      expect(body).toHaveProperty('queryParams');
      expect(body).toHaveProperty('mockResponse');

      expect(typeof body.method).toBe('string');
      expect(typeof body.path).toBe('string');
      expect(typeof body.headers).toBe('object');
      expect(typeof body.mockResponse).toBe('object');
      expect(body.mockResponse).toHaveProperty('statusCode');
      expect(body.mockResponse).toHaveProperty('body');
    });
  });

  describe('POST /v1/gateway/proxy — GatewayProxyResponse', () => {
    it('should return gateway metadata the frontend can display', async () => {
      setupSpecQuery();

      const res = await request(app)
        .get(`/v1/gateway/proxy/${API_ID}/v1/cotizaciones`)
        .set('Origin', FRONTEND_ORIGIN);

      expect(res.status).toBe(200);

      const body = res.body;
      expect(body).toHaveProperty('statusCode');
      expect(body).toHaveProperty('headers');
      expect(body).toHaveProperty('body');
      expect(body).toHaveProperty('responseTimeMs');
      expect(body).toHaveProperty('correlationId');
      expect(body).toHaveProperty('gateway');
      expect(body.gateway).toHaveProperty('translated');
      expect(body.gateway).toHaveProperty('protocol');
    });

    it('should return structured error when validation fails', async () => {
      setupSpecQuery();

      const res = await request(app)
        .post(`/v1/gateway/proxy/${API_ID}/v1/cotizaciones`)
        .set('Origin', FRONTEND_ORIGIN)
        .set('Content-Type', 'application/json')
        .send({});

      // Frontend can handle both 200 (success) and 400 (validation error)
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('GW_003');
      expect(res.body.error.correlationId).toBeDefined();
      expect(res.body.responseTimeMs).toBeDefined();
    });
  });
});


/* ═══════════════════════════════════════════════════════════════════
   Full Frontend Workflow — Example → Execute → History
   ═══════════════════════════════════════════════════════════════════ */

describe('Full frontend workflow: example → execute → history', () => {
  it('should support the complete sandbox page lifecycle', async () => {
    // Step 1: Frontend loads the Sandbox page and fetches an example
    setupSpecQuery();

    const exampleRes = await request(app)
      .get(`/v1/sandbox/apis/${API_ID}/example`)
      .set('Origin', FRONTEND_ORIGIN);

    expect(exampleRes.status).toBe(200);
    const example = exampleRes.body;
    expect(example.method).toBeDefined();
    expect(example.path).toBeDefined();

    // Step 2: Frontend uses the example to execute a sandbox request
    jest.clearAllMocks();
    setupSpecQuery();
    setupClientForHistory();

    const executeRes = await request(app)
      .post('/v1/sandbox/execute')
      .set('Origin', FRONTEND_ORIGIN)
      .set('Content-Type', 'application/json')
      .send({
        apiId: example.apiId,
        version: example.version,
        method: example.method,
        path: example.path,
        headers: example.headers,
        queryParams: example.queryParams,
        body: example.body,
        appId: APP_ID,
      });

    expect(executeRes.status).toBe(200);
    expect(executeRes.body.statusCode).toBeDefined();
    expect(executeRes.body.body).toBeDefined();
    expect(executeRes.body.responseTimeMs).toBeGreaterThanOrEqual(0);

    // Step 3: Frontend refreshes the history sidebar
    jest.clearAllMocks();
    setupHistoryQuery([
      {
        id: 'hist-new',
        application_id: APP_ID,
        api_version_id: 'av-uuid-1111',
        method: example.method,
        path: example.path,
        request_headers: example.headers,
        request_body: example.body,
        response_status: 200,
        response_headers: { 'content-type': 'application/json' },
        response_body: { data: [] },
        response_time_ms: 15,
        correlation_id: 'corr-workflow',
        created_at: new Date(),
      },
    ]);

    const historyRes = await request(app)
      .get(`/v1/sandbox/history/${APP_ID}`)
      .set('Origin', FRONTEND_ORIGIN);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.requests.length).toBeGreaterThan(0);
    expect(historyRes.body.total).toBeGreaterThan(0);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   Correlation-ID — Frontend propagation
   ═══════════════════════════════════════════════════════════════════ */

describe('Correlation-ID: Frontend sends and receives', () => {
  it('should echo back x-correlation-id sent by the frontend', async () => {
    const frontendCorrelationId = 'fe-corr-12345-abcde';

    const res = await request(app)
      .post('/v1/sandbox/execute')
      .set('Origin', FRONTEND_ORIGIN)
      .set('x-correlation-id', frontendCorrelationId)
      .set('Content-Type', 'application/json')
      .send({});

    // Even on 400, the correlation-id should be in the response header
    expect(res.headers['x-correlation-id']).toBe(frontendCorrelationId);
    // And in the error body
    expect(res.body.error.correlationId).toBe(frontendCorrelationId);
  });

  it('should generate a correlation-id when frontend does not send one', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', FRONTEND_ORIGIN);

    const correlationId = res.headers['x-correlation-id'];
    expect(correlationId).toBeDefined();
    expect(correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('should include correlationId in sandbox execute response body', async () => {
    setupSpecQuery();
    setupClientForHistory();

    const customId = 'frontend-trace-001';
    const res = await request(app)
      .post('/v1/sandbox/execute')
      .set('Origin', FRONTEND_ORIGIN)
      .set('x-correlation-id', customId)
      .set('Content-Type', 'application/json')
      .send({
        apiId: API_ID,
        version: 'v1',
        method: 'GET',
        path: '/cotizaciones',
        appId: APP_ID,
      });

    expect(res.body.correlationId).toBe(customId);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   JSON Content-Type — Frontend sends application/json
   ═══════════════════════════════════════════════════════════════════ */

describe('Content-Type: Frontend sends application/json', () => {
  it('should accept application/json body on POST /v1/sandbox/execute', async () => {
    setupSpecQuery();
    setupClientForHistory();

    const res = await request(app)
      .post('/v1/sandbox/execute')
      .set('Origin', FRONTEND_ORIGIN)
      .set('Content-Type', 'application/json')
      .send({
        apiId: API_ID,
        version: 'v1',
        method: 'GET',
        path: '/cotizaciones',
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('should return JSON content-type on all endpoints', async () => {
    // Health
    const healthRes = await request(app)
      .get('/health')
      .set('Origin', FRONTEND_ORIGIN);
    expect(healthRes.headers['content-type']).toMatch(/application\/json/);

    // History (empty)
    setupHistoryQuery([]);
    const historyRes = await request(app)
      .get(`/v1/sandbox/history/${APP_ID}`)
      .set('Origin', FRONTEND_ORIGIN);
    expect(historyRes.headers['content-type']).toMatch(/application\/json/);
  });
});
