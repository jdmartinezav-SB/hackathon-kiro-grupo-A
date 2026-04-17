import { Router, Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { authJwt } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { generateSnippet } from '../snippets/generator';

const router = Router();

const SUPPORTED_SNIPPET_LANGS = ['curl', 'javascript', 'python', 'java'];

/**
 * GET /v1/catalog/apis
 * List all API definitions with latest version and sunset info.
 * Query params: search, category, status
 */
router.get(
  '/v1/catalog/apis',
  authJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, category, status } = req.query;

      const conditions: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      if (search && typeof search === 'string' && search.trim()) {
        conditions.push(
          `(ad.name ILIKE $${paramIndex} OR ad.description ILIKE $${paramIndex})`
        );
        params.push(`%${search.trim()}%`);
        paramIndex++;
      }

      if (category && typeof category === 'string' && category.trim()) {
        conditions.push(`ad.category = $${paramIndex}`);
        params.push(category.trim());
        paramIndex++;
      }

      if (status && typeof status === 'string' && status.trim()) {
        conditions.push(`ad.status = $${paramIndex}`);
        params.push(status.trim());
        paramIndex++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT
          ad.id,
          ad.name,
          ad.description,
          ad.category,
          ad.status::text,
          lv.version_tag,
          sp.sunset_date
        FROM api_definition ad
        LEFT JOIN LATERAL (
          SELECT av.version_tag, av.id AS version_id
          FROM api_version av
          WHERE av.api_definition_id = ad.id
          ORDER BY av.published_at DESC
          LIMIT 1
        ) lv ON true
        LEFT JOIN sunset_plan sp ON sp.api_version_id = lv.version_id
        ${whereClause}
        ORDER BY ad.name ASC
      `;

      const result = await pool.query(query, params);

      const apis = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        version: row.version_tag || null,
        status: row.status,
        category: row.category,
        sunsetDate: row.sunset_date
          ? new Date(row.sunset_date).toISOString().split('T')[0]
          : null,
      }));

      res.json(apis);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /v1/catalog/apis/:id
 * Get API definition detail with versions and sunset info.
 */
router.get(
  '/v1/catalog/apis/:id',
  authJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const defResult = await pool.query(
        `SELECT id, name, description, category, status::text FROM api_definition WHERE id = $1`,
        [id]
      );

      if (defResult.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'API definition not found');
      }

      const definition = defResult.rows[0];

      const versionsResult = await pool.query(
        `SELECT id, version_tag, status::text, published_at
         FROM api_version
         WHERE api_definition_id = $1
         ORDER BY published_at DESC`,
        [id]
      );

      const versions = versionsResult.rows.map((row) => ({
        id: row.id,
        versionTag: row.version_tag,
        status: row.status,
        publishedAt: row.published_at,
      }));

      // Get sunset plan from the latest version that has one
      const sunsetResult = await pool.query(
        `SELECT sp.sunset_date, sp.migration_guide_url
         FROM sunset_plan sp
         JOIN api_version av ON av.id = sp.api_version_id
         WHERE av.api_definition_id = $1
         ORDER BY sp.created_at DESC
         LIMIT 1`,
        [id]
      );

      const sunset = sunsetResult.rows[0];

      res.json({
        id: definition.id,
        name: definition.name,
        description: definition.description,
        category: definition.category,
        status: definition.status,
        versions,
        sunsetDate: sunset?.sunset_date
          ? new Date(sunset.sunset_date).toISOString().split('T')[0]
          : null,
        migrationGuideUrl: sunset?.migration_guide_url || null,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /v1/catalog/apis/:id/docs
 * Parse the latest active OpenAPI spec and return structured docs.
 */
router.get(
  '/v1/catalog/apis/:id/docs',
  authJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const versionResult = await pool.query(
        `SELECT openapi_spec, format
         FROM api_version
         WHERE api_definition_id = $1 AND status = 'active'
         ORDER BY published_at DESC
         LIMIT 1`,
        [id]
      );

      if (versionResult.rows.length === 0) {
        throw new AppError(
          404,
          'NOT_FOUND',
          'No active version found for this API'
        );
      }

      const { openapi_spec, format } = versionResult.rows[0];

      let spec: Record<string, unknown>;
      if (format === 'yaml') {
        const yaml = await import('js-yaml');
        spec = yaml.load(openapi_spec) as Record<string, unknown>;
      } else {
        spec = JSON.parse(openapi_spec);
      }

      const info = spec.info as Record<string, string> | undefined;
      const paths = spec.paths as Record<
        string,
        Record<string, unknown>
      > | undefined;
      const components = spec.components as Record<
        string,
        unknown
      > | undefined;

      const endpoints: Array<{
        path: string;
        method: string;
        summary: string;
        parameters: unknown[];
        requestBody: unknown;
        responses: unknown;
      }> = [];

      if (paths) {
        for (const [pathKey, methods] of Object.entries(paths)) {
          for (const [method, details] of Object.entries(methods)) {
            const operation = details as Record<string, unknown>;
            endpoints.push({
              path: pathKey,
              method: method.toUpperCase(),
              summary: (operation.summary as string) || '',
              parameters: (operation.parameters as unknown[]) || [],
              requestBody: operation.requestBody || null,
              responses: operation.responses || {},
            });
          }
        }
      }

      res.json({
        title: info?.title || '',
        version: info?.version || '',
        description: info?.description || '',
        endpoints,
        schemas: (components as Record<string, unknown>)?.schemas || {},
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /v1/catalog/apis/:id/snippets/:lang
 * Generate code snippet for the first endpoint of the latest active version.
 */
router.get(
  '/v1/catalog/apis/:id/snippets/:lang',
  authJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const lang = req.params.lang as string;

      if (!SUPPORTED_SNIPPET_LANGS.includes(lang)) {
        throw new AppError(
          400,
          'UNSUPPORTED_LANGUAGE',
          `Supported languages: ${SUPPORTED_SNIPPET_LANGS.join(', ')}`
        );
      }

      const versionResult = await pool.query(
        `SELECT openapi_spec, format
         FROM api_version
         WHERE api_definition_id = $1 AND status = 'active'
         ORDER BY published_at DESC
         LIMIT 1`,
        [id]
      );

      if (versionResult.rows.length === 0) {
        throw new AppError(
          404,
          'NOT_FOUND',
          'No active version found for this API'
        );
      }

      const { openapi_spec, format } = versionResult.rows[0];

      let spec: Record<string, unknown>;
      if (format === 'yaml') {
        const yaml = await import('js-yaml');
        spec = yaml.load(openapi_spec) as Record<string, unknown>;
      } else {
        spec = JSON.parse(openapi_spec);
      }

      const paths = spec.paths as Record<
        string,
        Record<string, unknown>
      > | undefined;

      if (!paths || Object.keys(paths).length === 0) {
        throw new AppError(404, 'NO_ENDPOINTS', 'No endpoints found in spec');
      }

      // Take the first endpoint
      const firstPath = Object.keys(paths)[0];
      const methods = paths[firstPath];
      const firstMethod = Object.keys(methods)[0];
      const operation = methods[firstMethod] as Record<string, unknown>;

      // Extract example body from requestBody schema if present
      let exampleBody: object | undefined;
      const requestBody = operation.requestBody as Record<
        string,
        unknown
      > | undefined;
      if (requestBody) {
        const content = requestBody.content as Record<
          string,
          unknown
        > | undefined;
        const jsonContent = content?.['application/json'] as Record<
          string,
          unknown
        > | undefined;
        const schema = jsonContent?.schema as Record<
          string,
          unknown
        > | undefined;
        if (schema?.properties) {
          const props = schema.properties as Record<
            string,
            Record<string, unknown>
          >;
          exampleBody = buildExampleFromProperties(props);
        }
      }

      const snippet = generateSnippet(
        lang,
        firstMethod,
        firstPath,
        exampleBody
      );

      res.json({ language: lang, snippet });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Build a simple example object from OpenAPI schema properties.
 */
function buildExampleFromProperties(
  properties: Record<string, Record<string, unknown>>
): object {
  const example: Record<string, unknown> = {};

  for (const [key, prop] of Object.entries(properties)) {
    if (prop.enum && Array.isArray(prop.enum)) {
      example[key] = prop.enum[0];
    } else if (prop.type === 'string') {
      example[key] = prop.example || `example_${key}`;
    } else if (prop.type === 'integer' || prop.type === 'number') {
      example[key] = prop.example || 0;
    } else if (prop.type === 'boolean') {
      example[key] = true;
    } else if (prop.type === 'array') {
      example[key] = [];
    } else if (prop.type === 'object') {
      example[key] = {};
    }
  }

  return example;
}

export default router;
