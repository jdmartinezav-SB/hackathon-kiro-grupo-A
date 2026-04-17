import { validateRequest, ValidationError, RequestParams } from './request-validator';
import { OpenApiSpec } from './mock-engine';

/* ─── Helpers ─── */

function makeSpec(overrides: Record<string, unknown> = {}): OpenApiSpec {
  return {
    paths: {},
    components: { schemas: {} },
    ...overrides,
  } as OpenApiSpec;
}

/* ─── Tests ─── */

describe('request-validator — validateRequest', () => {
  describe('path and method validation', () => {
    it('returns error when path is not found in spec', () => {
      const spec = makeSpec();
      const errors = validateRequest(spec, '/nonexistent', 'get', {});

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('path');
      expect(errors[0].message).toContain('not found');
    });

    it('returns error when method is not found for path', () => {
      const spec = makeSpec({
        paths: { '/pets': { get: { responses: { '200': {} } } } },
      });
      const errors = validateRequest(spec, '/pets', 'delete', {});

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('method');
      expect(errors[0].message).toContain('not found');
    });

    it('handles case-insensitive method matching', () => {
      const spec = makeSpec({
        paths: { '/pets': { get: { responses: { '200': {} } } } },
      });
      const errors = validateRequest(spec, '/pets', 'GET', {});

      expect(errors).toHaveLength(0);
    });
  });

  describe('required query parameters', () => {
    const spec = makeSpec({
      paths: {
        '/search': {
          get: {
            parameters: [
              { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
              { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
            ],
            responses: { '200': {} },
          },
        },
      },
    });

    it('returns error when required query param is missing', () => {
      const errors = validateRequest(spec, '/search', 'get', { queryParams: {} });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('query.q');
      expect(errors[0].message).toContain("'q'");
    });

    it('passes when required query param is present', () => {
      const errors = validateRequest(spec, '/search', 'get', {
        queryParams: { q: 'test' },
      });

      expect(errors).toHaveLength(0);
    });

    it('does not error on missing optional param', () => {
      const errors = validateRequest(spec, '/search', 'get', {
        queryParams: { q: 'test' },
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('type validation for parameters', () => {
    const spec = makeSpec({
      paths: {
        '/items': {
          get: {
            parameters: [
              { name: 'count', in: 'query', required: true, schema: { type: 'integer' } },
            ],
            responses: { '200': {} },
          },
        },
      },
    });

    it('returns error when param type does not match', () => {
      const errors = validateRequest(spec, '/items', 'get', {
        queryParams: { count: 'not-a-number' },
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('query.count');
      expect(errors[0].expected).toBe('integer');
    });

    it('passes when param type matches', () => {
      const errors = validateRequest(spec, '/items', 'get', {
        queryParams: { count: 10 },
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('request body validation', () => {
    const spec = makeSpec({
      paths: {
        '/pets': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['name', 'age'],
                    properties: {
                      name: { type: 'string' },
                      age: { type: 'integer' },
                      active: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            responses: { '201': {} },
          },
        },
      },
    });

    it('returns error when required body is missing', () => {
      const errors = validateRequest(spec, '/pets', 'post', {});

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('body');
      expect(errors[0].message).toContain('required');
    });

    it('returns error when required body fields are missing', () => {
      const errors = validateRequest(spec, '/pets', 'post', {
        body: { active: true },
      });

      expect(errors.length).toBeGreaterThanOrEqual(2);
      const fields = errors.map((e) => e.field);
      expect(fields).toContain('body.name');
      expect(fields).toContain('body.age');
    });

    it('returns error when body field has wrong type', () => {
      const errors = validateRequest(spec, '/pets', 'post', {
        body: { name: 123, age: 5 },
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('body.name');
      expect(errors[0].expected).toBe('string');
    });

    it('passes with valid body', () => {
      const errors = validateRequest(spec, '/pets', 'post', {
        body: { name: 'Rex', age: 3, active: true },
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('enum validation', () => {
    const spec = makeSpec({
      paths: {
        '/status': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['state'],
                    properties: {
                      state: { type: 'string', enum: ['active', 'suspended', 'revoked'] },
                    },
                  },
                },
              },
            },
            responses: { '200': {} },
          },
        },
      },
    });

    it('returns error when value is not in enum', () => {
      const errors = validateRequest(spec, '/status', 'post', {
        body: { state: 'unknown' },
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('body.state');
      expect(errors[0].message).toContain('must be one of');
    });

    it('passes when value is in enum', () => {
      const errors = validateRequest(spec, '/status', 'post', {
        body: { state: 'active' },
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('$ref resolution', () => {
    const spec: OpenApiSpec = {
      paths: {
        '/orders': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Order' },
                },
              },
            },
            responses: { '201': {} },
          },
        },
      },
      components: {
        schemas: {
          Order: {
            type: 'object',
            required: ['orderId'],
            properties: {
              orderId: { type: 'integer' },
              total: { type: 'number' },
            },
          },
        },
      },
    };

    it('validates body against resolved $ref schema', () => {
      const errors = validateRequest(spec, '/orders', 'post', {
        body: { total: 99.9 },
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('body.orderId');
      expect(errors[0].message).toContain('missing');
    });

    it('passes with valid body matching $ref schema', () => {
      const errors = validateRequest(spec, '/orders', 'post', {
        body: { orderId: 1, total: 99.9 },
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('array body validation', () => {
    const spec = makeSpec({
      paths: {
        '/tags': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
            responses: { '201': {} },
          },
        },
      },
    });

    it('returns error when body is not an array', () => {
      const errors = validateRequest(spec, '/tags', 'post', {
        body: 'not-an-array',
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('body');
      expect(errors[0].expected).toBe('array');
    });

    it('validates items inside the array', () => {
      const errors = validateRequest(spec, '/tags', 'post', {
        body: ['valid', 123],
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('body[1]');
      expect(errors[0].expected).toBe('string');
    });

    it('passes with valid array body', () => {
      const errors = validateRequest(spec, '/tags', 'post', {
        body: ['alpha', 'beta'],
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('header and path parameters', () => {
    const spec = makeSpec({
      paths: {
        '/items/{id}': {
          get: {
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
              { name: 'x-api-key', in: 'header', required: true, schema: { type: 'string' } },
            ],
            responses: { '200': {} },
          },
        },
      },
    });

    it('returns errors for missing path and header params', () => {
      const errors = validateRequest(spec, '/items/{id}', 'get', {});

      expect(errors.length).toBeGreaterThanOrEqual(2);
      const fields = errors.map((e) => e.field);
      expect(fields).toContain('path.id');
      expect(fields).toContain('header.x-api-key');
    });

    it('passes with all required params present', () => {
      const errors = validateRequest(spec, '/items/{id}', 'get', {
        pathParams: { id: 'abc-123' },
        headers: { 'x-api-key': 'my-key' },
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('no parameters or body defined', () => {
    it('returns no errors when operation has no params or body', () => {
      const spec = makeSpec({
        paths: { '/ping': { get: { responses: { '200': {} } } } },
      });
      const errors = validateRequest(spec, '/ping', 'get', {});

      expect(errors).toHaveLength(0);
    });
  });
});
