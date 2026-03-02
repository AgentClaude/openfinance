import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  CheckIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { GET_NOTIFICATIONS } from '@/graphql/queries';
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ } from '@/graphql/mutations';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Notification } from '@/types';

const typeConfig: Record<string, { icon: string; label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  budget_alert: { icon: '💰', label: 'Budget', variant: 'warning' },
  transaction_alert: { icon: '📋', label: 'Transaction', variant: 'info' },
  large_transaction: { icon: '💸', label: 'Large Transaction', variant: 'warning' },
  goal_progress: { icon: '🎯', label: 'Goal', variant: 'success' },
  sync_error: { icon: '⚠️', label: 'Sync Error', variant: 'danger' },
  low_balance: { icon: '🏦', label: 'Low Balance', variant: 'warning' },
  security_alert: { icon: '🔒', label: 'Security', variant: 'danger' },
  system_update: { icon: '🔔', label: 'System', variant: 'default' },
  account_connection: { icon: '🔗', label: 'Account', variant: 'info' },
};

type FilterType = 'all' | 'unread' | string;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');

  const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 100 },
  });

  const [markRead] = useMutation(MARK_NOTIFICATION_READ, { onCompleted: () => refetch() });
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, { onCompleted: () => refetch() });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount: number = data?.unreadNotificationCount || 0;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter !== 'all') return n.notificationType === filter;
    return true;
  });

  // Get unique notification types for filter
  const types = [...new Set(notifications.map((n) => n.notificationType))];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => markAllRead()}>
              <CheckIcon className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" count={notifications.length} />
        <FilterChip active={filter === 'unread'} onClick={() => setFilter('unread')} label="Unread" count={unreadCount} />
        {types.map((type) => {
          const config = typeConfig[type];
          const count = notifications.filter((n) => n.notificationType === type).length;
          return (
            <FilterChip
              key={type}
              active={filter === type}
              onClick={() => setFilter(type)}
              label={config?.label || type}
              count={count}
            />
          );
        })}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          description={filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here when something needs your attention.'}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {filtered.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={(id) => markRead({ variables: { id } })}
              onMarkUnread={(id) => markRead({ variables: { id, read: false } })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

const FilterChip: React.FC<FilterChipProps> = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
      active
        ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
    }`}
  >
    {label}
    <span className={`text-xs ${active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`}>
      {count}
    </span>
  </button>
);

interface NotificationRowProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
}

const NotificationRow: React.FC<NotificationRowProps> = ({ notification, onMarkRead, onMarkUnread }) => {
  const config = typeConfig[notification.notificationType] || { icon: '🔔', label: notification.notificationType, variant: 'default' as const };

  return (
    <div
      className={`flex items-start gap-4 px-5 py-4 transition-colors ${
        !notification.isRead
          ? 'bg-brand-50/50 dark:bg-brand-900/10'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
      }`}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
            {notification.title}
          </span>
          <Badge variant={config.variant} size="sm">{config.label}</Badge>
          {!notification.isRead && (
            <span className="flex-shrink-0 w-2 h-2 bg-brand-500 rounded-full" />
          )}
        </div>
        {notification.body && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notification.body}</p>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
          {formatDate(notification.createdAt)}
        </span>
      </div>
      <div className="flex-shrink-0">
        {notification.isRead ? (
          <button
            onClick={() => onMarkUnread(notification.id)}
            className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
            title="Mark as unread"
          >
            <BellIcon className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
            title="Mark as read"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
