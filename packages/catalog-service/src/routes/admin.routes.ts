import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/database';
import { authJwt, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

const router = Router();

const createApiSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().default(''),
  category: z.string().min(1, 'Category is required').max(100),
});

const createVersionSchema = z.object({
  versionTag: z.string().min(1, 'Version tag is required').max(50),
  openapiSpec: z.string().min(1, 'OpenAPI spec is required'),
  format: z.enum(['json', 'yaml']),
});

/**
 * POST /v1/admin/apis
 * Create a new API definition (admin only).
 */
router.post(
  '/v1/admin/apis',
  authJwt,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createApiSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid request body',
          parsed.error.flatten().fieldErrors
        );
      }

      const { name, description, category } = parsed.data;

      const result = await pool.query(
        `INSERT INTO api_definition (name, description, category)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, category, status::text, created_at`,
        [name, description, category]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /v1/admin/apis/:id/versions
 * Create a new API version with OpenAPI spec (admin only).
 */
router.post(
  '/v1/admin/apis/:id/versions',
  authJwt,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Verify the API definition exists
      const defResult = await pool.query(
        `SELECT id FROM api_definition WHERE id = $1`,
        [id]
      );

      if (defResult.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'API definition not found');
      }

      const parsed = createVersionSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid request body',
          parsed.error.flatten().fieldErrors
        );
      }

      const { versionTag, openapiSpec, format } = parsed.data;

      // Basic validation: parse the spec and check required fields
      let parsedSpec: Record<string, unknown>;
      try {
        if (format === 'yaml') {
          const yaml = await import('js-yaml');
          parsedSpec = yaml.load(openapiSpec) as Record<string, unknown>;
        } else {
          parsedSpec = JSON.parse(openapiSpec);
        }
      } catch {
        throw new AppError(
          400,
          'INVALID_SPEC',
          'Could not parse the OpenAPI spec'
        );
      }

      if (!parsedSpec.openapi) {
        throw new AppError(
          400,
          'INVALID_SPEC',
          'Spec must contain an "openapi" field'
        );
      }
      if (!parsedSpec.info) {
        throw new AppError(
          400,
          'INVALID_SPEC',
          'Spec must contain an "info" field'
        );
      }
      if (!parsedSpec.paths) {
        throw new AppError(
          400,
          'INVALID_SPEC',
          'Spec must contain a "paths" field'
        );
      }

      // Store spec as JSON string regardless of input format
      const specToStore =
        format === 'yaml' ? JSON.stringify(parsedSpec) : openapiSpec;

      const result = await pool.query(
        `INSERT INTO api_version (api_definition_id, version_tag, openapi_spec, format, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING id, api_definition_id, version_tag, format, status::text, published_at`,
        [id, versionTag, specToStore, format]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
