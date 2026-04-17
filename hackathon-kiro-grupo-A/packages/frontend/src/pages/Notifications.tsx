import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, GitBranch, Wrench, AlertTriangle, Info, CircleDot } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SbTabs, SbAlert } from '../components/ui';
import api from '../lib/api';

/* ── Types ── */
interface Notification {
  id: string;
  type: 'version' | 'maintenance' | 'quota' | 'sunset' | 'info';
  title: string;
  message: string;
  priority: 'normal' | 'high' | 'urgent';
  read: boolean;
  createdAt: string;
}

/* ── Mock data ── */
const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'version', title: 'Nueva versión disponible', message: 'Cotización Autos v2.2 ya está disponible en el catálogo.', priority: 'normal', read: false, createdAt: '2026-04-17T10:30:00' },
  { id: '2', type: 'maintenance', title: 'Mantenimiento programado', message: 'Póliza Salud tendrá mantenimiento el 25 de Abril 2026 de 2:00 a 4:00 AM.', priority: 'normal', read: false, createdAt: '2026-04-16T14:00:00' },
  { id: '3', type: 'quota', title: 'Cuota al 80%', message: 'Tu cuota de consumo está al 80% del límite mensual. Considera optimizar tus llamadas.', priority: 'high', read: false, createdAt: '2026-04-15T09:15:00' },
  { id: '4', type: 'sunset', title: 'Versión será retirada', message: 'Consulta Siniestros v1.0 será retirada el 15 de Julio 2026. Migra a la nueva versión.', priority: 'urgent', read: true, createdAt: '2026-04-10T11:00:00' },
  { id: '5', type: 'info', title: 'Bienvenido a Conecta 2.0', message: 'Explora el catálogo de APIs y comienza a integrar tus aplicaciones.', priority: 'normal', read: true, createdAt: '2026-04-01T08:00:00' },
];

function mapNotificationType(type: string): Notification['type'] {
  const map: Record<string, Notification['type']> = {
    new_version: 'version',
    maintenance: 'maintenance',
    quota_warning: 'quota',
    quota_exhausted: 'quota',
    sunset: 'sunset',
    general: 'info',
  };
  return map[type] || 'info';
}

function mapPriority(priority: string): Notification['priority'] {
  const map: Record<string, Notification['priority']> = {
    low: 'normal',
    medium: 'normal',
    high: 'high',
    urgent: 'urgent',
  };
  return map[priority] || 'normal';
}

async function fetchNotifications(): Promise<Notification[]> {
  try {
    const response = await api.get('/v1/notifications');
    return response.data.map((n: Record<string, unknown>) => ({
      id: n.id,
      type: mapNotificationType(n.type as string),
      title: n.title,
      message: n.message,
      priority: mapPriority(n.priority as string),
      read: n.read,
      createdAt: (n.created_at || n.createdAt) as string,
    }));
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

/* ── Helpers ── */
const TYPE_ICONS: Record<string, { icon: LucideIcon; className: string }> = {
  version: { icon: GitBranch, className: 'text-blue-600 bg-blue-50' },
  maintenance: { icon: Wrench, className: 'text-yellow-600 bg-yellow-50' },
  quota: { icon: AlertTriangle, className: 'text-orange-600 bg-orange-50' },
  sunset: { icon: AlertTriangle, className: 'text-red-600 bg-red-50' },
  info: { icon: Info, className: 'text-gray-600 bg-gray-100' },
};

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'bg-gray-100 text-gray-600' },
  high: { label: 'Alta', className: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgente', className: 'bg-red-100 text-red-700' },
};

type FilterTab = 'all' | 'unread';
const FILTER_KEYS: FilterTab[] = ['all', 'unread'];

/* ── Notification list content ── */
function NotificationList({
  displayed,
  markAsRead,
}: {
  displayed: (Notification & { read: boolean })[];
  markAsRead: (id: string) => void;
}) {
  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16">
        <Bell className="h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-400">No hay notificaciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayed.map((n) => {
        const typeConfig = TYPE_ICONS[n.type] ?? { icon: Info, className: 'text-gray-600 bg-gray-100' };
        const Icon = typeConfig.icon;
        const priorityCfg = PRIORITY_BADGE[n.priority] ?? { label: n.priority, className: 'bg-gray-100 text-gray-600' };

        const notificationButton = (
          <button
            key={n.id}
            type="button"
            onClick={() => markAsRead(n.id)}
            className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors ${
              n.read
                ? 'border-gray-100 bg-white'
                : 'border-[var(--sb-ui-color-primary-L400)] bg-[var(--sb-ui-color-primary-L400)]/30'
            } hover:bg-gray-50`}
          >
            {/* Icon */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeConfig.className}`}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {!n.read && <CircleDot className="h-3 w-3 shrink-0 text-[var(--sb-ui-color-primary-base)]" />}
                <h3 className={`text-sm ${n.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
                  {n.title}
                </h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityCfg.className}`}>
                  {priorityCfg.label}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{n.message}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(n.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </button>
        );

        if (n.priority === 'urgent') {
          return (
            <SbAlert variant="error" key={n.id}>
              {notificationButton}
            </SbAlert>
          );
        }

        return notificationButton;
      })}
    </div>
  );
}

/* ── Component ── */
export default function Notifications() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const { data: notifications = [] } = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });

  const enriched = useMemo(
    () => notifications.map((n) => ({ ...n, read: n.read || readIds.has(n.id) })),
    [notifications, readIds],
  );

  const unreadCount = enriched.filter((n) => !n.read).length;

  const displayed = useMemo(
    () => (filter === 'unread' ? enriched.filter((n) => !n.read) : enriched),
    [enriched, filter],
  );

  const markAsRead = (id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
    api.put(`/v1/notifications/${id}/read`).catch(() => {
      // Silently fail — local state already updated
    });
  };

  const activeFilterIndex = FILTER_KEYS.indexOf(filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        {unreadCount > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </div>

      {/* SbTabs replaces manual filter tabs */}
      <SbTabs
        activeTab={activeFilterIndex}
        onTabChange={(index) => { const key = FILTER_KEYS[index]; if (key !== undefined) setFilter(key); }}
        tabs={['Todas', 'No leídas']}
      >
        {/* Panel for "Todas" */}
        <NotificationList displayed={displayed} markAsRead={markAsRead} />
        {/* Panel for "No leídas" */}
        <NotificationList displayed={displayed} markAsRead={markAsRead} />
      </SbTabs>
    </div>
  );
}
