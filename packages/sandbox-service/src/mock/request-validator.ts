export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a request against an OpenAPI spec for a given path and method.
 * Checks required parameters and basic body schema type matching.
 * Returns an array of validation errors (empty if valid).
 */
export function validateRequest(
  openapiSpec: Record<string, unknown>,
  path: string,
  method: string,
  params: { headers?: Record<string, string>; body?: unknown }
): ValidationError[] {
  const errors: ValidationError[] = [];

  const paths = openapiSpec.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) {
    return errors;
  }

  const pathItem = paths[path];
  if (!pathItem) {
    return errors;
  }

  const operation = pathItem[method.toLowerCase()] as Record<string, unknown> | undefined;
  if (!operation) {
    return errors;
  }

  // Check required parameters
  const parameters = operation.parameters as Array<Record<string, unknown>> | undefined;
  if (parameters) {
    for (const param of parameters) {
      if (param.required === true) {
        const paramIn = param.in as string;
        const paramName = param.name as string;

        if (paramIn === 'header') {
          const headerValue = params.headers?.[paramName.toLowerCase()];
          if (!headerValue) {
            errors.push({
              field: `headers.${paramName}`,
              message: `Required header '${paramName}' is missing`,
            });
          }
        }
      }
    }
  }

  // Check request body (OpenAPI 3.x)
  const requestBody = operation.requestBody as Record<string, unknown> | undefined;
  if (requestBody) {
    const required = requestBody.required as boolean | undefined;
    if (required && !params.body) {
      errors.push({
        field: 'body',
        message: 'Request body is required',
      });
    }

    if (params.body) {
      const content = requestBody.content as Record<string, Record<string, unknown>> | undefined;
      if (content) {
        const jsonContent = content['application/json'];
        if (jsonContent?.schema) {
          const schema = jsonContent.schema as Record<string, unknown>;
          const bodyErrors = validateBodyAgainstSchema(params.body, schema, 'body');
          errors.push(...bodyErrors);
        }
      }
    }
  }

  return errors;
}

/**
 * Basic type checking of a body value against a JSON Schema.
 */
function validateBodyAgainstSchema(
  value: unknown,
  schema: Record<string, unknown>,
  path: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const expectedType = schema.type as string | undefined;

  if (!expectedType) {
    return errors;
  }

  const actualType = getJsonType(value);

  if (expectedType === 'object' && actualType === 'object' && value !== null) {
    const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
    const required = schema.required as string[] | undefined;

    if (required && properties) {
      const obj = value as Record<string, unknown>;
      for (const field of required) {
        if (obj[field] === undefined || obj[field] === null) {
          errors.push({
            field: `${path}.${field}`,
            message: `Required field '${field}' is missing`,
          });
        }
      }
    }

    if (properties) {
      const obj = value as Record<string, unknown>;
      for (const [key, propSchema] of Object.entries(properties)) {
        if (obj[key] !== undefined) {
          const propErrors = validateBodyAgainstSchema(obj[key], propSchema, `${path}.${key}`);
          errors.push(...propErrors);
        }
      }
    }
  } else if (expectedType === 'array' && actualType !== 'array') {
    errors.push({
      field: path,
      message: `Expected array but got ${actualType}`,
    });
  } else if (
    expectedType !== 'object' &&
    expectedType !== 'array' &&
    actualType !== expectedType
  ) {
    // Basic type mismatch (string, number, integer, boolean)
    if (!(expectedType === 'integer' && actualType === 'number')) {
      errors.push({
        field: path,
        message: `Expected ${expectedType} but got ${actualType}`,
      });
    }
  }

  return errors;
}

function getJsonType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
