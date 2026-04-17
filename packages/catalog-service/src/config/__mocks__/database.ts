/**
 * Mock PostgreSQL pool for testing.
 * Simulates pool.query() using the in-memory data store.
 */
import {
  apiDefinitions,
  apiVersions,
  sunsetPlans,
  subscriptionPlans,
  subscriptionApis,
  consumers,
} from '../../data/store';

function matchesILike(value: string, pattern: string): boolean {
  const cleaned = pattern.replace(/%/g, '');
  return value.toLowerCase().includes(cleaned.toLowerCase());
}

const pool = {
  query: jest.fn(async (queryText: string, params?: unknown[]) => {
    const q = queryText.replace(/\s+/g, ' ').trim();

    // GET /v1/catalog/apis — list APIs
    if (q.includes('FROM api_definition ad') && q.includes('LEFT JOIN LATERAL')) {
      let filtered = [...apiDefinitions];

      if (params && params.length > 0) {
        let paramIdx = 0;

        // search filter (ILIKE on name or description)
        if (q.includes('ad.name ILIKE') || q.includes('ad.description ILIKE')) {
          const searchTerm = params[paramIdx] as string;
          filtered = filtered.filter(
            (ad) =>
              matchesILike(ad.name, searchTerm) ||
              matchesILike(ad.description, searchTerm)
          );
          paramIdx++;
        }

        // category filter
        if (q.includes('ad.category =')) {
          const cat = params[paramIdx] as string;
          filtered = filtered.filter((ad) => ad.category === cat);
          paramIdx++;
        }

        // status filter
        if (q.includes('ad.status =')) {
          const st = params[paramIdx] as string;
          filtered = filtered.filter((ad) => ad.status === st);
          paramIdx++;
        }
      }

      const rows = filtered.map((ad) => {
        const latestVersion = apiVersions
          .filter((v) => v.api_definition_id === ad.id)
          .sort((a, b) => b.published_at.localeCompare(a.published_at))[0];

        const sunset = latestVersion
          ? sunsetPlans.find((sp) => sp.api_version_id === latestVersion.id)
          : undefined;

        return {
          id: ad.id,
          name: ad.name,
          description: ad.description,
          category: ad.category,
          status: ad.status,
          version_tag: latestVersion?.version_tag || null,
          sunset_date: sunset?.sunset_date || null,
        };
      });

      return { rows };
    }

    // SELECT id FROM api_definition WHERE id = $1 — check existence (admin routes)
    // Must be checked BEFORE the general detail query
    if (q.includes('SELECT id FROM api_definition WHERE id =')) {
      const id = params?.[0] as string;
      const def = apiDefinitions.find((d) => d.id === id);
      if (def) return { rows: [{ id: def.id }] };
      if (id?.startsWith('api-test-')) return { rows: [{ id }] };
      return { rows: [] };
    }

    // GET /v1/catalog/apis/:id — definition detail
    if (
      q.includes('FROM api_definition WHERE id =') &&
      !q.includes('api_version')
    ) {
      const id = params?.[0] as string;
      const def = apiDefinitions.find((d) => d.id === id);
      return { rows: def ? [def] : [] };
    }

    // versions for a definition
    if (
      q.includes('FROM api_version') &&
      q.includes('WHERE api_definition_id =') &&
      !q.includes("status = 'active'")
    ) {
      const defId = params?.[0] as string;
      const versions = apiVersions
        .filter((v) => v.api_definition_id === defId)
        .sort((a, b) => b.published_at.localeCompare(a.published_at));
      return { rows: versions };
    }

    // sunset plan for a definition
    if (q.includes('FROM sunset_plan sp') && q.includes('JOIN api_version av')) {
      const defId = params?.[0] as string;
      const defVersions = apiVersions.filter(
        (v) => v.api_definition_id === defId
      );
      for (const v of defVersions) {
        const sp = sunsetPlans.find((s) => s.api_version_id === v.id);
        if (sp) {
          return { rows: [sp] };
        }
      }
      return { rows: [] };
    }

    // active version spec for docs/snippets
    if (
      q.includes('FROM api_version') &&
      q.includes("status = 'active'") &&
      q.includes('openapi_spec')
    ) {
      const defId = params?.[0] as string;
      const version = apiVersions.find(
        (v) => v.api_definition_id === defId && v.status === 'active'
      );
      return { rows: version ? [version] : [] };
    }

    // INSERT INTO api_definition — admin create API
    if (q.includes('INSERT INTO api_definition')) {
      const [name, description, category] = (params || []) as string[];
      const newId = `api-test-${Date.now()}`;
      const now = new Date().toISOString();
      return {
        rows: [{
          id: newId,
          name,
          description: description || '',
          category,
          status: 'active',
          created_at: now,
        }],
      };
    }

    // INSERT INTO api_version — admin create version
    if (q.includes('INSERT INTO api_version')) {
      const [apiDefId, versionTag, , fmt] = (params || []) as string[];
      const newId = `ver-test-${Date.now()}`;
      const now = new Date().toISOString();
      return {
        rows: [{
          id: newId,
          api_definition_id: apiDefId,
          version_tag: versionTag,
          format: fmt,
          status: 'active',
          published_at: now,
        }],
      };
    }

    // Fallback
    return { rows: [] };
  }),

  end: jest.fn(),

  on: jest.fn(),
};

export default pool;
