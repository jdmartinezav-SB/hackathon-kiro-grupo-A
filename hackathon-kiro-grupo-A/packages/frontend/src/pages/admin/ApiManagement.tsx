import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Upload, CalendarClock } from 'lucide-react';
import { SbButton, SbInput, SbTextarea, SbModal } from '../../components/ui';
import api from '../../lib/api';

/* ── Types ── */
interface ApiVersion {
  tag: string;
  status: 'active' | 'deprecated' | 'retired';
  publishedAt: string;
}

interface ManagedApi {
  id: string;
  name: string;
  description: string;
  category: string;
  versions: ApiVersion[];
}

type ModalType = 'new-api' | 'publish-version' | 'sunset-plan';

/* ── Mock data ── */
const MOCK_MANAGED_APIS: ManagedApi[] = [
  {
    id: '1', name: 'Cotización Autos', description: 'API para cotizar seguros de vehículos', category: 'Autos',
    versions: [
      { tag: 'v2.1', status: 'active', publishedAt: '2025-11-20' },
      { tag: 'v2.0', status: 'deprecated', publishedAt: '2025-01-15' },
    ],
  },
  {
    id: '2', name: 'Póliza Salud', description: 'Gestión de pólizas de salud', category: 'Salud',
    versions: [{ tag: 'v1.3', status: 'active', publishedAt: '2025-08-10' }],
  },
  {
    id: '3', name: 'Consulta Siniestros', description: 'Consulta y seguimiento de siniestros', category: 'General',
    versions: [{ tag: 'v1.0', status: 'deprecated', publishedAt: '2024-03-10' }],
  },
];

async function fetchManagedApis(): Promise<ManagedApi[]> {
  try {
    const response = await api.get('/v1/catalog/apis');
    const apis = await Promise.all(
      response.data.map(async (a: Record<string, unknown>) => {
        try {
          const detail = await api.get(`/v1/catalog/apis/${a.id}`);
          return {
            id: a.id,
            name: a.name,
            description: (a.description as string) || '',
            category: a.category,
            versions: ((detail.data.versions || []) as Record<string, unknown>[]).map((v) => ({
              tag: v.versionTag,
              status: v.status,
              publishedAt: v.publishedAt,
            })),
          };
        } catch {
          return {
            id: a.id,
            name: a.name,
            description: (a.description as string) || '',
            category: a.category,
            versions: [{ tag: a.version as string, status: 'active', publishedAt: new Date().toISOString() }],
          };
        }
      })
    );
    return apis;
  } catch {
    return MOCK_MANAGED_APIS;
  }
}

/* ── Helpers ── */
const VERSION_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: 'Activa', className: 'bg-green-100 text-green-700' },
  deprecated: { label: 'Deprecada', className: 'bg-yellow-100 text-yellow-700' },
  retired: { label: 'Retirada', className: 'bg-red-100 text-red-700' },
};

function minSunsetDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().split('T')[0] ?? '';
}

/* ── Main component ── */
export default function ApiManagement() {
  const [modal, setModal] = useState<{ type: ModalType; apiId?: string } | null>(null);
  const [newApiName, setNewApiName] = useState('');
  const [newApiDesc, setNewApiDesc] = useState('');
  const [newApiCategory, setNewApiCategory] = useState('');
  const [specText, setSpecText] = useState('');
  const [sunsetDate, setSunsetDate] = useState('');

  const { data: apis = [] } = useQuery({ queryKey: ['admin-apis'], queryFn: fetchManagedApis });

  const closeModal = () => {
    setModal(null);
    setNewApiName('');
    setNewApiDesc('');
    setNewApiCategory('');
    setSpecText('');
    setSunsetDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de APIs</h1>
        <SbButton
          variant="primary"
          styleType="fill"
          onClick={() => setModal({ type: 'new-api' })}
        >
          <Plus className="h-4 w-4" /> Nueva API
        </SbButton>
      </div>

      {/* API list */}
      <div className="space-y-4">
        {apis.map((api) => (
          <div key={api.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{api.name}</h2>
                <p className="text-sm text-gray-500">{api.description}</p>
              </div>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{api.category}</span>
            </div>

            {/* Versions */}
            <div className="mb-3 divide-y divide-gray-100 rounded-lg border border-gray-100">
              {api.versions.map((v) => {
                const vs = VERSION_STATUS[v.status] ?? { label: v.status, className: 'bg-gray-100 text-gray-700' };
                return (
                  <div key={v.tag} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{v.tag}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${vs.className}`}>{vs.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(v.publishedAt).toLocaleDateString('es-CO')}</span>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <SbButton
                variant="secondary"
                styleType="stroke"
                size="small"
                onClick={() => setModal({ type: 'publish-version', apiId: api.id })}
              >
                <Upload className="h-3.5 w-3.5" /> Publicar Versión
              </SbButton>
              <SbButton
                variant="secondary"
                styleType="stroke"
                size="small"
                onClick={() => setModal({ type: 'sunset-plan', apiId: api.id })}
              >
                <CalendarClock className="h-3.5 w-3.5" /> Plan Sunset
              </SbButton>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Nueva API */}
      {modal?.type === 'new-api' && (
        <SbModal open title="Nueva API" onClose={closeModal}>
          <div className="space-y-3">
            <div>
              <label htmlFor="api-name" className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
              <SbInput
                id="api-name"
                type="text"
                value={newApiName}
                onChange={(val) => setNewApiName(val)}
                placeholder="Nombre de la API"
              />
            </div>
            <div>
              <label htmlFor="api-desc" className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
              <SbInput
                id="api-desc"
                type="text"
                value={newApiDesc}
                onChange={(val) => setNewApiDesc(val)}
                placeholder="Descripción breve"
              />
            </div>
            <div>
              <label htmlFor="api-cat" className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
              <SbInput
                id="api-cat"
                type="text"
                value={newApiCategory}
                onChange={(val) => setNewApiCategory(val)}
                placeholder="Ej: Autos, Salud, General"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <SbButton
                variant="secondary"
                styleType="stroke"
                onClick={() => closeModal()}
              >
                Cancelar
              </SbButton>
              <SbButton
                variant="primary"
                styleType="fill"
                onClick={() => closeModal()}
                disabled={!newApiName.trim()}
              >
                Crear
              </SbButton>
            </div>
          </div>
        </SbModal>
      )}

      {/* Modal: Publicar Versión */}
      {modal?.type === 'publish-version' && (
        <SbModal open title="Publicar Versión" onClose={closeModal}>
          <div className="space-y-3">
            <div>
              <label htmlFor="spec-text" className="mb-1 block text-sm font-medium text-gray-700">OpenAPI Spec (YAML/JSON)</label>
              <SbTextarea
                value={specText}
                onChange={(val) => setSpecText(val)}
                placeholder="Pega aquí la especificación OpenAPI…"
                rows={10}
                data-testid="spec-text"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <SbButton
                variant="secondary"
                styleType="stroke"
                onClick={() => closeModal()}
              >
                Cancelar
              </SbButton>
              <SbButton
                variant="primary"
                styleType="fill"
                onClick={() => closeModal()}
                disabled={!specText.trim()}
              >
                Publicar
              </SbButton>
            </div>
          </div>
        </SbModal>
      )}

      {/* Modal: Plan Sunset */}
      {modal?.type === 'sunset-plan' && (
        <SbModal open title="Plan Sunset" onClose={closeModal}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">La fecha de sunset debe ser al menos 90 días a partir de hoy.</p>
            <div>
              <label htmlFor="sunset-date" className="mb-1 block text-sm font-medium text-gray-700">Fecha de Sunset</label>
              <SbInput
                id="sunset-date"
                type="date"
                value={sunsetDate}
                onChange={(val) => {
                  /* Enforce min sunset date (90 days from today) */
                  if (val >= minSunsetDate()) setSunsetDate(val);
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <SbButton
                variant="secondary"
                styleType="stroke"
                onClick={() => closeModal()}
              >
                Cancelar
              </SbButton>
              <SbButton
                variant="primary"
                styleType="fill"
                onClick={() => closeModal()}
                disabled={!sunsetDate}
              >
                Programar
              </SbButton>
            </div>
          </div>
        </SbModal>
      )}
    </div>
  );
}
