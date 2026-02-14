import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useSettings } from '@/hooks/useSettings';
import { useThemeContext } from '@/components/ThemeProvider';
import { usePreferences } from '@/hooks/usePreferences';
import { useTags } from '@/hooks/useTags';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ACCOUNTS, GET_NOTIFICATION_PREFERENCES, GET_HOUSEHOLD_MEMBERS, GET_HOUSEHOLD_INVITATIONS, GET_MY_REFERRAL_CODE, GET_REFERRALS } from '@/graphql/queries';
import { UPDATE_HOUSEHOLD, UPDATE_NOTIFICATION_PREFERENCE, UPDATE_TAG, DELETE_TAG, EXPORT_DATA, DELETE_ACCOUNT, INVITE_TO_HOUSEHOLD, REMOVE_HOUSEHOLD_MEMBER, UPDATE_MEMBER_ROLE } from '@/graphql/mutations';
import { NotificationPreference } from '@/types';
import toast from 'react-hot-toast';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'JPY', 'CHF'];
const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
];
const NUMBER_FORMATS = [
  { value: 'comma-dot', label: '1,234.56 (US)' },
  { value: 'dot-comma', label: '1.234,56 (EU)' },
  { value: 'space-comma', label: '1 234,56 (FR)' },
];

const NOTIFICATION_TYPES = [
  { key: 'budget_exceeded', label: 'Budget Exceeded', description: 'When spending exceeds a budget category' },
  { key: 'bill_due', label: 'Bill Due', description: 'Upcoming recurring bills and payments' },
  { key: 'large_transaction', label: 'Large Transaction', description: 'Transactions above your threshold' },
  { key: 'weekly_digest', label: 'Weekly Digest', description: 'Weekly summary of your finances' },
  { key: 'goal_milestone', label: 'Goal Milestone', description: 'Progress updates on savings goals' },
];

const CHANNELS = [
  { key: 'in_app', label: 'In-App' },
  { key: 'email', label: 'Email' },
  { key: 'push', label: 'Push' },
];

type TabId = 'profile' | 'preferences' | 'household' | 'members' | 'notifications' | 'tags' | 'referrals' | 'security' | 'data';

export default function SettingsPage() {
  const { user } = useAuth();
  const { updateProfile, updatingProfile, changePassword, changingPassword } = useSettings();
  const { isDark, toggleTheme } = useThemeContext();
  const { preferences, updatePreference } = usePreferences();
  const { tags, refetch: refetchTags } = useTags();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Household form
  const [householdName, setHouseholdName] = useState(user?.household?.name || '');
  const [householdCurrency, setHouseholdCurrency] = useState(user?.household?.currency || 'USD');

  // Tag editing
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');

  // Mutations
  const [updateHouseholdMutation, { loading: updatingHousehold }] = useMutation(UPDATE_HOUSEHOLD);
  const [updateNotifPref] = useMutation(UPDATE_NOTIFICATION_PREFERENCE);
  const [updateTagMutation] = useMutation(UPDATE_TAG);
  const [deleteTagMutation] = useMutation(DELETE_TAG);
  const [exportDataMutation, { loading: exporting }] = useMutation(EXPORT_DATA);
  const [deleteAccountMutation, { loading: deletingAccount }] = useMutation(DELETE_ACCOUNT);

  // Security state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Members
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const { data: membersData, refetch: refetchMembers } = useQuery(GET_HOUSEHOLD_MEMBERS, { skip: activeTab !== 'members' });
  const { data: invitationsData, refetch: refetchInvitations } = useQuery(GET_HOUSEHOLD_INVITATIONS, { skip: activeTab !== 'members' });
  const [inviteMutation, { loading: inviting }] = useMutation(INVITE_TO_HOUSEHOLD);
  const [removeMemberMutation] = useMutation(REMOVE_HOUSEHOLD_MEMBER);
  const [updateRoleMutation] = useMutation(UPDATE_MEMBER_ROLE);

  // Accounts (for default account preference)
  const { data: accountsData } = useQuery(GET_ACCOUNTS);
  const accounts = accountsData?.accounts || [];

  // Referrals
  const { data: referralCodeData } = useQuery(GET_MY_REFERRAL_CODE, { skip: activeTab !== 'referrals' });
  const { data: referralsData } = useQuery(GET_REFERRALS, { skip: activeTab !== 'referrals' });
  const myReferralCode = referralCodeData?.myReferralCode || '';
  const myReferrals = referralsData?.referrals || [];
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myReferralCode);
    setCodeCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const members = membersData?.householdMembers || [];
  const invitations = invitationsData?.householdInvitations || [];
  const isOwner = user?.role === 'owner';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await inviteMutation({ variables: { email: inviteEmail, role: inviteRole } });
      if (data.inviteToHousehold.errors?.length) {
        toast.error(data.inviteToHousehold.errors[0]);
      } else {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        setInviteRole('member');
        refetchInvitations();
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this household?`)) return;
    try {
      const { data } = await removeMemberMutation({ variables: { userId } });
      if (data.removeHouseholdMember.errors?.length) {
        toast.error(data.removeHouseholdMember.errors[0]);
      } else {
        toast.success('Member removed');
        refetchMembers();
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const { data } = await updateRoleMutation({ variables: { userId, role } });
      if (data.updateMemberRole.errors?.length) {
        toast.error(data.updateMemberRole.errors[0]);
      } else {
        toast.success('Role updated');
        refetchMembers();
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to update role');
    }
  };

  // Notification preferences query
  const { data: notifData, refetch: refetchNotifs } = useQuery(GET_NOTIFICATION_PREFERENCES, {
    skip: activeTab !== 'notifications',
  });
  const notifPrefs: NotificationPreference[] = notifData?.notificationPreferences || [];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name, email });
      toast.success('Profile updated');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        toast.success('Password changed');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to change password');
    }
  };

  const handleUpdateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await updateHouseholdMutation({
        variables: { name: householdName, currency: householdCurrency },
      });
      if (data.updateHousehold.errors?.length) {
        toast.error(data.updateHousehold.errors[0]);
      } else {
        toast.success('Household updated');
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to update household');
    }
  };

  const handleToggleNotif = async (notificationType: string, channel: string, currentEnabled: boolean) => {
    try {
      await updateNotifPref({
        variables: { notificationType, channel, enabled: !currentEnabled },
      });
      refetchNotifs();
    } catch {
      toast.error('Failed to update notification preference');
    }
  };

  const isNotifEnabled = (type: string, channel: string): boolean => {
    const pref = notifPrefs.find(p => p.notificationType === type && p.channel === channel);
    return pref?.enabled ?? false;
  };

  const handleStartEditTag = (tag: { id: string; name: string; colorHex?: string; color?: string }) => {
    setEditingTagId(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.colorHex || tag.color || '#3B82F6');
  };

  const handleSaveTag = async (id: string) => {
    try {
      await updateTagMutation({ variables: { id, name: editTagName, colorHex: editTagColor } });
      setEditingTagId(null);
      refetchTags();
      toast.success('Tag updated');
    } catch {
      toast.error('Failed to update tag');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Delete this tag? It will be removed from all transactions.')) return;
    try {
      await deleteTagMutation({ variables: { id } });
      refetchTags();
      toast.success('Tag deleted');
    } catch {
      toast.error('Failed to delete tag');
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await exportDataMutation();
      const blob = new Blob([data.exportData.jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openfinance-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: '👤' },
    { id: 'preferences' as const, label: 'Preferences', icon: '⚙️' },
    { id: 'household' as const, label: 'Household', icon: '🏠' },
    { id: 'members' as const, label: 'Members', icon: '👥' },
    { id: 'notifications' as const, label: 'Notifications', icon: '🔔' },
    { id: 'tags' as const, label: 'Tags', icon: '🏷️' },
    { id: 'referrals' as const, label: 'Referrals', icon: '🎁' },
    { id: 'security' as const, label: 'Security', icon: '🔒' },
    { id: 'data' as const, label: 'Data', icon: '📦' },
  ];

  const inputClasses = 'mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-3 py-2 border';
  const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
  const cardClasses = 'bg-white dark:bg-gray-800 shadow rounded-lg p-6';
  const headingClasses = 'text-lg font-medium text-gray-900 dark:text-gray-100 mb-4';
  const btnPrimary = 'bg-brand-700 text-white px-4 py-2 rounded-md hover:bg-brand-800 disabled:opacity-50 text-sm font-medium';
  const btnDanger = 'bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 text-xs font-medium';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        <nav className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-700 dark:text-brand-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className={cardClasses}>
              <h2 className={headingClasses}>Profile Information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClasses}>Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="submit" disabled={updatingProfile} className={btnPrimary}>
                  {updatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>

          <form onSubmit={handleChangePassword} className={cardClasses}>
            <h2 className={headingClasses}>Change Password</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className={labelClasses}>Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClasses} required />
              </div>
              <div>
                <label className={labelClasses}>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClasses} required minLength={8} />
              </div>
              <div>
                <label className={labelClasses}>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClasses} required />
              </div>
              <button type="submit" disabled={changingPassword} className={btnPrimary}>
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className={cardClasses}>
            <h2 className={headingClasses}>Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Use dark theme across the app</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  isDark ? 'bg-brand-700' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className={cardClasses}>
            <h2 className={headingClasses}>Formatting</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClasses}>Date Format</label>
                <select value={preferences.dateFormat} onChange={(e) => updatePreference('dateFormat', e.target.value)} className={inputClasses}>
                  {DATE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClasses}>First Day of Week</label>
                <select value={preferences.firstDayOfWeek} onChange={(e) => updatePreference('firstDayOfWeek', e.target.value as 'sunday' | 'monday')} className={inputClasses}>
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Number Format</label>
                <select value={preferences.numberFormat} onChange={(e) => updatePreference('numberFormat', e.target.value as 'comma-dot' | 'dot-comma' | 'space-comma')} className={inputClasses}>
                  {NUMBER_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Currency</label>
                <select value={preferences.currency} onChange={(e) => updatePreference('currency', e.target.value)} className={inputClasses}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={cardClasses}>
            <h2 className={headingClasses}>Defaults</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClasses}>Default Account for New Transactions</label>
                <select value={preferences.defaultAccountId} onChange={(e) => updatePreference('defaultAccountId', e.target.value)} className={inputClasses}>
                  <option value="">None (always ask)</option>
                  {accounts.filter((a: { isActive: boolean }) => a.isActive).map((a: { id: string; name: string }) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pre-select this account when creating new transactions.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Household Tab */}
      {activeTab === 'household' && (
        <div className="space-y-6">
          <form onSubmit={handleUpdateHousehold} className={cardClasses}>
            <h2 className={headingClasses}>Household Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClasses}>Household Name</label>
                <input type="text" value={householdName} onChange={(e) => setHouseholdName(e.target.value)} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Currency</label>
                <select value={householdCurrency} onChange={(e) => setHouseholdCurrency(e.target.value)} className={inputClasses}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={updatingHousehold} className={btnPrimary}>
                {updatingHousehold ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          <div className={cardClasses}>
            <h2 className={headingClasses}>Members</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage household members in the <button onClick={() => setActiveTab('members')} className="text-brand-700 dark:text-brand-400 hover:underline font-medium">Members tab</button>.
            </p>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Invite Form (owners only) */}
          {isOwner && (
            <form onSubmit={handleInvite} className={cardClasses}>
              <h2 className={headingClasses}>Invite Member</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={inputClasses}
                    required
                  />
                </div>
                <div>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={inputClasses}>
                    <option value="member">Member</option>
                    <option value="advisor">Advisor (view only)</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                <button type="submit" disabled={inviting} className={btnPrimary}>
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          )}

          {/* Members List */}
          <div className={cardClasses}>
            <h2 className={headingClasses}>Household Members</h2>
            <div className="space-y-3">
              {members.map((m: { id: string; role: string; isPrimary: boolean; user: { id: string; name: string; email: string } }) => (
                <div key={m.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-brand-700 dark:text-brand-400">
                        {(m.user.name || m.user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.user.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isOwner && m.user.id !== user?.id ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateRole(m.user.id, e.target.value)}
                        className="text-xs rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 border"
                      >
                        <option value="owner">Owner</option>
                        <option value="member">Member</option>
                        <option value="advisor">Advisor</option>
                      </select>
                    ) : (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        m.role === 'owner' ? 'text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-indigo-900/20' :
                        m.role === 'advisor' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' :
                        'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                      }`}>
                        {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                      </span>
                    )}
                    {isOwner && m.user.id !== user?.id && (
                      <button onClick={() => handleRemoveMember(m.user.id, m.user.name || m.user.email)} className={btnDanger}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-gray-400 italic">No members found.</p>
              )}
            </div>
          </div>

          {/* Pending Invitations */}
          {isOwner && invitations.length > 0 && (
            <div className={cardClasses}>
              <h2 className={headingClasses}>Pending Invitations</h2>
              <div className="space-y-3">
                {invitations.map((inv: { id: string; email: string; role: string; expiresAt: string; createdAt: string }) => (
                  <div key={inv.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{inv.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Invited as {inv.role} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className={cardClasses}>
          <h2 className={headingClasses}>Notification Preferences</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose which notifications you receive and how.</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-700 dark:text-gray-300 pb-3 pr-4">Notification</th>
                  {CHANNELS.map((ch) => (
                    <th key={ch.key} className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 pb-3 px-4">{ch.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NOTIFICATION_TYPES.map((nt) => (
                  <tr key={nt.key} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-4 pr-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{nt.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{nt.description}</p>
                    </td>
                    {CHANNELS.map((ch) => {
                      const enabled = isNotifEnabled(nt.key, ch.key);
                      return (
                        <td key={ch.key} className="text-center py-4 px-4">
                          <button
                            onClick={() => handleToggleNotif(nt.key, ch.key, enabled)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              enabled ? 'bg-brand-700' : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className={cardClasses}>
          <h2 className={headingClasses}>Manage Tags</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Edit or remove tags used to organize your transactions.</p>
          {tags.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No tags yet. Create tags from the Transactions page.</p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {editingTagId === tag.id ? (
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="color"
                        value={editTagColor}
                        onChange={(e) => setEditTagColor(e.target.value)}
                        className="h-8 w-8 rounded border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editTagName}
                        onChange={(e) => setEditTagName(e.target.value)}
                        className={inputClasses + ' !mt-0 max-w-xs'}
                      />
                      <button onClick={() => handleSaveTag(tag.id)} className="text-brand-700 hover:text-indigo-800 text-sm font-medium">Save</button>
                      <button onClick={() => setEditingTagId(null)} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <span
                          className="inline-block h-4 w-4 rounded-full"
                          style={{ backgroundColor: tag.colorHex || tag.color || '#3B82F6' }}
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{tag.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleStartEditTag(tag)} className="text-gray-400 hover:text-brand-700 text-sm">Edit</button>
                        <button onClick={() => handleDeleteTag(tag.id)} className={btnDanger}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          <div className={cardClasses}>
            <h2 className={headingClasses}>Your Referral Code</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Share your referral code with friends. When they sign up, you'll both be tracked in the referral program.
            </p>
            <div className="flex items-center space-x-3">
              <code className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-md font-mono text-lg tracking-wider">
                {myReferralCode || '...'}
              </code>
              <button onClick={handleCopyCode} className={btnPrimary} disabled={!myReferralCode}>
                {codeCopied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          </div>

          <div className={cardClasses}>
            <h2 className={headingClasses}>Your Referrals ({myReferrals.length})</h2>
            {myReferrals.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No referrals yet. Share your code to get started!</p>
            ) : (
              <div className="space-y-3">
                {myReferrals.map((ref: { id: string; status: string; createdAt: string; referredUser: { id: string; name: string; email: string } }) => (
                  <div key={ref.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {(ref.referredUser.name || ref.referredUser.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ref.referredUser.name || 'Unnamed'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Joined {new Date(ref.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      ref.status === 'completed' ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' :
                      ref.status === 'rewarded' ? 'text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-indigo-900/20' :
                      'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                    }`}>
                      {ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Two-Factor Authentication */}
          <div className={cardClasses}>
            <h2 className={headingClasses}>Two-Factor Authentication</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {twoFactorEnabled ? '2FA is enabled' : '2FA is not enabled'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add an extra layer of security to your account using an authenticator app.
                </p>
              </div>
              <button
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  toast(twoFactorEnabled ? '2FA disabled (placeholder)' : '2FA enabled (placeholder)', { icon: 'ℹ️' });
                }}
                className={twoFactorEnabled ? btnDanger : btnPrimary}
              >
                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
              ⚠️ Two-factor authentication is coming soon. This is a preview of the interface.
            </p>
          </div>

          {/* Active Sessions */}
          <div className={cardClasses}>
            <h2 className={headingClasses}>Active Sessions</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Manage your active login sessions across devices.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💻</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Current Session</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {navigator.userAgent.includes('Mac') ? 'macOS' : navigator.userAgent.includes('Windows') ? 'Windows' : navigator.userAgent.includes('Linux') ? 'Linux' : 'Unknown OS'} · {navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                  Active Now
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="mt-4 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
            >
              Log out all other sessions
            </button>
          </div>
        </div>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className={cardClasses}>
            <h2 className={headingClasses}>Export Data</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Download all your financial data as a JSON file. Includes accounts, transactions, categories, tags, budgets, goals, and recurring items.
            </p>
            <button onClick={handleExport} disabled={exporting} className={btnPrimary}>
              {exporting ? 'Exporting...' : '📥 Export All Data (JSON)'}
            </button>
          </div>

          <div className={`${cardClasses} border-2 border-red-200 dark:border-red-800`}>
            <h2 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Permanently delete your account and anonymize all associated data. This action cannot be undone.
            </p>
            {!showDeleteForm ? (
              <button onClick={() => setShowDeleteForm(true)} className={btnDanger + ' !px-4 !py-2 !text-sm'}>
                Delete My Account
              </button>
            ) : (
              <div className="space-y-3 max-w-md">
                <div>
                  <label className={labelClasses}>Type &quot;DELETE&quot; to confirm</label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Enter your password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={async () => {
                      if (deleteConfirm !== 'DELETE') {
                        toast.error('Please type DELETE to confirm');
                        return;
                      }
                      try {
                        const { data } = await deleteAccountMutation({ variables: { password: deletePassword } });
                        if (data.deleteAccount.errors?.length) {
                          toast.error(data.deleteAccount.errors[0]);
                        } else {
                          toast.success('Account deleted. Goodbye!');
                          localStorage.removeItem('token');
                          setTimeout(() => { window.location.href = '/login'; }, 1500);
                        }
                      } catch {
                        toast.error('Failed to delete account');
                      }
                    }}
                    disabled={deletingAccount || deleteConfirm !== 'DELETE' || !deletePassword}
                    className={btnDanger + ' !px-4 !py-2 !text-sm disabled:opacity-50'}
                  >
                    {deletingAccount ? 'Deleting...' : 'Permanently Delete Account'}
                  </button>
                  <button onClick={() => { setShowDeleteForm(false); setDeleteConfirm(''); setDeletePassword(''); }} className="text-sm text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
