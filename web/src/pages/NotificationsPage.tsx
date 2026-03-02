import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  BellIcon,
  TrashIcon,
  CheckIcon,
  FunnelIcon,
  BoltIcon,
  Cog6ToothIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
// BellAlertIcon available if needed
import {
  GET_NOTIFICATIONS,
  GET_NOTIFICATION_RULES,
  GET_NOTIFICATION_PREFERENCES,
} from '@/graphql/queries';
import {
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
  DELETE_NOTIFICATION,
  CREATE_NOTIFICATION_RULE,
  UPDATE_NOTIFICATION_RULE,
  DELETE_NOTIFICATION_RULE,
  UPDATE_NOTIFICATION_PREFERENCE,
} from '@/graphql/mutations';

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
  transaction_alert: 'Transaction Alert',
  large_transaction: 'Large Transaction',
  goal_progress: 'Goal Progress',
  sync_error: 'Sync Error',
  low_balance: 'Low Balance',
  security_alert: 'Security Alert',
  system_update: 'System Update',
  account_connection: 'Account Connection',
};

const ruleTypeLabels: Record<string, string> = {
  budget_exceeded: 'Budget Exceeded',
  large_transaction: 'Large Transaction',
  low_balance: 'Low Balance',
  unusual_merchant: 'Unusual Merchant',
  duplicate_transaction: 'Duplicate Transaction',
  goal_milestone: 'Goal Milestone',
  account_sync_failed: 'Account Sync Failed',
  spending_spike: 'Spending Spike',
  income_received: 'Income Received',
};

const ruleTypeDescriptions: Record<string, string> = {
  budget_exceeded: 'Alert when spending reaches a percentage of your budget',
  large_transaction: 'Alert for transactions above a threshold amount',
  low_balance: 'Alert when account balance drops below a threshold',
  unusual_merchant: 'Alert for transactions from new/unknown merchants',
  duplicate_transaction: 'Alert for potential duplicate transactions',
  goal_milestone: 'Alert when you reach goal milestones (25%, 50%, 75%, 100%)',
  account_sync_failed: 'Alert when account sync fails',
  spending_spike: 'Alert for unusual spending spikes in a category',
  income_received: 'Alert when income is received',
};

const prefTypeLabels: Record<string, string> = {
  budget_exceeded: 'Budget Exceeded',
  bill_due: 'Bill Due',
  large_transaction: 'Large Transaction',
  weekly_digest: 'Weekly Digest',
  goal_milestone: 'Goal Milestone',
};

const channelLabels: Record<string, string> = {
  in_app: 'In-App',
  email: 'Email',
  push: 'Push',
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

type Tab = 'notifications' | 'rules' | 'preferences';

interface NotificationRule {
  id: string;
  name: string;
  ruleType: string;
  isActive: boolean;
  conditions: Record<string, unknown>;
  settings: Record<string, unknown>;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  body: string | null;
  notificationType: string;
  priority: string;
  isRead: boolean;
  readAt: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationPreference {
  id: string;
  notificationType: string;
  channel: string;
  enabled: boolean;
}

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [showCreateRule, setShowCreateRule] = useState(false);

  // Queries
  const { data: notifData, refetch: refetchNotifs } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 100 },
  });
  const { data: rulesData, refetch: refetchRules } = useQuery(GET_NOTIFICATION_RULES);
  const { data: prefsData, refetch: refetchPrefs } = useQuery(GET_NOTIFICATION_PREFERENCES);

  // Mutations
  const [markRead] = useMutation(MARK_NOTIFICATION_READ, { onCompleted: () => refetchNotifs() });
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, { onCompleted: () => refetchNotifs() });
  const [deleteNotification] = useMutation(DELETE_NOTIFICATION, { onCompleted: () => refetchNotifs() });
  const [createRule] = useMutation(CREATE_NOTIFICATION_RULE, { onCompleted: () => { refetchRules(); setShowCreateRule(false); } });
  const [updateRule] = useMutation(UPDATE_NOTIFICATION_RULE, { onCompleted: () => refetchRules() });
  const [deleteRule] = useMutation(DELETE_NOTIFICATION_RULE, { onCompleted: () => refetchRules() });
  const [updatePref] = useMutation(UPDATE_NOTIFICATION_PREFERENCE, { onCompleted: () => refetchPrefs() });

  const notifications: Notification[] = notifData?.notifications || [];
  const unreadCount: number = notifData?.unreadNotificationCount || 0;
  const rules: NotificationRule[] = rulesData?.notificationRules || [];
  const preferences: NotificationPreference[] = prefsData?.notificationPreferences || [];

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (typeFilter !== 'all' && n.notificationType !== typeFilter) return false;
    if (readFilter === 'unread' && n.isRead) return false;
    if (readFilter === 'read' && !n.isRead) return false;
    return true;
  });

  const tabs = [
    { id: 'notifications' as Tab, label: 'Notifications', icon: BellIcon, count: unreadCount },
    { id: 'rules' as Tab, label: 'Alert Rules', icon: BoltIcon },
    { id: 'preferences' as Tab, label: 'Preferences', icon: Cog6ToothIcon },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notification Center</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your notifications, alert rules, and delivery preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
              {tab.count ? (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                  {tab.count}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'notifications' && (
        <NotificationsTab
          notifications={filteredNotifications}
          unreadCount={unreadCount}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          readFilter={readFilter}
          setReadFilter={setReadFilter}
          onMarkRead={(id) => markRead({ variables: { id } })}
          onMarkAllRead={() => markAllRead()}
          onDelete={(id) => deleteNotification({ variables: { id } })}
        />
      )}

      {activeTab === 'rules' && (
        <RulesTab
          rules={rules}
          showCreate={showCreateRule}
          setShowCreate={setShowCreateRule}
          onCreate={(vars) => createRule({ variables: vars })}
          onUpdate={(vars) => updateRule({ variables: vars })}
          onDelete={(id) => deleteRule({ variables: { id } })}
        />
      )}

      {activeTab === 'preferences' && (
        <PreferencesTab
          preferences={preferences}
          onUpdate={(notificationType, channel, enabled) =>
            updatePref({ variables: { notificationType, channel, enabled } })
          }
        />
      )}
    </div>
  );
};

// === Notifications Tab ===
interface NotificationsTabProps {
  notifications: Notification[];
  unreadCount: number;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  readFilter: string;
  setReadFilter: (v: string) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications, unreadCount, typeFilter, setTypeFilter, readFilter, setReadFilter,
  onMarkRead, onMarkAllRead, onDelete,
}) => (
  <div>
    {/* Filters */}
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-2">
        <FunnelIcon className="h-4 w-4 text-gray-400" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 dark:text-gray-200"
        >
          <option value="all">All Types</option>
          {Object.entries(typeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value)}
          className="text-sm border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 dark:text-gray-200"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>
      <div className="ml-auto">
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <CheckIcon className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>
    </div>

    {/* List */}
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
      {notifications.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <BellIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No notifications</p>
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
              !n.isRead ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''
            }`}
          >
            <span className="text-xl flex-shrink-0 mt-0.5">
              {typeIcons[n.notificationType] || '🔔'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${!n.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                  {n.title}
                </span>
                {!n.isRead && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  n.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  n.priority === 'low' ? 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {n.priority}
                </span>
              </div>
              {n.body && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>}
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">{timeAgo(n.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!n.isRead && (
                <button onClick={() => onMarkRead(n.id)} className="p-1 text-gray-400 hover:text-brand-600" title="Mark read">
                  <CheckIcon className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => onDelete(n.id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// === Rules Tab ===
interface RulesTabProps {
  rules: NotificationRule[];
  showCreate: boolean;
  setShowCreate: (v: boolean) => void;
  onCreate: (vars: { name: string; ruleType: string; conditions: Record<string, unknown>; settings?: Record<string, unknown> }) => void;
  onUpdate: (vars: { id: string; isActive?: boolean; name?: string; conditions?: Record<string, unknown> }) => void;
  onDelete: (id: string) => void;
}

const RulesTab: React.FC<RulesTabProps> = ({ rules, showCreate, setShowCreate, onCreate, onUpdate, onDelete }) => {
  const [newRuleType, setNewRuleType] = useState('large_transaction');
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleThreshold, setNewRuleThreshold] = useState('500');

  const getConditionsForType = (ruleType: string, threshold: string): Record<string, unknown> => {
    switch (ruleType) {
      case 'large_transaction': return { amount_threshold_cents: Math.round(parseFloat(threshold) * 100) };
      case 'low_balance': return { balance_threshold_cents: Math.round(parseFloat(threshold) * 100) };
      case 'budget_exceeded': return { threshold_percentage: parseInt(threshold) || 90 };
      case 'goal_milestone': return { milestone_percentages: [25, 50, 75, 100] };
      case 'spending_spike': return { average_window_days: 30, spike_multiplier: parseInt(threshold) || 3 };
      case 'income_received': return { minimum_amount_cents: Math.round(parseFloat(threshold) * 100) };
      default: return {};
    }
  };

  const getThresholdLabel = (ruleType: string): string => {
    switch (ruleType) {
      case 'large_transaction': return 'Amount ($)';
      case 'low_balance': return 'Balance ($)';
      case 'budget_exceeded': return 'Percentage (%)';
      case 'spending_spike': return 'Multiplier (x)';
      case 'income_received': return 'Min Amount ($)';
      default: return '';
    }
  };

  const formatConditions = (rule: NotificationRule): string => {
    const c = rule.conditions;
    switch (rule.ruleType) {
      case 'large_transaction': return `Over $${((c.amount_threshold_cents as number) || 0) / 100}`;
      case 'low_balance': return `Below $${((c.balance_threshold_cents as number) || 0) / 100}`;
      case 'budget_exceeded': return `At ${c.threshold_percentage || 90}% of budget`;
      case 'goal_milestone': return `At ${(c.milestone_percentages as number[] || []).join('%, ')}%`;
      case 'spending_spike': return `${c.spike_multiplier || 3}x above average`;
      case 'income_received': return `Min $${((c.minimum_amount_cents as number) || 0) / 100}`;
      default: return JSON.stringify(c);
    }
  };

  const needsThreshold = !['goal_milestone', 'unusual_merchant', 'duplicate_transaction', 'account_sync_failed'].includes(newRuleType);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure rules that trigger notifications based on your financial activity
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
        >
          {showCreate ? <XMarkIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          {showCreate ? 'Cancel' : 'Add Rule'}
        </button>
      </div>

      {/* Create Rule Form */}
      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">New Alert Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Type</label>
              <select
                value={newRuleType}
                onChange={(e) => setNewRuleType(e.target.value)}
                className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-gray-200"
              >
                {Object.entries(ruleTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">{ruleTypeDescriptions[newRuleType]}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder={ruleTypeLabels[newRuleType]}
                className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-gray-200"
              />
            </div>
            {needsThreshold && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {getThresholdLabel(newRuleType)}
                </label>
                <input
                  type="number"
                  value={newRuleThreshold}
                  onChange={(e) => setNewRuleThreshold(e.target.value)}
                  className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-gray-200"
                />
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                onCreate({
                  name: newRuleName || ruleTypeLabels[newRuleType],
                  ruleType: newRuleType,
                  conditions: getConditionsForType(newRuleType, newRuleThreshold),
                });
                setNewRuleName('');
                setNewRuleThreshold('500');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
            >
              Create Rule
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
        {rules.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <BoltIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No alert rules configured</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-sm text-brand-600 hover:text-brand-700"
            >
              Create your first rule →
            </button>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-4 px-4 py-3">
              <button
                onClick={() => onUpdate({ id: rule.id, isActive: !rule.isActive })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  rule.isActive ? 'bg-brand-600' : 'bg-gray-200 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    rule.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400">
                    {ruleTypeLabels[rule.ruleType] || rule.ruleType}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatConditions(rule)}
                </p>
              </div>
              <button
                onClick={() => onDelete(rule.id)}
                className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                title="Delete rule"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// === Preferences Tab ===
interface PreferencesTabProps {
  preferences: NotificationPreference[];
  onUpdate: (notificationType: string, channel: string, enabled: boolean) => void;
}

const PreferencesTab: React.FC<PreferencesTabProps> = ({ preferences, onUpdate }) => {
  const channels = ['in_app', 'email', 'push'];
  const types = [...new Set(preferences.map((p) => p.notificationType))];

  const getPref = (type: string, channel: string): boolean => {
    const pref = preferences.find((p) => p.notificationType === type && p.channel === channel);
    return pref?.enabled ?? false;
  };

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Choose how you want to be notified for each type of alert
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Notification Type
              </th>
              {channels.map((ch) => (
                <th key={ch} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {channelLabels[ch] || ch}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {types.map((type) => (
              <tr key={type} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {prefTypeLabels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </td>
                {channels.map((ch) => (
                  <td key={ch} className="px-4 py-3 text-center">
                    <button
                      onClick={() => onUpdate(type, ch, !getPref(type, ch))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        getPref(type, ch) ? 'bg-brand-600' : 'bg-gray-200 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                          getPref(type, ch) ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotificationsPage;
