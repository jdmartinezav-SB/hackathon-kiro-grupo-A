import * as yaml from 'js-yaml';
import {
  InternalApiDefinition,
  ParsedEndpoint,
  ParseError,
  ParseResult,
  ResourceGroup,
  ApiInfo,
  ApiServer,
} from './types';

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];

/**
 * Parse an OpenAPI definition (YAML or JSON string) into an InternalApiDefinition.
 *
 * The resulting model stores the complete raw object so the Pretty-Printer
 * can serialise it back without data loss (round-trip — Property 1).
 */
export function parse(content: string, format: 'yaml' | 'json'): ParseResult {
  let raw: Record<string, unknown>;

  try {
    raw = format === 'yaml'
      ? (yaml.load(content) as Record<string, unknown>)
      : (JSON.parse(content) as Record<string, unknown>);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const line = extractLineFromError(err);
    return {
      success: false,
      errors: [{ line, field: '', message: `Invalid ${format.toUpperCase()} syntax: ${message}` }],
    };
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      success: false,
      errors: [{ line: 1, field: '', message: 'Content must be a valid OpenAPI object' }],
    };
  }

  const model = buildModel(raw);
  return { success: true, model };
}

/** Build the InternalApiDefinition from a raw JS object. */
function buildModel(raw: Record<string, unknown>): InternalApiDefinition {
  return {
    openapi: String(raw['openapi'] ?? ''),
    info: extractInfo(raw['info']),
    servers: extractServers(raw['servers']),
    paths: extractPaths(raw['paths']),
    schemas: extractSchemas(raw['components']),
    raw,
  };
}

function extractInfo(info: unknown): ApiInfo {
  if (!info || typeof info !== 'object') {
    return { title: '', version: '' };
  }
  const obj = info as Record<string, unknown>;
  const contact = obj['contact'] && typeof obj['contact'] === 'object'
    ? {
        name: asOptionalString(obj['contact'], 'name'),
        url: asOptionalString(obj['contact'], 'url'),
        email: asOptionalString(obj['contact'], 'email'),
      }
    : undefined;

  return {
    title: String(obj['title'] ?? ''),
    description: asOptionalString(obj, 'description'),
    version: String(obj['version'] ?? ''),
    contact,
  };
}

function extractServers(servers: unknown): ApiServer[] {
  if (!Array.isArray(servers)) return [];
  return servers.map((s: unknown) => {
    if (!s || typeof s !== 'object') return { url: '' };
    const obj = s as Record<string, unknown>;
    return {
      url: String(obj['url'] ?? ''),
      description: asOptionalString(obj, 'description'),
      variables: obj['variables'] as Record<string, unknown> | undefined,
    };
  });
}

function extractPaths(paths: unknown): ResourceGroup[] {
  if (!paths || typeof paths !== 'object') return [];
  const obj = paths as Record<string, unknown>;
  const groupMap = new Map<string, ParsedEndpoint[]>();

  for (const [pathStr, pathItem] of Object.entries(obj)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    const ops = pathItem as Record<string, unknown>;
    const resource = deriveResource(pathStr);

    for (const method of HTTP_METHODS) {
      const operation = ops[method];
      if (!operation || typeof operation !== 'object') continue;
      const op = operation as Record<string, unknown>;

      const endpoint: ParsedEndpoint = {
        method: method.toUpperCase(),
        path: pathStr,
        summary: asOptionalString(op, 'summary'),
        description: asOptionalString(op, 'description'),
        operationId: asOptionalString(op, 'operationId'),
        parameters: mergeParameters(ops['parameters'], op['parameters']),
        requestBody: op['requestBody'] as unknown,
        responses: op['responses'] as Record<string, unknown> | undefined,
        tags: Array.isArray(op['tags']) ? (op['tags'] as string[]) : undefined,
      };

      const list = groupMap.get(resource) ?? [];
      list.push(endpoint);
      groupMap.set(resource, list);
    }
  }

  return Array.from(groupMap.entries()).map(([resource, endpoints]) => ({
    resource,
    endpoints,
  }));
}

function extractSchemas(components: unknown): Record<string, unknown> {
  if (!components || typeof components !== 'object') return {};
  const obj = components as Record<string, unknown>;
  const schemas = obj['schemas'];
  if (!schemas || typeof schemas !== 'object') return {};
  return schemas as Record<string, unknown>;
}

/** Derive a resource name from a path string (first meaningful segment). */
function deriveResource(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  // Skip version prefixes like v1, v2
  const first = segments[0];
  if (/^v\d+$/i.test(first) && segments.length > 1) {
    return `/${segments[1]}`;
  }
  return `/${first}`;
}

/** Merge path-level and operation-level parameters (operation wins on duplicates). */
function mergeParameters(pathParams: unknown, opParams: unknown): unknown[] | undefined {
  const pArr = Array.isArray(pathParams) ? pathParams : [];
  const oArr = Array.isArray(opParams) ? opParams : [];
  if (pArr.length === 0 && oArr.length === 0) return undefined;

  const merged = new Map<string, unknown>();
  for (const p of pArr) {
    const key = paramKey(p);
    if (key) merged.set(key, p);
  }
  for (const p of oArr) {
    const key = paramKey(p);
    if (key) merged.set(key, p);
    else merged.set(String(merged.size), p);
  }
  return Array.from(merged.values());
}

function paramKey(p: unknown): string | null {
  if (p && typeof p === 'object') {
    const obj = p as Record<string, unknown>;
    if (obj['name'] && obj['in']) return `${obj['in']}:${obj['name']}`;
  }
  return null;
}

/** Safely extract an optional string field from an object. */
function asOptionalString(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const val = (obj as Record<string, unknown>)[key];
  return typeof val === 'string' ? val : undefined;
}

/** Try to extract a line number from a YAML/JSON parse error. */
function extractLineFromError(err: unknown): number {
  if (err && typeof err === 'object' && 'mark' in err) {
    const mark = (err as Record<string, unknown>)['mark'];
    if (mark && typeof mark === 'object' && 'line' in mark) {
      return Number((mark as Record<string, unknown>)['line']) + 1;
    }
  }
  // JSON.parse errors sometimes include "at position X"
  if (err instanceof SyntaxError) {
    const match = err.message.match(/position\s+(\d+)/i);
    if (match) return 1; // approximate — JSON doesn't give line numbers natively
  }
  return 1;
}
