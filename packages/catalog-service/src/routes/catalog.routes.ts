import { Router, Request, Response } from 'express';
import {
  apiDefinitions,
  apiVersions,
  sunsetPlans,
  subscriptionPlans,
  subscriptionApis,
  consumers,
} from '../data/store';
import { parse } from '../parser';
import { generateSnippet } from '../snippets';

const router = Router();

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface ApiSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  currentVersion: string | null;
  deprecationBadge: boolean;
  sunsetDate: string | null;
}

interface CatalogApiResponse {
  apis: ApiSummary[];
  total: number;
  filters: {
    profiles: string[];
    statuses: string[];
    categories: string[];
  };
}

// ---------------------------------------------------------------------------
// GET /v1/catalog/apis
// ---------------------------------------------------------------------------

router.get('/', (req: Request, res: Response): void => {
  const {
    profile,
    status,
    search,
    category,
    page: pageParam,
    pageSize: pageSizeParam,
  } = req.query;

  const consumerId = req.headers['x-consumer-id'] as string | undefined;

  const page = Math.max(1, parseInt(pageParam as string, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam as string, 10) || 20));

  let filtered = [...apiDefinitions];

  // --- Filter by business_profile ---
  if (typeof profile === 'string' && profile.trim().length > 0) {
    const profileLower = profile.toLowerCase();
    const matchingPlans = subscriptionPlans.filter((p) =>
      p.profiles.some((pr) => pr.toLowerCase() === profileLower),
    );
    const planIds = matchingPlans.map((p) => p.id);
    const allowedVersionIds = subscriptionApis
      .filter((sa) => planIds.includes(sa.plan_id))
      .map((sa) => sa.api_version_id);
    const allowedApiDefIds = apiVersions
      .filter((v) => allowedVersionIds.includes(v.id))
      .map((v) => v.api_definition_id);
    const uniqueApiDefIds = [...new Set(allowedApiDefIds)];
    filtered = filtered.filter((api) => uniqueApiDefIds.includes(api.id));
  }

  // --- Filter by consumer subscription plan ---
  if (typeof consumerId === 'string' && consumerId.trim().length > 0) {
    const consumer = consumers.find((c) => c.id === consumerId);
    if (consumer?.plan_id) {
      const allowedVersionIds = subscriptionApis
        .filter((sa) => sa.plan_id === consumer.plan_id)
        .map((sa) => sa.api_version_id);
      const allowedApiDefIds = apiVersions
        .filter((v) => allowedVersionIds.includes(v.id))
        .map((v) => v.api_definition_id);
      const uniqueApiDefIds = [...new Set(allowedApiDefIds)];
      filtered = filtered.filter((api) => uniqueApiDefIds.includes(api.id));
    }
  }

  // --- Filter by status ---
  if (typeof status === 'string' && status.trim().length > 0) {
    const statusLower = status.toLowerCase();
    filtered = filtered.filter((api) => api.status === statusLower);
  }

  // --- Text search on name/description ---
  if (typeof search === 'string' && search.trim().length > 0) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (api) =>
        api.name.toLowerCase().includes(searchLower) ||
        api.description.toLowerCase().includes(searchLower),
    );
  }

  // --- Filter by category ---
  if (typeof category === 'string' && category.trim().length > 0) {
    const categoryLower = category.toLowerCase();
    filtered = filtered.filter((api) => api.category.toLowerCase() === categoryLower);
  }

  // --- Build summaries with deprecation badge + sunset date ---
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const apis: ApiSummary[] = paginated.map((api) => {
    const latestVersion = apiVersions
      .filter((v) => v.api_definition_id === api.id)
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0];

    const isDeprecated = api.status === 'deprecated' || latestVersion?.status === 'deprecated';

    let sunsetDate: string | null = null;
    if (latestVersion) {
      const sunset = sunsetPlans.find((sp) => sp.api_version_id === latestVersion.id);
      if (sunset) {
        sunsetDate = sunset.sunset_date;
      }
    }

    return {
      id: api.id,
      name: api.name,
      description: api.description,
      category: api.category,
      status: api.status,
      currentVersion: latestVersion?.version_tag ?? null,
      deprecationBadge: isDeprecated,
      sunsetDate,
    };
  });

  // --- Build available filter values (from full dataset, not filtered) ---
  const allCategories = [...new Set(apiDefinitions.map((a) => a.category))];
  const allStatuses = [...new Set(apiDefinitions.map((a) => a.status))];
  const allProfiles = [...new Set(subscriptionPlans.flatMap((p) => p.profiles))];

  const response: CatalogApiResponse = {
    apis,
    total,
    filters: {
      profiles: allProfiles,
      statuses: allStatuses,
      categories: allCategories,
    },
  };

  res.status(200).json(response);
});

// ---------------------------------------------------------------------------
// GET /v1/catalog/apis/:id/docs
// ---------------------------------------------------------------------------

router.get('/:id/docs', (req: Request, res: Response): void => {
  const { id } = req.params;

  const apiDef = apiDefinitions.find((a) => a.id === id);
  if (!apiDef) {
    res.status(404).json({ error: 'API not found' });
    return;
  }

  const latestVersion = apiVersions
    .filter((v) => v.api_definition_id === id && v.status === 'active')
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0];

  if (!latestVersion) {
    res.status(404).json({ error: 'No active versions found for this API' });
    return;
  }

  const parseResult = parse(latestVersion.openapi_spec, latestVersion.format);
  if (!parseResult.success || !parseResult.model) {
    res.status(500).json({ error: 'Failed to parse OpenAPI spec', details: parseResult.errors });
    return;
  }

  const { model } = parseResult;

  res.status(200).json({
    apiId: apiDef.id,
    apiName: apiDef.name,
    version: latestVersion.version_tag,
    openapi: model.openapi,
    info: model.info,
    servers: model.servers,
    resources: model.paths,
    schemas: model.schemas,
  });
});

// ---------------------------------------------------------------------------
// GET /v1/catalog/apis/:id/snippets/:lang
// ---------------------------------------------------------------------------

const SUPPORTED_LANGUAGES = ['javascript', 'python', 'java', 'curl'] as const;
type SnippetLanguage = (typeof SUPPORTED_LANGUAGES)[number];

router.get('/:id/snippets/:lang', (req: Request, res: Response): void => {
  const { id, lang } = req.params;

  if (!SUPPORTED_LANGUAGES.includes(lang as SnippetLanguage)) {
    res.status(400).json({
      error: `Unsupported language: ${lang}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`,
    });
    return;
  }

  const apiDef = apiDefinitions.find((a) => a.id === id);
  if (!apiDef) {
    res.status(404).json({ error: 'API not found' });
    return;
  }

  const latestVersion = apiVersions
    .filter((v) => v.api_definition_id === id && v.status === 'active')
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0];

  if (!latestVersion) {
    res.status(404).json({ error: 'No active versions found for this API' });
    return;
  }

  const parseResult = parse(latestVersion.openapi_spec, latestVersion.format);
  if (!parseResult.success || !parseResult.model) {
    res.status(500).json({ error: 'Failed to parse OpenAPI spec', details: parseResult.errors });
    return;
  }

  const { model } = parseResult;
  const baseUrl = model.servers[0]?.url ?? '';

  const snippets = model.paths.flatMap((group) =>
    group.endpoints.map((ep) => ({
      endpoint: `${ep.method} ${ep.path}`,
      code: generateSnippet(ep, baseUrl, lang as SnippetLanguage),
    })),
  );

  res.status(200).json({
    apiId: apiDef.id,
    apiName: apiDef.name,
    version: latestVersion.version_tag,
    language: lang,
    snippets,
  });
});

// ---------------------------------------------------------------------------
// GET /v1/catalog/apis/:id
// ---------------------------------------------------------------------------

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;

  const apiDef = apiDefinitions.find((a) => a.id === id);
  if (!apiDef) {
    res.status(404).json({ error: 'API not found' });
    return;
  }

  const versions = apiVersions
    .filter((v) => v.api_definition_id === id)
    .map((v) => {
      const sunset = sunsetPlans.find((sp) => sp.api_version_id === v.id);
      return {
        id: v.id,
        version_tag: v.version_tag,
        status: v.status,
        format: v.format,
        published_at: v.published_at,
        ...(sunset && {
          sunsetPlan: {
            sunset_date: sunset.sunset_date,
            migration_guide_url: sunset.migration_guide_url,
            replacement_version_id: sunset.replacement_version_id,
          },
        }),
      };
    });

  res.status(200).json({
    id: apiDef.id,
    name: apiDef.name,
    description: apiDef.description,
    category: apiDef.category,
    status: apiDef.status,
    created_at: apiDef.created_at,
    updated_at: apiDef.updated_at,
    versions,
  });
});

export default router;
