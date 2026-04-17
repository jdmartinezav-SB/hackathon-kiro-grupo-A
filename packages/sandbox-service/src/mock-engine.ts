/**
 * Mock Engine — Generates mock responses based on OpenAPI schemas.
 *
 * Receives a parsed OpenAPI spec, a path and an HTTP method,
 * then produces a structured response (statusCode, headers, body)
 * with data that matches the schema types.
 */

/* ─── Types ─── */

export interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface OpenApiSchema {
  type?: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  enum?: unknown[];
  example?: unknown;
  $ref?: string;
  required?: string[];
  additionalProperties?: boolean | OpenApiSchema;
}

export interface OpenApiSpec {
  paths?: Record<string, Record<string, PathOperation>>;
  components?: { schemas?: Record<string, OpenApiSchema> };
}

export interface PathOperation {
  parameters?: Array<{
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    required?: boolean;
    schema?: OpenApiSchema;
  }>;
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: OpenApiSchema }>;
  };
  responses?: Record<string, ResponseObject>;
}

interface ResponseObject {
  content?: Record<string, { schema?: OpenApiSchema }>;
}

/* ─── $ref resolver ─── */

function resolveRef(spec: OpenApiSpec, ref: string): OpenApiSchema {
  // Supports "#/components/schemas/ModelName"
  const parts = ref.replace(/^#\//, '').split('/');
  let current: unknown = spec;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return {};
    }
    current = (current as Record<string, unknown>)[part];
  }

  return (current as OpenApiSchema) ?? {};
}

/* ─── Schema → mock data generator ─── */

export function generateFromSchema(schema: OpenApiSchema, spec: OpenApiSpec): unknown {
  if (!schema) return null;

  // Resolve $ref first
  if (schema.$ref) {
    const resolved = resolveRef(spec, schema.$ref);
    return generateFromSchema(resolved, spec);
  }

  // Prefer explicit example
  if (schema.example !== undefined) {
    return schema.example;
  }

  // Enum: return first value
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  switch (schema.type) {
    case 'string':
      return 'lorem ipsum';

    case 'number':
      return Math.random() * 1000;

    case 'integer':
      return Math.floor(Math.random() * 1000);

    case 'boolean':
      return true;

    case 'array': {
      if (schema.items) {
        return [generateFromSchema(schema.items, spec)];
      }
      return [];
    }

    case 'object':
    default: {
      if (schema.properties) {
        const result: Record<string, unknown> = {};
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          result[key] = generateFromSchema(propSchema, spec);
        }
        return result;
      }
      return {};
    }
  }
}


/* ─── Main entry point ─── */

/**
 * Generates a mock HTTP response based on an OpenAPI spec for a given path + method.
 *
 * @param spec   Parsed OpenAPI JSON object
 * @param path   API path (e.g. "/v1/pets")
 * @param method HTTP method in lowercase (e.g. "get", "post")
 * @returns MockResponse with statusCode, headers and body
 */
export function generateMockResponse(
  spec: OpenApiSpec,
  path: string,
  method: string,
): MockResponse {
  const normalizedMethod = method.toLowerCase();

  // Lookup path
  const pathItem = spec.paths?.[path];
  if (!pathItem) {
    return {
      statusCode: 404,
      headers: { 'content-type': 'application/json' },
      body: { error: 'Path not found', path },
    };
  }

  // Lookup method
  const operation = pathItem[normalizedMethod];
  if (!operation) {
    return {
      statusCode: 404,
      headers: { 'content-type': 'application/json' },
      body: { error: 'Method not found', path, method: normalizedMethod },
    };
  }

  // Find 200 response schema
  const response200 = operation.responses?.['200'];
  if (!response200) {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: {},
    };
  }

  // Prefer application/json content
  const jsonContent = response200.content?.['application/json'];
  if (!jsonContent?.schema) {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: {},
    };
  }

  const body = generateFromSchema(jsonContent.schema, spec);

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body,
  };
}
