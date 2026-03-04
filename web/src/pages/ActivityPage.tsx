import { useQuery } from '@apollo/client';
import { GET_ACTIVITY_FEED } from '@/graphql/queries';
import { Card } from '@/components/ui';
import { useState } from 'react';

interface ActivityEvent {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const ACTION_ICONS: Record<string, string> = {
  categorized: '🏷️',
  created: '➕',
  updated: '✏️',
  deleted: '🗑️',
  split: '✂️',
  invited: '📨',
  joined: '🎉',
  budget_set: '💰',
  budget_copied: '📋',
  budget_filled: '📊',
  goal_created: '🎯',
  goal_updated: '🎯',
  rule_created: '⚙️',
  rule_applied: '⚙️',
  recurring_detected: '🔄',
  marked_paid: '✅',
  transfer_linked: '🔗',
  account_added: '🏦',
  account_removed: '🏦',
};

const ACTION_COLORS: Record<string, string> = {
  categorized: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  created: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  updated: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  deleted: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  split: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  invited: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  joined: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  budget_set: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  budget_copied: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  budget_filled: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  goal_created: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  goal_updated: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  rule_created: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
  rule_applied: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
  recurring_detected: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  marked_paid: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  transfer_linked: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  account_added: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  account_removed: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function groupByDate(events: ActivityEvent[]): Map<string, ActivityEvent[]> {
  const groups = new Map<string, ActivityEvent[]>();
  for (const event of events) {
    const date = new Date(event.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(event);
  }
  return groups;
}

type FilterType = 'all' | 'transactions' | 'budget' | 'accounts' | 'goals' | 'members';

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Activity' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'budget', label: 'Budget' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'goals', label: 'Goals' },
  { value: 'members', label: 'Members' },
];

const FILTER_ACTIONS: Record<FilterType, string[] | null> = {
  all: null,
  transactions: ['categorized', 'created', 'updated', 'deleted', 'split', 'transfer_linked'],
  budget: ['budget_set', 'budget_copied', 'budget_filled'],
  accounts: ['account_added', 'account_removed', 'recurring_detected', 'marked_paid'],
  goals: ['goal_created', 'goal_updated'],
  members: ['invited', 'joined'],
};

export default function ActivityPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const { data, loading } = useQuery(GET_ACTIVITY_FEED, {
    variables: { limit: 100 },
    fetchPolicy: 'network-only',
  });

  const allEvents: ActivityEvent[] = data?.activityFeed || [];
  const events = filter === 'all'
    ? allEvents
    : allEvents.filter((e) => FILTER_ACTIONS[filter]?.includes(e.action));

  const grouped = groupByDate(events);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Feed</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            See what&apos;s happening in your household
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filter === f.value
                ? 'bg-brand-700 text-white dark:bg-brand-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700" />
          </div>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No activity yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Activity will appear here as you and your household members make changes.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateLabel, dateEvents]) => (
            <div key={dateLabel}>
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">
                {dateLabel}
              </h2>
              <Card>
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {dateEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        ACTION_COLORS[event.action] || 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        {ACTION_ICONS[event.action] || '📌'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          <span className="font-medium">{event.user.name || event.user.email}</span>
                          {' '}
                          {event.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {formatRelativeTime(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
