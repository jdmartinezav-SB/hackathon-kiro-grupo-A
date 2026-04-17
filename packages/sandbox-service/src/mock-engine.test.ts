import { generateMockResponse, OpenApiSpec } from './mock-engine';

/* ─── Helpers ─── */

function makeSpec(overrides: Partial<OpenApiSpec> = {}): OpenApiSpec {
  return {
    paths: {},
    components: { schemas: {} },
    ...overrides,
  };
}

function specWithSchema(path: string, method: string, schema: object): OpenApiSpec {
  return makeSpec({
    paths: {
      [path]: {
        [method]: {
          responses: {
            '200': {
              content: { 'application/json': { schema } },
            },
          },
        },
      },
    },
  });
}

/* ─── Tests ─── */

describe('mock-engine — generateMockResponse', () => {
  it('generates correct mock data for a simple object schema', () => {
    const spec = specWithSchema('/pets', 'get', {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        active: { type: 'boolean' },
      },
    });

    const result = generateMockResponse(spec, '/pets', 'get');

    expect(result.statusCode).toBe(200);
    expect(result.headers['content-type']).toBe('application/json');

    const body = result.body as Record<string, unknown>;
    expect(body.name).toBe('lorem ipsum');
    expect(typeof body.age).toBe('number');
    expect(Number.isInteger(body.age)).toBe(true);
    expect(body.active).toBe(true);
  });

  it('handles nested objects recursively', () => {
    const spec = specWithSchema('/users', 'get', {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            zip: { type: 'integer' },
          },
        },
      },
    });

    const result = generateMockResponse(spec, '/users', 'get');
    const body = result.body as Record<string, unknown>;
    const address = body.address as Record<string, unknown>;

    expect(address.street).toBe('lorem ipsum');
    expect(address.city).toBe('lorem ipsum');
    expect(typeof address.zip).toBe('number');
  });

  it('generates an array with exactly 1 item from items schema', () => {
    const spec = specWithSchema('/tags', 'get', {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          label: { type: 'string' },
        },
      },
    });

    const result = generateMockResponse(spec, '/tags', 'get');
    const body = result.body as Array<Record<string, unknown>>;

    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(typeof body[0].id).toBe('number');
    expect(body[0].label).toBe('lorem ipsum');
  });

  it('resolves $ref references within the spec', () => {
    const spec: OpenApiSpec = {
      paths: {
        '/orders': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Order: {
            type: 'object',
            properties: {
              orderId: { type: 'integer' },
              total: { type: 'number' },
              status: { type: 'string' },
            },
          },
        },
      },
    };

    const result = generateMockResponse(spec, '/orders', 'get');
    const body = result.body as Record<string, unknown>;

    expect(result.statusCode).toBe(200);
    expect(typeof body.orderId).toBe('number');
    expect(typeof body.total).toBe('number');
    expect(body.status).toBe('lorem ipsum');
  });

  it('returns 404 when path is not found', () => {
    const spec = makeSpec();
    const result = generateMockResponse(spec, '/nonexistent', 'get');

    expect(result.statusCode).toBe(404);
    const body = result.body as Record<string, unknown>;
    expect(body.error).toBe('Path not found');
  });

  it('returns 404 when method is not found on existing path', () => {
    const spec = specWithSchema('/pets', 'get', { type: 'object', properties: {} });
    const result = generateMockResponse(spec, '/pets', 'delete');

    expect(result.statusCode).toBe(404);
    const body = result.body as Record<string, unknown>;
    expect(body.error).toBe('Method not found');
  });

  it('prefers example values when provided in the schema', () => {
    const spec = specWithSchema('/config', 'get', {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Seguros Bolívar' },
        version: { type: 'integer', example: 42 },
        tags: {
          type: 'array',
          example: ['alpha', 'beta'],
        },
      },
    });

    const result = generateMockResponse(spec, '/config', 'get');
    const body = result.body as Record<string, unknown>;

    expect(body.name).toBe('Seguros Bolívar');
    expect(body.version).toBe(42);
    expect(body.tags).toEqual(['alpha', 'beta']);
  });

  it('returns first enum value when enum is defined', () => {
    const spec = specWithSchema('/status', 'get', {
      type: 'object',
      properties: {
        state: { type: 'string', enum: ['active', 'suspended', 'revoked'] },
      },
    });

    const result = generateMockResponse(spec, '/status', 'get');
    const body = result.body as Record<string, unknown>;

    expect(body.state).toBe('active');
  });

  it('handles case-insensitive method matching', () => {
    const spec = specWithSchema('/items', 'post', {
      type: 'object',
      properties: { id: { type: 'integer' } },
    });

    const result = generateMockResponse(spec, '/items', 'POST');
    expect(result.statusCode).toBe(200);
  });
});
