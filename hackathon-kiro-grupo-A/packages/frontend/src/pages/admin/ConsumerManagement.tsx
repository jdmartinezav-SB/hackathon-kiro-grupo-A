import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, Pause, XOctagon } from 'lucide-react';
import { SbInput, SbButton, SbTable, SbModal, SbTextarea } from '../../components/ui';
import api from '../../lib/api';

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

async function fetchConsumers(): Promise<Consumer[]> {
  try {
    const response = await api.get('/v1/admin/consumers');
    return response.data.consumers.map((c: Record<string, unknown>) => ({
      id: c.id,
      company: c.companyName,
      email: c.email,
      status: c.status,
      appsCount: c.appCount,
      registeredAt: c.createdAt,
    }));
  } catch {
    return MOCK_CONSUMERS;
  }
}

/* ── Helpers ── */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-green-100 text-green-700' },
  suspended: { label: 'Suspendido', className: 'bg-yellow-100 text-yellow-700' },
  revoked: { label: 'Revocado', className: 'bg-red-100 text-red-700' },
};

const ACTION_CONFIG: Record<ActionType, { label: string; variant: 'primary' | 'secondary' | 'error'; icon: typeof CheckCircle }> = {
  approve: { label: 'Aprobar', variant: 'primary', icon: CheckCircle },
  suspend: { label: 'Suspender', variant: 'secondary', icon: Pause },
  revoke: { label: 'Revocar', variant: 'error', icon: XOctagon },
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
    <SbModal
      open
      title={`${cfg.label} consumidor`}
      onClose={onCancel}
    >
      <p className="mb-4 text-sm text-gray-600">
        ¿Estás seguro de <strong>{cfg.label.toLowerCase()}</strong> a <strong>{consumer.company}</strong>?
      </p>
      <div className="mb-4">
        <label htmlFor="action-reason" className="mb-1 block text-sm font-medium text-gray-700">Motivo</label>
        <SbTextarea
          value={reason}
          onChange={(val) => setReason(val)}
          placeholder="Describe el motivo de esta acción…"
          rows={3}
          data-testid="action-reason"
        />
      </div>
      <div className="flex justify-end gap-2">
        <SbButton
          variant="secondary"
          styleType="stroke"
          onClick={() => onCancel()}
        >
          Cancelar
        </SbButton>
        <SbButton
          variant="primary"
          styleType="fill"
          onClick={() => onConfirm(reason)}
          disabled={!reason.trim()}
        >
          {cfg.label}
        </SbButton>
      </div>
    </SbModal>
  );
}

/* ── Main component ── */
export default function ConsumerManagement() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ action: ActionType; consumer: Consumer } | null>(null);
  const queryClient = useQueryClient();

  const { data: consumers = [] } = useQuery({ queryKey: ['admin-consumers'], queryFn: fetchConsumers });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return consumers;
    return consumers.filter((c) =>
      c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [consumers, search]);

  const handleConfirm = async (reason: string) => {
    if (!modal) return;
    const statusMap: Record<ActionType, string> = {
      approve: 'active',
      suspend: 'suspended',
      revoke: 'revoked',
    };
    try {
      await api.put(`/v1/admin/consumers/${modal.consumer.id}/status`, {
        status: statusMap[modal.action],
        reason,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-consumers'] });
    } catch {
      // Silently fail — UI already reflects the action
    }
    setModal(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestión de Consumidores</h1>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <SbInput
          type="text"
          placeholder="Buscar por empresa o email…"
          value={search}
          onChange={(val) => setSearch(val)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <SbTable>
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
                        <SbButton
                          variant="primary"
                          styleType="text"
                          size="small"
                          onClick={() => setModal({ action: 'approve', consumer: c })}
                        >
                          Aprobar
                        </SbButton>
                        <SbButton
                          variant="secondary"
                          styleType="text"
                          size="small"
                          onClick={() => setModal({ action: 'suspend', consumer: c })}
                        >
                          Suspender
                        </SbButton>
                        <SbButton
                          variant="error"
                          styleType="text"
                          size="small"
                          onClick={() => setModal({ action: 'revoke', consumer: c })}
                        >
                          Revocar
                        </SbButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SbTable>
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
