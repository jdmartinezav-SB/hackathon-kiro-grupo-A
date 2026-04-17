import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tag, AlertTriangle } from 'lucide-react';
import { SbInput, SbSelect, SbAlert } from '../components/ui';
import api from '../lib/api';

interface ApiItem {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'deprecated' | 'maintenance';
  category: string;
  sunsetDate?: string;
}

const MOCK_APIS: ApiItem[] = [
  { id: '1', name: 'Cotización Autos', description: 'API para cotizar seguros de vehículos', version: 'v2.1', status: 'active', category: 'Autos' },
  { id: '2', name: 'Póliza Salud', description: 'Gestión de pólizas de salud', version: 'v1.3', status: 'active', category: 'Salud' },
  { id: '3', name: 'Consulta Siniestros', description: 'Consulta y seguimiento de siniestros', version: 'v1.0', status: 'deprecated', category: 'General', sunsetDate: '2026-07-15' },
  { id: '4', name: 'Emisión Vida', description: 'Emisión de pólizas de vida', version: 'v3.0', status: 'active', category: 'Vida' },
  { id: '5', name: 'Recaudo Primas', description: 'Gestión de recaudo de primas', version: 'v1.2', status: 'maintenance', category: 'General' },
];

async function fetchCatalogApis(): Promise<ApiItem[]> {
  try {
    const response = await api.get('/v1/catalog/apis');
    return response.data;
  } catch {
    return MOCK_APIS;
  }
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Activa', className: 'bg-green-100 text-green-700' },
  maintenance: { label: 'Mantenimiento', className: 'bg-yellow-100 text-yellow-700' },
  deprecated: { label: 'Deprecada', className: 'bg-red-100 text-red-700' },
};

function ApiCard({ api }: { api: ApiItem }) {
  const navigate = useNavigate();
  const statusCfg = STATUS_CONFIG[api.status] ?? { label: api.status, className: 'bg-gray-100 text-gray-700' };

  return (
    <button
      type="button"
      onClick={() => navigate(`/catalog/${api.id}`)}
      className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900">{api.name}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
          {statusCfg.label}
        </span>
      </div>

      <p className="text-sm text-gray-500 line-clamp-2">{api.description}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-[var(--sb-ui-color-primary-L400)] px-2 py-0.5 text-xs font-medium text-[var(--sb-ui-color-primary-D100)]">
          {api.version}
        </span>
        <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          <Tag className="h-3 w-3" />
          {api.category}
        </span>
      </div>

      {api.status === 'deprecated' && api.sunsetDate && (
        <SbAlert variant="warning">
          <div className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Sunset: {new Date(api.sunsetDate).toLocaleDateString('es-CO')}
          </div>
        </SbAlert>
      )}
    </button>
  );
}

export default function Catalog() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: apis = [] } = useQuery({
    queryKey: ['catalog-apis'],
    queryFn: fetchCatalogApis,
  });

  const categories = useMemo(() => [...new Set(apis.map((a) => a.category))], [apis]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return apis.filter((api) => {
      if (q && !api.name.toLowerCase().includes(q) && !api.description.toLowerCase().includes(q)) return false;
      if (categoryFilter && api.category !== categoryFilter) return false;
      if (statusFilter && api.status !== statusFilter) return false;
      return true;
    });
  }, [apis, search, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Catálogo de APIs</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr]">
        <SbInput
          type="text"
          placeholder="Buscar por nombre o descripción…"
          value={search}
          onChange={(val) => setSearch(val)}
          data-testid="catalog-search"
        />

        <SbSelect
          value={categoryFilter}
          onChange={(val) => setCategoryFilter(val)}
          data-testid="catalog-category-filter"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </SbSelect>

        <SbSelect
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activa</option>
          <option value="maintenance">Mantenimiento</option>
          <option value="deprecated">Deprecada</option>
        </SbSelect>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">No se encontraron APIs con esos filtros.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((api) => (
            <ApiCard key={api.id} api={api} />
          ))}
        </div>
      )}
    </div>
  );
}
