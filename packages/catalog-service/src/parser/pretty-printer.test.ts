import { parse } from './parser';
import { format } from './pretty-printer';

const MINIMAL_YAML = `openapi: "3.0.3"
info:
  title: Test API
  version: "1.0.0"
paths: {}
`;

const FULL_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Insurance API',
    description: 'Seguros Bolívar APIs',
    version: '2.1.0',
    contact: { name: 'Dev Team', email: 'dev@example.com' },
  },
  servers: [{ url: 'https://api.example.com/v1', description: 'Production' }],
  paths: {
    '/v1/quotes': {
      get: {
        summary: 'List quotes',
        operationId: 'listQuotes',
        responses: { '200': { description: 'OK' } },
      },
    },
  },
  components: {
    schemas: {
      Quote: { type: 'object', properties: { id: { type: 'string' } } },
    },
  },
};

describe('format()', () => {
  describe('JSON output', () => {
    it('should serialize model to valid JSON with 2-space indentation', () => {
      const result = parse(JSON.stringify(FULL_SPEC), 'json');
      const output = format(result.model!, 'json');
      const reparsed = JSON.parse(output);
      expect(reparsed).toEqual(FULL_SPEC);
    });
  });

  describe('YAML output', () => {
    it('should serialize model to valid YAML', () => {
      const result = parse(MINIMAL_YAML, 'yaml');
      const output = format(result.model!, 'yaml');
      expect(output).toContain('openapi');
      expect(output).toContain('Test API');
    });
  });

  describe('round-trip (Property 1)', () => {
    it('JSON → parse → format(json) → re-parse yields equivalent model', () => {
      const original = parse(JSON.stringify(FULL_SPEC), 'json');
      const formatted = format(original.model!, 'json');
      const reparsed = parse(formatted, 'json');

      expect(reparsed.success).toBe(true);
      expect(reparsed.model!.openapi).toBe(original.model!.openapi);
      expect(reparsed.model!.info).toEqual(original.model!.info);
      expect(reparsed.model!.raw).toEqual(original.model!.raw);
    });

    it('YAML → parse → format(yaml) → re-parse yields equivalent model', () => {
      const original = parse(MINIMAL_YAML, 'yaml');
      const formatted = format(original.model!, 'yaml');
      const reparsed = parse(formatted, 'yaml');

      expect(reparsed.success).toBe(true);
      expect(reparsed.model!.openapi).toBe(original.model!.openapi);
      expect(reparsed.model!.info).toEqual(original.model!.info);
      expect(reparsed.model!.raw).toEqual(original.model!.raw);
    });

    it('JSON → parse → format(yaml) → re-parse preserves raw', () => {
      const original = parse(JSON.stringify(FULL_SPEC), 'json');
      const yamlOutput = format(original.model!, 'yaml');
      const reparsed = parse(yamlOutput, 'yaml');

      expect(reparsed.success).toBe(true);
      expect(reparsed.model!.raw).toEqual(original.model!.raw);
    });
  });
});
