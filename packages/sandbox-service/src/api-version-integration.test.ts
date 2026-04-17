/**
 * Integration verification: Sandbox service reads specs from api_version (Dev 2 table)
 *
 * Verifies that all sandbox-service endpoints that depend on api_version
 * correctly query, parse, and use OpenAPI specs stored by the Catalog service.
 *
 * Validates: Requirements 3 (Sandbox), 11 (Abstracción Legados)
 * Cross-module dependency: api_version + api_definition (Dev 2)
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

/* ─── Sample OpenAPI spec (simulates what Dev 2 stores in api_version.openapi_spec) ─── */
const catalogStoredSpec = {
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
                      vigente: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Crear cotización',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['placa', 'modelo'],
                properties: {
                  placa: { type: 'string' },
                  modelo: { type: 'integer' },
                  ciudad: { type: 'string' },
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
                    id: { type: 'string' },
                    prima: { type: 'number' },
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

/* ─── SOAP-flagged spec (simulates a legacy API stored by Dev 2) ─── */
const legacySoapSpec = {
  ...catalogStoredSpec,
  'x-legacy-soap': true,
  info: { title: 'Siniestros Legacy API', version: '2.0.0' },
};

/* ─── Helpers ─── */

function mockApiVersionRow(specOverride?: object, extra?: Record<string, unknown>) {
  return {
    api_version_id: 'av-uuid-1111-2222-3333-444444444444',
    openapi_spec: JSON.stringify(specOverride ?? catalogStoredSpec),
    format: 'json',
    version_tag: 'v1',
    category: extra?.category ?? 'autos',
    ...extra,
  };
}

function setupPoolQuery(rows: unknown[]) {
  mockPool.query.mockResolvedValue({ rows });
}

function setupClientForHistory() {
  const client = mockPool.__mockClient;
  client.query.mockResolvedValue({ rows: [] });
}

beforeEach(() => {
  jest.clearAllMocks();
});

/* ═══════════════════════════════════════════════════════════════════
   TEST SUITE: Cross-module integration — api_version reads
   ═══════════════════════════════════════════════════════════════════ */

describe('Integration: Sandbox reads api_version specs (Dev 2 table)', () => {

  describe('POST /v1/sandbox/execute — reads api_version JOIN api_definition', () => {
    it('should query api_version with correct JOIN and WHERE clause', async () => {
      setupPoolQuery([mockApiVersionRow()]);
      setupClientForHistory();

      await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'def-uuid-autos',
          version: 'v1',
          method: 'GET',
          path: '/cotizaciones',
        });

      // Verify the SQL query joins api_version with api_definition
      const queryCall = mockPool.query.mock.calls[0];
      const sql = queryCall[0] as string;
      expect(sql).toContain('api_version');
      expect(sql).toContain('api_definition');
      expect(sql).toContain('JOIN');
      expect(sql).toContain("status = 'active'");

      // Verify parameters: apiId maps to api_definition.id, version to version_tag
      const params = queryCall[1] as string[];
      expect(params[0]).toBe('def-uuid-autos');
      expect(params[1]).toBe('v1');
    });

    it('should parse and use the openapi_spec from api_version to generate mock', async () => {
      setupPoolQuery([mockApiVersionRow()]);
      setupClientForHistory();

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'def-uuid-autos',
          version: 'v1',
          method: 'GET',
          path: '/cotizaciones',
        });

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
      // Mock engine generates response based on the spec schema
      expect(res.body.body).toBeDefined();
      expect(res.body.headers['content-type']).toBe('application/json');
      expect(res.body.responseTimeMs).toBeGreaterThanOrEqual(0);
      expect(res.body.correlationId).toBeDefined();
    });

    it('should validate request body against spec schema from api_version', async () => {
      setupPoolQuery([mockApiVersionRow()]);
      setupClientForHistory();

      // POST /cotizaciones requires 'placa' and 'modelo' — send empty body
      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'def-uuid-autos',
          version: 'v1',
          method: 'POST',
          path: '/cotizaciones',
          body: {},
        });

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.validationErrors).toBeDefined();
      expect(res.body.validationErrors.length).toBeGreaterThan(0);
    });

    it('should return 404 when api_version row does not exist', async () => {
      setupPoolQuery([]);

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'nonexistent-api',
          version: 'v99',
          method: 'GET',
          path: '/cotizaciones',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('SANDBOX_002');
    });

    it('should handle corrupted openapi_spec gracefully', async () => {
      setupPoolQuery([{
        api_version_id: 'av-uuid-corrupt',
        openapi_spec: '<<<INVALID JSON>>>',
        format: 'json',
      }]);

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'def-uuid-autos',
          version: 'v1',
          method: 'GET',
          path: '/cotizaciones',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('SANDBOX_003');
    });
  });

  describe('GET /v1/sandbox/apis/:apiId/example — reads latest active api_version', () => {
    it('should query api_version ordered by published_at DESC for latest version', async () => {
      setupPoolQuery([mockApiVersionRow()]);

      await request(app)
        .get('/v1/sandbox/apis/def-uuid-autos/example');

      const queryCall = mockPool.query.mock.calls[0];
      const sql = queryCall[0] as string;
      expect(sql).toContain('api_version');
      expect(sql).toContain('api_definition');
      expect(sql).toContain("status = 'active'");
      expect(sql).toContain('ORDER BY');
      expect(sql).toContain('published_at DESC');
      expect(sql).toContain('LIMIT 1');
    });

    it('should return pre-loaded example from the spec stored in api_version', async () => {
      setupPoolQuery([mockApiVersionRow()]);

      const res = await request(app)
        .get('/v1/sandbox/apis/def-uuid-autos/example');

      expect(res.status).toBe(200);
      expect(res.body.apiId).toBe('def-uuid-autos');
      expect(res.body.version).toBe('v1');
      expect(res.body.method).toBeDefined();
      expect(res.body.path).toBe('/cotizaciones');
      expect(res.body.headers).toBeDefined();
      expect(res.body.mockResponse).toBeDefined();
      expect(res.body.mockResponse.statusCode).toBe(200);
    });

    it('should return 404 when no active api_version exists for the API', async () => {
      setupPoolQuery([]);

      const res = await request(app)
        .get('/v1/sandbox/apis/nonexistent-api/example');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('SANDBOX_EX_001');
    });
  });

  describe('POST /v1/gateway/proxy — reads api_version + category for SOAP detection', () => {
    it('should query api_version with category from api_definition', async () => {
      setupPoolQuery([mockApiVersionRow()]);

      await request(app)
        .post('/v1/gateway/proxy/def-uuid-autos/v1/cotizaciones')
        .send({ placa: 'ABC123', modelo: 2024 });

      const queryCall = mockPool.query.mock.calls[0];
      const sql = queryCall[0] as string;
      expect(sql).toContain('api_version');
      expect(sql).toContain('api_definition');
      expect(sql).toContain('category');
      expect(sql).toContain("status = 'active'");
    });

    it('should use REST protocol for non-legacy specs from api_version', async () => {
      setupPoolQuery([mockApiVersionRow()]);

      const res = await request(app)
        .post('/v1/gateway/proxy/def-uuid-autos/v1/cotizaciones')
        .send({ placa: 'ABC123', modelo: 2024 });

      expect(res.status).toBe(200);
      expect(res.body.gateway.translated).toBe(false);
      expect(res.body.gateway.protocol).toBe('REST');
    });

    it('should detect legacy SOAP API via x-legacy-soap flag in spec', async () => {
      setupPoolQuery([mockApiVersionRow(legacySoapSpec)]);

      const res = await request(app)
        .post('/v1/gateway/proxy/def-uuid-legacy/v1/cotizaciones')
        .send({ placa: 'ABC123', modelo: 2024 });

      expect(res.status).toBe(200);
      expect(res.body.gateway.translated).toBe(true);
      expect(res.body.gateway.protocol).toBe('SOAP');
      expect(res.body.gateway.operation).toBeDefined();
    });

    it('should detect legacy SOAP API via category containing "soap"', async () => {
      setupPoolQuery([mockApiVersionRow(catalogStoredSpec, { category: 'legacy-soap-services' })]);

      const res = await request(app)
        .post('/v1/gateway/proxy/def-uuid-legacy/v1/cotizaciones')
        .send({ placa: 'ABC123', modelo: 2024 });

      expect(res.status).toBe(200);
      expect(res.body.gateway.translated).toBe(true);
      expect(res.body.gateway.protocol).toBe('SOAP');
    });

    it('should return 404 when api_version not found in gateway proxy', async () => {
      setupPoolQuery([]);

      const res = await request(app)
        .post('/v1/gateway/proxy/nonexistent/v99/anything')
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('GW_001');
    });
  });

  describe('Cross-cutting: spec format handling', () => {
    it('should handle JSON-formatted specs stored in api_version', async () => {
      setupPoolQuery([mockApiVersionRow(catalogStoredSpec, { format: 'json' })]);
      setupClientForHistory();

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'def-uuid-autos',
          version: 'v1',
          method: 'GET',
          path: '/cotizaciones',
        });

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
    });

    it('should handle YAML-formatted specs that are actually JSON content', async () => {
      // Dev 2 might store JSON content with format='yaml' flag
      setupPoolQuery([mockApiVersionRow(catalogStoredSpec, { format: 'yaml' })]);
      setupClientForHistory();

      const res = await request(app)
        .post('/v1/sandbox/execute')
        .send({
          apiId: 'def-uuid-autos',
          version: 'v1',
          method: 'GET',
          path: '/cotizaciones',
        });

      // parseSpec falls back to JSON.parse when content starts with '{'
      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
    });
  });
});
