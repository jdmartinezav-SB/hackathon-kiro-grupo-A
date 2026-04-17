import { ParseError } from './types';

/**
 * Validate a raw OpenAPI object for required top-level fields (OpenAPI 3.x).
 *
 * Returns an empty array when the document is valid.
 * Each error includes an approximate line (1), the affected field, and a message.
 */
export function validate(raw: Record<string, unknown>): ParseError[] {
  const errors: ParseError[] = [];

  // openapi field
  if (!('openapi' in raw) || raw['openapi'] === undefined || raw['openapi'] === null) {
    errors.push({ line: 1, field: 'openapi', message: 'Missing required field "openapi"' });
  } else if (typeof raw['openapi'] !== 'string' || !raw['openapi'].startsWith('3.')) {
    errors.push({
      line: 1,
      field: 'openapi',
      message: 'Field "openapi" must be a string starting with "3." (OpenAPI 3.x only)',
    });
  }

  // info field
  if (!('info' in raw) || raw['info'] === undefined || raw['info'] === null) {
    errors.push({ line: 1, field: 'info', message: 'Missing required field "info"' });
  } else if (typeof raw['info'] !== 'object' || Array.isArray(raw['info'])) {
    errors.push({ line: 1, field: 'info', message: 'Field "info" must be an object' });
  } else {
    const info = raw['info'] as Record<string, unknown>;

    if (!info['title'] || typeof info['title'] !== 'string') {
      errors.push({ line: 1, field: 'info.title', message: 'Field "info.title" must be a non-empty string' });
    }

    if (!info['version'] || typeof info['version'] !== 'string') {
      errors.push({ line: 1, field: 'info.version', message: 'Field "info.version" must be a non-empty string' });
    }
  }

  // paths field
  if (!('paths' in raw) || raw['paths'] === undefined || raw['paths'] === null) {
    errors.push({ line: 1, field: 'paths', message: 'Missing required field "paths"' });
  } else if (typeof raw['paths'] !== 'object' || Array.isArray(raw['paths'])) {
    errors.push({ line: 1, field: 'paths', message: 'Field "paths" must be an object' });
  }

  return errors;
}
