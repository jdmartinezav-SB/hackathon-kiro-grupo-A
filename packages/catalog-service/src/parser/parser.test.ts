import { parse } from './parser';

const MINIMAL_OPENAPI_YAML = `
openapi: "3.0.3"
info:
  title: Test API
  version: "1.0.0"
paths: {}
`;

const FULL_OPENAPI_JSON = JSON.stringify({
  openapi: '3.0.3',
  info: {
    title: 'Insurance API',
    description: 'Seguros Bolívar APIs',
    version: '2.1.0',
    contact: { name: 'Dev Team', email: 'dev@example.com', url: 'https://example.com' },
  },
  servers: [
    { url: 'https://api.example.com/v1', description: 'Production' },
    { url: 'https://sandbox.example.com/v1', description: 'Sandbox' },
  ],
  paths: {
    '/v1/quotes': {
      get: {
        summary: 'List quotes',
        operationId: 'listQuotes',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        summary: 'Create quote',
        operationId: 'createQuote',
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/v1/policies/{id}': {
      get: {
        summary: 'Get policy',
        operationId: 'getPolicy',
        tags: ['policies'],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
  components: {
    schemas: {
      Quote: { type: 'object', properties: { id: { type: 'string' } } },
      Policy: { type: 'object', properties: { number: { type: 'string' } } },
    },
  },
});

describe('parse()', () => {
  describe('YAML parsing', () => {
    it('should parse a minimal valid YAML spec', () => {
      const result = parse(MINIMAL_OPENAPI_YAML, 'yaml');
      expect(result.success).toBe(true);
      expect(result.model).toBeDefined();
      expect(result.model!.openapi).toBe('3.0.3');
      expect(result.model!.info.title).toBe('Test API');
      expect(result.model!.info.version).toBe('1.0.0');
    });

    it('should return error for invalid YAML syntax', () => {
      const result = parse('openapi: !!invalid\n  bad: [', 'yaml');
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.errors![0].message).toContain('Invalid YAML syntax');
    });
  });

  describe('JSON parsing', () => {
    it('should parse a full valid JSON spec', () => {
      const result = parse(FULL_OPENAPI_JSON, 'json');
      expect(result.success).toBe(true);
      const model = result.model!;
      expect(model.openapi).toBe('3.0.3');
      expect(model.info.title).toBe('Insurance API');
      expect(model.info.description).toBe('Seguros Bolívar APIs');
      expect(model.info.contact?.email).toBe('dev@example.com');
      expect(model.servers).toHaveLength(2);
      expect(model.servers[0].url).toBe('https://api.example.com/v1');
    });

    it('should return error for invalid JSON syntax', () => {
      const result = parse('{ not valid json }', 'json');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Invalid JSON syntax');
    });

    it('should return error when content is not an object', () => {
      const result = parse('"just a string"', 'json');
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('valid OpenAPI object');
    });
  });

  describe('endpoint extraction', () => {
    it('should extract endpoints grouped by resource', () => {
      const result = parse(FULL_OPENAPI_JSON, 'json');
      const model = result.model!;
      expect(model.paths.length).toBeGreaterThan(0);

      const quotesGroup = model.paths.find((g) => g.resource === '/quotes');
      expect(quotesGroup).toBeDefined();
      expect(quotesGroup!.endpoints).toHaveLength(2);

      const getQuotes = quotesGroup!.endpoints.find((e) => e.method === 'GET');
      expect(getQuotes?.operationId).toBe('listQuotes');
      expect(getQuotes?.parameters).toBeDefined();

      const postQuotes = quotesGroup!.endpoints.find((e) => e.method === 'POST');
      expect(postQuotes?.operationId).toBe('createQuote');
      expect(postQuotes?.requestBody).toBeDefined();
    });

    it('should extract tags from operations', () => {
      const result = parse(FULL_OPENAPI_JSON, 'json');
      const policiesGroup = result.model!.paths.find((g) => g.resource === '/policies');
      expect(policiesGroup).toBeDefined();
      const getPolicy = policiesGroup!.endpoints[0];
      expect(getPolicy.tags).toEqual(['policies']);
    });
  });

  describe('schemas extraction', () => {
    it('should extract component schemas', () => {
      const result = parse(FULL_OPENAPI_JSON, 'json');
      expect(result.model!.schemas).toHaveProperty('Quote');
      expect(result.model!.schemas).toHaveProperty('Policy');
    });

    it('should return empty schemas when components are missing', () => {
      const result = parse(MINIMAL_OPENAPI_YAML, 'yaml');
      expect(result.model!.schemas).toEqual({});
    });
  });

  describe('raw preservation (round-trip support)', () => {
    it('should preserve the complete raw object', () => {
      const result = parse(FULL_OPENAPI_JSON, 'json');
      const raw = result.model!.raw;
      expect(raw['openapi']).toBe('3.0.3');
      expect(raw['paths']).toBeDefined();
      expect(raw['components']).toBeDefined();
      expect(raw['servers']).toBeDefined();
    });

    it('should preserve raw for YAML input too', () => {
      const result = parse(MINIMAL_OPENAPI_YAML, 'yaml');
      expect(result.model!.raw['openapi']).toBe('3.0.3');
    });
  });

  describe('edge cases', () => {
    it('should handle empty paths gracefully', () => {
      const spec = JSON.stringify({ openapi: '3.0.0', info: { title: 'X', version: '1' }, paths: {} });
      const result = parse(spec, 'json');
      expect(result.success).toBe(true);
      expect(result.model!.paths).toEqual([]);
    });

    it('should handle missing info gracefully', () => {
      const spec = JSON.stringify({ openapi: '3.0.0' });
      const result = parse(spec, 'json');
      expect(result.success).toBe(true);
      expect(result.model!.info.title).toBe('');
    });

    it('should handle null YAML content', () => {
      const result = parse('null', 'yaml');
      expect(result.success).toBe(false);
    });
  });
});
