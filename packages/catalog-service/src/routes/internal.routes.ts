import { Router, Request, Response } from 'express';
import { apiVersions, apiDefinitions } from '../data/store';

const router = Router();

/**
 * GET /v1/internal/versions/:versionId/spec
 *
 * Internal endpoint (no auth) for service-to-service calls.
 * Returns the raw OpenAPI spec and metadata for a given api_version.
 */
router.get('/:versionId/spec', (req: Request, res: Response): void => {
  const { versionId } = req.params;

  const version = apiVersions.find((v) => v.id === versionId);
  if (!version) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }

  res.status(200).json({
    versionId: version.id,
    apiDefinitionId: version.api_definition_id,
    versionTag: version.version_tag,
    format: version.format,
    openapiSpec: version.openapi_spec,
  });
});

export default router;
