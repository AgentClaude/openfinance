import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { GET_NOTIFICATIONS } from '@/graphql/queries';
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ } from '@/graphql/mutations';
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

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 20 },
    pollInterval: 60000,
  });

  const [markRead] = useMutation(MARK_NOTIFICATION_READ, { onCompleted: () => refetch() });
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, { onCompleted: () => refetch() });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount: number = data?.unreadNotificationCount || 0;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-full"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-brand-700" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-gray-700 z-50 max-h-[480px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-xs text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-1"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markRead({ variables: { id: n.id } });
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700/50 flex gap-3 ${
                    !n.isRead ? 'bg-brand-50/50 dark:bg-brand-900/20' : ''
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {typeIcons[n.notificationType] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${!n.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 bg-brand-500 rounded-full" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">{timeAgo(n.createdAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => { setOpen(false); navigate('/notifications'); }}
            className="px-4 py-2.5 text-center text-sm font-medium text-brand-700 dark:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 rounded-b-lg"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
