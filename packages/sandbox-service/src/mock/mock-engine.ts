import { v4 as uuidv4 } from 'uuid';

export interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  responseTimeMs: number;
}

/**
 * Generates a mock response from an OpenAPI spec for a given path and method.
 * Walks the spec to find the operation, extracts the success response schema,
 * and recursively generates sample data.
 */
export function generateMockResponse(
  openapiSpec: Record<string, unknown>,
  path: string,
  method: string
): MockResponse {
  const correlationId = uuidv4();
  const responseTimeMs = Math.floor(Math.random() * 251) + 50; // 50-300ms

  const baseHeaders: Record<string, string> = {
    'content-type': 'application/json',
    'x-correlation-id': correlationId,
  };

  const paths = openapiSpec.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) {
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: { message: 'OK' },
      responseTimeMs,
    };
  }

  const pathItem = paths[path];
  if (!pathItem) {
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: { message: 'OK' },
      responseTimeMs,
    };
  }

  const operation = pathItem[method.toLowerCase()] as Record<string, unknown> | undefined;
  if (!operation) {
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: { message: 'OK' },
      responseTimeMs,
    };
  }

  const responses = operation.responses as Record<string, unknown> | undefined;
  if (!responses) {
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: { message: 'OK' },
      responseTimeMs,
    };
  }

  // Find the first success response (200 or 201)
  const successCode = ['200', '201'].find((code) => responses[code]);
  if (!successCode) {
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: { message: 'OK' },
      responseTimeMs,
    };
  }

  const successResponse = responses[successCode] as Record<string, unknown>;
  const schema = extractSchema(successResponse);

  if (!schema) {
    return {
      statusCode: parseInt(successCode, 10),
      headers: baseHeaders,
      body: { message: 'OK' },
      responseTimeMs,
    };
  }

  const body = generateFromSchema(schema);

  return {
    statusCode: parseInt(successCode, 10),
    headers: baseHeaders,
    body,
    responseTimeMs,
  };
}

/**
 * Extracts the JSON schema from an OpenAPI response object.
 * Supports both OpenAPI 3.x (content.application/json.schema)
 * and OpenAPI 2.x (schema) formats.
 */
function extractSchema(
  responseObj: Record<string, unknown>
): Record<string, unknown> | null {
  // OpenAPI 3.x: content -> application/json -> schema
  const content = responseObj.content as Record<string, Record<string, unknown>> | undefined;
  if (content) {
    const jsonContent = content['application/json'];
    if (jsonContent?.schema) {
      return jsonContent.schema as Record<string, unknown>;
    }
  }

  // OpenAPI 2.x: schema directly on response
  if (responseObj.schema) {
    return responseObj.schema as Record<string, unknown>;
  }

  return null;
}

/**
 * Recursively generates mock data from a JSON Schema object.
 */
function generateFromSchema(schema: Record<string, unknown>): unknown {
  // Use example if available
  if (schema.example !== undefined) {
    return schema.example;
  }

  const type = schema.type as string | undefined;

  switch (type) {
    case 'string':
      return generateString(schema);
    case 'number':
    case 'integer':
      return generateNumber(schema);
    case 'boolean':
      return true;
    case 'array':
      return generateArray(schema);
    case 'object':
      return generateObject(schema);
    default:
      // If no type but has properties, treat as object
      if (schema.properties) {
        return generateObject(schema);
      }
      return 'lorem_ipsum';
  }
}

function generateString(schema: Record<string, unknown>): string {
  if (schema.enum) {
    const values = schema.enum as string[];
    return values[0] || 'lorem_ipsum';
  }

  const format = schema.format as string | undefined;
  switch (format) {
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'date-time':
      return new Date().toISOString();
    case 'email':
      return 'user@example.com';
    case 'uri':
    case 'url':
      return 'https://api.example.com/resource';
    case 'uuid':
      return uuidv4();
    default:
      return 'lorem_ipsum';
  }
}

function generateNumber(schema: Record<string, unknown>): number {
  const min = (schema.minimum as number) ?? 1;
  const max = (schema.maximum as number) ?? 1000;
  const value = Math.floor(Math.random() * (max - min + 1)) + min;

  if (schema.type === 'integer') {
    return Math.floor(value);
  }
  return Math.round(value * 100) / 100;
}

function generateArray(schema: Record<string, unknown>): unknown[] {
  const items = schema.items as Record<string, unknown> | undefined;
  if (!items) {
    return [];
  }
  return [generateFromSchema(items)];
}

function generateObject(schema: Record<string, unknown>): Record<string, unknown> {
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
  if (!properties) {
    return {};
  }

  const result: Record<string, unknown> = {};
  for (const [key, propSchema] of Object.entries(properties)) {
    result[key] = generateFromSchema(propSchema);
  }
  return result;
}
