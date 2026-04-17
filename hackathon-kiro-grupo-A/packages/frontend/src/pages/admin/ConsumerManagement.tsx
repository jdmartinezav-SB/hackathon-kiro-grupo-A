import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, CheckCircle, Pause, XOctagon, X } from 'lucide-react';

/* ── Types ── */
interface Consumer {
  id: string;
  company: string;
  email: string;
  status: 'active' | 'suspended' | 'revoked';
  appsCount: number;
  registeredAt: string;
}

type ActionType = 'approve' | 'suspend' | 'revoke';

/* ── Mock data ── */
const MOCK_CONSUMERS: Consumer[] = [
  { id: '1', company: 'Aseguradora Andina', email: 'admin@andina.co', status: 'active', appsCount: 3, registeredAt: '2025-11-10' },
  { id: '2', company: 'Broker Seguros Plus', email: 'tech@segurosplus.com', status: 'active', appsCount: 1, registeredAt: '2026-01-05' },
  { id: '3', company: 'FinTech Protección', email: 'dev@fintechpro.co', status: 'suspended', appsCount: 2, registeredAt: '2025-09-22' },
  { id: '4', company: 'Salud Digital SAS', email: 'api@saluddigital.co', status: 'active', appsCount: 4, registeredAt: '2026-02-14' },
  { id: '5', company: 'Auto Insure Corp', email: 'soporte@autoinsure.co', status: 'revoked', appsCount: 0, registeredAt: '2025-06-30' },
];

function fetchConsumers(): Promise<Consumer[]> {
  return Promise.resolve(MOCK_CONSUMERS);
}

/* ── Helpers ── */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-green-100 text-green-700' },
  suspended: { label: 'Suspendido', className: 'bg-yellow-100 text-yellow-700' },
  revoked: { label: 'Revocado', className: 'bg-red-100 text-red-700' },
};

const ACTION_CONFIG: Record<ActionType, { label: string; className: string; icon: typeof CheckCircle }> = {
  approve: { label: 'Aprobar', className: 'bg-green-600 hover:bg-green-700 text-white', icon: CheckCircle },
  suspend: { label: 'Suspender', className: 'bg-yellow-500 hover:bg-yellow-600 text-white', icon: Pause },
  revoke: { label: 'Revocar', className: 'bg-red-600 hover:bg-red-700 text-white', icon: XOctagon },
};

/* ── Confirmation Modal ── */
function ConfirmModal({ action, consumer, onConfirm, onCancel }: {
  action: ActionType;
  consumer: Consumer;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const cfg = ACTION_CONFIG[action];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{cfg.label} consumidor</h3>
          <button type="button" onClick={onCancel} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          ¿Estás seguro de <strong>{cfg.label.toLowerCase()}</strong> a <strong>{consumer.company}</strong>?
        </p>
        <div className="mb-4">
          <label htmlFor="action-reason" className="mb-1 block text-sm font-medium text-gray-700">Motivo</label>
          <textarea
            id="action-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe el motivo de esta acción…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${cfg.className}`}
          >
            {cfg.label}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function ConsumerManagement() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ action: ActionType; consumer: Consumer } | null>(null);

  const { data: consumers = [] } = useQuery({ queryKey: ['admin-consumers'], queryFn: fetchConsumers });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return consumers;
    return consumers.filter((c) =>
      c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [consumers, search]);

  const handleConfirm = (_reason: string) => {
    // In the future: call PUT /v1/admin/consumers/:id/status
    setModal(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestión de Consumidores</h1>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por empresa o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"># Apps</th>
              <th className="px-4 py-3">Fecha Registro</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => {
              const st = STATUS_CONFIG[c.status] ?? { label: c.status, className: 'bg-gray-100 text-gray-700' };
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.company}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.appsCount}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(c.registeredAt).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => setModal({ action: 'approve', consumer: c })} className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200">
                        Aprobar
                      </button>
                      <button type="button" onClick={() => setModal({ action: 'suspend', consumer: c })} className="rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200">
                        Suspender
                      </button>
                      <button type="button" onClick={() => setModal({ action: 'revoke', consumer: c })} className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200">
                        Revocar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <ConfirmModal
          action={modal.action}
          consumer={modal.consumer}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
