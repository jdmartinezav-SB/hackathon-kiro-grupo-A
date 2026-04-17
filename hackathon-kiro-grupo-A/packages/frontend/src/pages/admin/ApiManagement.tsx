import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Upload, CalendarClock, X } from 'lucide-react';

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

function fetchManagedApis(): Promise<ManagedApi[]> {
  return Promise.resolve(MOCK_MANAGED_APIS);
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

/* ── Modal wrapper ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
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
        <button
          type="button"
          onClick={() => setModal({ type: 'new-api' })}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Nueva API
        </button>
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
              <button
                type="button"
                onClick={() => setModal({ type: 'publish-version', apiId: api.id })}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload className="h-3.5 w-3.5" /> Publicar Versión
              </button>
              <button
                type="button"
                onClick={() => setModal({ type: 'sunset-plan', apiId: api.id })}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <CalendarClock className="h-3.5 w-3.5" /> Plan Sunset
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal?.type === 'new-api' && (
        <Modal title="Nueva API" onClose={closeModal}>
          <div className="space-y-3">
            <div>
              <label htmlFor="api-name" className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
              <input id="api-name" type="text" value={newApiName} onChange={(e) => setNewApiName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Nombre de la API" />
            </div>
            <div>
              <label htmlFor="api-desc" className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
              <input id="api-desc" type="text" value={newApiDesc} onChange={(e) => setNewApiDesc(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Descripción breve" />
            </div>
            <div>
              <label htmlFor="api-cat" className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
              <input id="api-cat" type="text" value={newApiCategory} onChange={(e) => setNewApiCategory(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej: Autos, Salud, General" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="button" onClick={closeModal} disabled={!newApiName.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Crear</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === 'publish-version' && (
        <Modal title="Publicar Versión" onClose={closeModal}>
          <div className="space-y-3">
            <div>
              <label htmlFor="spec-text" className="mb-1 block text-sm font-medium text-gray-700">OpenAPI Spec (YAML/JSON)</label>
              <textarea
                id="spec-text"
                rows={10}
                value={specText}
                onChange={(e) => setSpecText(e.target.value)}
                placeholder="Pega aquí la especificación OpenAPI…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="button" onClick={closeModal} disabled={!specText.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Publicar</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === 'sunset-plan' && (
        <Modal title="Plan Sunset" onClose={closeModal}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">La fecha de sunset debe ser al menos 90 días a partir de hoy.</p>
            <div>
              <label htmlFor="sunset-date" className="mb-1 block text-sm font-medium text-gray-700">Fecha de Sunset</label>
              <input
                id="sunset-date"
                type="date"
                min={minSunsetDate()}
                value={sunsetDate}
                onChange={(e) => setSunsetDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="button" onClick={closeModal} disabled={!sunsetDate} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Programar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
