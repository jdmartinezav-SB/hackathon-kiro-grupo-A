/**
 * Internal model types for the OpenAPI Parser.
 *
 * The InternalApiDefinition preserves the complete raw OpenAPI object
 * to guarantee round-trip fidelity (Property 1 — design doc).
 */

/** Structured contact info extracted from OpenAPI info.contact */
export interface ApiContact {
  name?: string;
  url?: string;
  email?: string;
}

/** Structured info block extracted from OpenAPI info */
export interface ApiInfo {
  title: string;
  description?: string;
  version: string;
  contact?: ApiContact;
}

/** A single server entry from the OpenAPI servers array */
export interface ApiServer {
  url: string;
  description?: string;
  variables?: Record<string, unknown>;
}

/** A parsed endpoint extracted from paths for convenience queries */
export interface ParsedEndpoint {
  method: string;
  path: string;
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: unknown[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  tags?: string[];
}

/** Endpoints grouped by resource (first path segment) */
export interface ResourceGroup {
  resource: string;
  endpoints: ParsedEndpoint[];
}

/**
 * The internal API definition model.
 *
 * `raw` holds the complete parsed OpenAPI object so the Pretty-Printer
 * can serialise it back without data loss (round-trip property).
 */
export interface InternalApiDefinition {
  openapi: string;
  info: ApiInfo;
  servers: ApiServer[];
  paths: ResourceGroup[];
  schemas: Record<string, unknown>;
  /** Complete raw OpenAPI object — source of truth for round-trip */
  raw: Record<string, unknown>;
}

/** A single parse error with approximate location */
export interface ParseError {
  line: number;
  field: string;
  message: string;
}

/** Result returned by the parse() function */
export interface ParseResult {
  success: boolean;
  model?: InternalApiDefinition;
  errors?: ParseError[];
}
