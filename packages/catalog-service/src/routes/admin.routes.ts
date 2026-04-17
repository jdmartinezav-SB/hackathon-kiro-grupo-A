import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { parse, validate } from '../parser';
import {
  apiDefinitions,
  apiVersions,
  ApiDefinitionRecord,
  ApiVersionRecord,
} from '../data/store';

const router = Router();

// ---------------------------------------------------------------------------
// Middleware: MVP admin role check (header-based)
// ---------------------------------------------------------------------------
function requireAdmin(req: Request, res: Response): boolean {
  const adminRole = req.headers['x-admin-role'];
  if (!adminRole) {
    res.status(403).json({ error: 'Forbidden: admin role required' });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// POST /v1/admin/apis — Create a new API definition
// ---------------------------------------------------------------------------
router.post('/', (req: Request, res: Response): void => {
  if (!requireAdmin(req, res)) return;

  const { name, description, category } = req.body;

  const missing: string[] = [];
  if (!name || typeof name !== 'string' || name.trim().length === 0) missing.push('name');
  if (!description || typeof description !== 'string' || description.trim().length === 0) missing.push('description');
  if (!category || typeof category !== 'string' || category.trim().length === 0) missing.push('category');

  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    return;
  }

  const now = new Date().toISOString();
  const newApi: ApiDefinitionRecord = {
    id: uuidv4(),
    name: name.trim(),
    description: description.trim(),
    category: category.trim(),
    status: 'active',
    created_at: now,
    updated_at: now,
  };

  apiDefinitions.push(newApi);
  res.status(201).json(newApi);
});


// ---------------------------------------------------------------------------
// POST /v1/admin/apis/:id/versions — Publish a new version for an API
// ---------------------------------------------------------------------------
router.post('/:id/versions', (req: Request, res: Response): void => {
  if (!requireAdmin(req, res)) return;

  const { id } = req.params;
  const { version_tag, openapi_spec, format: fmt } = req.body;

  // Check API exists
  const apiDef = apiDefinitions.find((a) => a.id === id);
  if (!apiDef) {
    res.status(404).json({ error: 'API definition not found' });
    return;
  }

  // Validate required fields
  const missing: string[] = [];
  if (!version_tag || typeof version_tag !== 'string' || version_tag.trim().length === 0) missing.push('version_tag');
  if (!openapi_spec || typeof openapi_spec !== 'string' || openapi_spec.trim().length === 0) missing.push('openapi_spec');
  if (!fmt || (fmt !== 'yaml' && fmt !== 'json')) missing.push('format');

  if (missing.length > 0) {
    res.status(400).json({ error: `Missing or invalid required fields: ${missing.join(', ')}` });
    return;
  }

  // Check duplicate version_tag
  const duplicate = apiVersions.find(
    (v) => v.api_definition_id === id && v.version_tag === version_tag.trim(),
  );
  if (duplicate) {
    res.status(409).json({ error: `Version tag "${version_tag}" already exists for this API` });
    return;
  }

  // Validate spec with parser
  const parseResult = parse(openapi_spec, fmt);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid OpenAPI spec',
      details: parseResult.errors,
    });
    return;
  }

  // Run structural validation on the raw object
  if (parseResult.model) {
    const validationErrors = validate(parseResult.model.raw);
    if (validationErrors.length > 0) {
      res.status(400).json({
        error: 'OpenAPI spec validation failed',
        details: validationErrors,
      });
      return;
    }
  }

  const newVersion: ApiVersionRecord = {
    id: uuidv4(),
    api_definition_id: id,
    version_tag: version_tag.trim(),
    openapi_spec,
    format: fmt,
    status: 'active',
    semantic_metadata: parseResult.model
      ? {
          title: parseResult.model.info.title,
          version: parseResult.model.info.version,
          endpointCount: parseResult.model.paths.reduce((sum, g) => sum + g.endpoints.length, 0),
        }
      : {},
    published_at: new Date().toISOString(),
  };

  apiVersions.push(newVersion);
  res.status(201).json(newVersion);
});

export default router;
