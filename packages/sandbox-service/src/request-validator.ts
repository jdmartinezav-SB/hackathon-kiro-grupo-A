/**
 * Request Validator — Validates incoming request parameters against an OpenAPI spec.
 *
 * Receives a parsed OpenAPI spec, a path, an HTTP method and the request params,
 * then checks that required parameters are present and that values match the
 * expected types defined in the spec.
 */

import { OpenApiSpec, OpenApiSchema, PathOperation } from './mock-engine';

/* ─── Types ─── */

export interface RequestParams {
  queryParams?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  body?: unknown;
  pathParams?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  expected?: string;
  received?: string;
}

type ParameterObject = NonNullable<PathOperation['parameters']>[number];

/* ─── $ref resolver (reuses same logic as mock-engine) ─── */

function resolveRef(spec: OpenApiSpec, ref: string): OpenApiSchema {
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

/* ─── Schema type validation ─── */

function resolveSchema(schema: OpenApiSchema, spec: OpenApiSpec): OpenApiSchema {
  if (schema.$ref) {
    return resolveRef(spec, schema.$ref);
  }
  return schema;
}

function validateType(value: unknown, schema: OpenApiSchema, spec: OpenApiSpec, fieldPath: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const resolved = resolveSchema(schema, spec);

  if (value === undefined || value === null) {
    return errors;
  }

  if (resolved.enum && resolved.enum.length > 0) {
    if (!resolved.enum.includes(value)) {
      errors.push({
        field: fieldPath,
        message: `Value must be one of: ${resolved.enum.join(', ')}`,
        expected: `enum(${resolved.enum.join('|')})`,
        received: String(value),
      });
    }
    return errors;
  }

  switch (resolved.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push({
          field: fieldPath,
          message: `Expected string, received ${typeof value}`,
          expected: 'string',
          received: typeof value,
        });
      }
      break;

    case 'number':
    case 'integer':
      if (typeof value !== 'number') {
        errors.push({
          field: fieldPath,
          message: `Expected ${resolved.type}, received ${typeof value}`,
          expected: resolved.type,
          received: typeof value,
        });
      } else if (resolved.type === 'integer' && !Number.isInteger(value)) {
        errors.push({
          field: fieldPath,
          message: 'Expected integer, received float',
          expected: 'integer',
          received: 'float',
        });
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({
          field: fieldPath,
          message: `Expected boolean, received ${typeof value}`,
          expected: 'boolean',
          received: typeof value,
        });
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        errors.push({
          field: fieldPath,
          message: `Expected array, received ${typeof value}`,
          expected: 'array',
          received: typeof value,
        });
      } else if (resolved.items) {
        value.forEach((item, index) => {
          errors.push(...validateType(item, resolved.items!, spec, `${fieldPath}[${index}]`));
        });
      }
      break;

    case 'object':
    default:
      if (resolved.properties && typeof value === 'object' && !Array.isArray(value)) {
        errors.push(...validateObjectProperties(value as Record<string, unknown>, resolved, spec, fieldPath));
      }
      break;
  }

  return errors;
}

function validateObjectProperties(
  obj: Record<string, unknown>,
  schema: OpenApiSchema,
  spec: OpenApiSpec,
  basePath: string,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const resolved = resolveSchema(schema, spec);

  // Check required fields
  if (resolved.required) {
    for (const requiredField of resolved.required) {
      if (obj[requiredField] === undefined || obj[requiredField] === null) {
        errors.push({
          field: basePath ? `${basePath}.${requiredField}` : requiredField,
          message: `Required field '${requiredField}' is missing`,
          expected: 'present',
          received: 'missing',
        });
      }
    }
  }

  // Validate types of provided fields
  if (resolved.properties) {
    for (const [key, propSchema] of Object.entries(resolved.properties)) {
      if (obj[key] !== undefined && obj[key] !== null) {
        const fieldPath = basePath ? `${basePath}.${key}` : key;
        errors.push(...validateType(obj[key], propSchema, spec, fieldPath));
      }
    }
  }

  return errors;
}

/* ─── Parameter source validation ─── */

function validateParameters(
  parameters: ParameterObject[],
  params: RequestParams,
  spec: OpenApiSpec,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const param of parameters) {
    const source = getParamSource(param.in, params);
    const value = source?.[param.name];

    if (param.required && (value === undefined || value === null)) {
      errors.push({
        field: `${param.in}.${param.name}`,
        message: `Required ${param.in} parameter '${param.name}' is missing`,
        expected: 'present',
        received: 'missing',
      });
      continue;
    }

    if (value !== undefined && value !== null && param.schema) {
      errors.push(...validateType(value, param.schema, spec, `${param.in}.${param.name}`));
    }
  }

  return errors;
}

function getParamSource(
  location: string,
  params: RequestParams,
): Record<string, unknown> | undefined {
  switch (location) {
    case 'query':
      return params.queryParams;
    case 'header':
      return params.headers;
    case 'path':
      return params.pathParams;
    default:
      return undefined;
  }
}

/* ─── Main entry point ─── */

/**
 * Validates request parameters against an OpenAPI spec for a given path + method.
 *
 * @param spec   Parsed OpenAPI JSON object
 * @param path   API path (e.g. "/v1/pets")
 * @param method HTTP method in lowercase (e.g. "get", "post")
 * @param params Request parameters (query, headers, body, pathParams)
 * @returns Array of ValidationError — empty if the request is valid
 */
export function validateRequest(
  spec: OpenApiSpec,
  path: string,
  method: string,
  params: RequestParams,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const normalizedMethod = method.toLowerCase();

  const pathItem = spec.paths?.[path];
  if (!pathItem) {
    errors.push({
      field: 'path',
      message: `Path '${path}' not found in spec`,
      expected: 'valid path',
      received: path,
    });
    return errors;
  }

  const operation = pathItem[normalizedMethod] as PathOperation | undefined;
  if (!operation) {
    errors.push({
      field: 'method',
      message: `Method '${normalizedMethod}' not found for path '${path}'`,
      expected: 'valid method',
      received: normalizedMethod,
    });
    return errors;
  }

  // Validate parameters (query, header, path)
  if (operation.parameters) {
    errors.push(...validateParameters(operation.parameters, params, spec));
  }

  // Validate request body
  if (operation.requestBody) {
    const reqBody = operation.requestBody;
    const jsonContent = reqBody.content?.['application/json'];

    if (reqBody.required && (params.body === undefined || params.body === null)) {
      errors.push({
        field: 'body',
        message: 'Request body is required',
        expected: 'present',
        received: 'missing',
      });
    } else if (params.body !== undefined && params.body !== null && jsonContent?.schema) {
      const bodySchema = resolveSchema(jsonContent.schema, spec);

      if (bodySchema.type === 'object' || bodySchema.properties) {
        if (typeof params.body !== 'object' || Array.isArray(params.body)) {
          errors.push({
            field: 'body',
            message: 'Request body must be a JSON object',
            expected: 'object',
            received: Array.isArray(params.body) ? 'array' : typeof params.body,
          });
        } else {
          errors.push(
            ...validateObjectProperties(params.body as Record<string, unknown>, bodySchema, spec, 'body'),
          );
        }
      } else {
        errors.push(...validateType(params.body, bodySchema, spec, 'body'));
      }
    }
  }

  return errors;
}
