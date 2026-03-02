import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  BellIcon,
  CheckIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { GET_NOTIFICATIONS } from '@/graphql/queries';
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ } from '@/graphql/mutations';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import type { Notification } from '@/types';

const typeIcons: Record<string, string> = {
  budget_alert: '💰',
  transaction_alert: '📋',
  large_transaction: '💸',
  goal_progress: '🎯',
  sync_error: '⚠️',
  low_balance: '🏦',
  security_alert: '🔒',
  system_update: '🔔',
  account_connection: '🔗',
};

const typeLabels: Record<string, string> = {
  budget_alert: 'Budget Alert',
  transaction_alert: 'Transaction',
  large_transaction: 'Large Transaction',
  goal_progress: 'Goal Progress',
  sync_error: 'Sync Error',
  low_balance: 'Low Balance',
  security_alert: 'Security',
  system_update: 'System',
  account_connection: 'Account',
};

const priorityVariant: Record<string, 'danger' | 'warning' | 'default'> = {
  high: 'danger',
  normal: 'warning',
  low: 'default',
};

type FilterType = 'all' | 'unread' | 'budget_alert' | 'large_transaction' | 'goal_progress' | 'sync_error' | 'low_balance';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  
  const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 100, unreadOnly: filter === 'unread' },
  });

  const [markRead] = useMutation(MARK_NOTIFICATION_READ, { onCompleted: () => refetch() });
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, { onCompleted: () => refetch() });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount: number = data?.unreadNotificationCount || 0;

  const filtered = filter === 'all' || filter === 'unread'
    ? notifications
    : notifications.filter(n => n.notificationType === filter);

  const filters: { id: FilterType; label: string; icon?: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'budget_alert', label: 'Budget', icon: '💰' },
    { id: 'large_transaction', label: 'Large Txn', icon: '💸' },
    { id: 'goal_progress', label: 'Goals', icon: '🎯' },
    { id: 'low_balance', label: 'Low Balance', icon: '🏦' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        actions={
          unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/50"
            >
              <CheckIcon className="h-4 w-4" />
              Mark all read
            </button>
          )
        }
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <FunnelIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              filter === f.id
                ? 'bg-brand-100 text-brand-800 font-medium dark:bg-brand-900/50 dark:text-brand-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {f.icon && <span className="mr-1">{f.icon}</span>}
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="h-12 w-12" />}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          description={filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here when budget alerts, large transactions, or other events occur.'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(notification => (
            <Card
              key={notification.id}
              className={`transition-all cursor-pointer hover:shadow-md ${
                !notification.isRead
                  ? 'border-l-4 border-l-brand-500 bg-brand-50/30 dark:bg-brand-900/10'
                  : 'opacity-75 hover:opacity-100'
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  markRead({ variables: { id: notification.id } });
                }
              }}
            >
              <div className="flex items-start gap-4 p-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">
                  {typeIcons[notification.notificationType] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <span className="flex-shrink-0 w-2.5 h-2.5 bg-brand-500 rounded-full animate-pulse" />
                    )}
                    <Badge variant={priorityVariant[notification.priority] || 'default'} className="text-xs ml-auto flex-shrink-0">
                      {notification.priority}
                    </Badge>
                  </div>
                  {notification.body && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {notification.body}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span>{formatDate(notification.createdAt)}</span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      {typeLabels[notification.notificationType] || notification.notificationType}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
