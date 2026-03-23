import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useSettings } from '@/hooks/useSettings';
import { useThemeContext } from '@/components/ThemeProvider';
import { usePreferences } from '@/hooks/usePreferences';
import { useTags } from '@/hooks/useTags';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useShareTokens } from '@/hooks/useShareTokens';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ACCOUNTS, GET_NOTIFICATION_PREFERENCES, GET_HOUSEHOLD_MEMBERS, GET_HOUSEHOLD_INVITATIONS, GET_MY_REFERRAL_CODE, GET_REFERRALS } from '@/graphql/queries';
import { UPDATE_HOUSEHOLD, UPDATE_NOTIFICATION_PREFERENCE, UPDATE_TAG, DELETE_TAG, CREATE_TAG, EXPORT_DATA, DELETE_ACCOUNT, INVITE_TO_HOUSEHOLD, REMOVE_HOUSEHOLD_MEMBER, UPDATE_MEMBER_ROLE, CANCEL_INVITATION } from '@/graphql/mutations';
import { NotificationPreference } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import PlaidMappingsTab from '@/components/settings/PlaidMappingsTab';
import PageContainer from '@/components/ui/PageContainer';
import PageHeader from '@/components/ui/PageHeader';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'JPY', 'CHF'];
const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'America/Phoenix',
  'America/Toronto', 'America/Vancouver', 'America/Edmonton',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Amsterdam',
  'Europe/Rome', 'Europe/Madrid', 'Europe/Zurich', 'Europe/Stockholm',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore',
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Seoul',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
  'Pacific/Auckland', 'Africa/Johannesburg', 'America/Sao_Paulo',
  'America/Mexico_City', 'America/Argentina/Buenos_Aires',
];
const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
];
const NUMBER_FORMAT_OPTIONS = [
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

type TabId = 'profile' | 'preferences' | 'household' | 'members' | 'notifications' | 'tags' | 'referrals' | 'security' | 'apikeys' | 'sharing' | 'plaid' | 'data';

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
  const [householdTimezone, setHouseholdTimezone] = useState(user?.household?.timezone || 'America/New_York');

  // Tag editing
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');
  // Tag creation
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  // Mutations
  const [updateHouseholdMutation, { loading: updatingHousehold }] = useMutation(UPDATE_HOUSEHOLD);
  const [updateNotifPref] = useMutation(UPDATE_NOTIFICATION_PREFERENCE);
  const [updateTagMutation] = useMutation(UPDATE_TAG);
  const [deleteTagMutation] = useMutation(DELETE_TAG);
  const [createTagMutation] = useMutation(CREATE_TAG);
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
  const [cancelInvitationMutation] = useMutation(CANCEL_INVITATION);
  const [updateRoleMutation] = useMutation(UPDATE_MEMBER_ROLE);

  // Accounts (for default account preference)
  const { data: accountsData } = useQuery(GET_ACCOUNTS);
  const accounts = accountsData?.accounts || [];

  // API Keys
  const { apiKeys, loading: apiKeysLoading, creating: creatingKey, createApiKey, revokeApiKey } = useApiKeys();
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  // Share Tokens
  const { shareTokens, loading: shareTokensLoading, creating: creatingToken, createShareToken, revokeShareToken } = useShareTokens();
  const [newTokenWidgetType, setNewTokenWidgetType] = useState('net_worth');
  const [newTokenExpiry, setNewTokenExpiry] = useState('');
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [revokingTokenId, setRevokingTokenId] = useState<string | null>(null);

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

  const handleCancelInvitation = async (invId: string) => {
    if (!confirm('Cancel this invitation?')) return;
    try {
      const { data } = await cancelInvitationMutation({ variables: { id: invId } });
      if (data.cancelInvitation.errors?.length) {
        toast.error(data.cancelInvitation.errors[0]);
      } else {
        toast.success('Invitation cancelled');
        refetchInvitations();
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to cancel invitation');
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
        variables: { name: householdName, currency: householdCurrency, timezone: householdTimezone },
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

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await createTagMutation({ variables: { input: { name: newTagName.trim(), color: newTagColor } } });
      refetchTags();
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setShowCreateTag(false);
      toast.success('Tag created');
    } catch {
      toast.error('Failed to create tag');
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
    { id: 'apikeys' as const, label: 'API Keys', icon: '🔑' },
    { id: 'sharing' as const, label: 'Sharing', icon: '🔗' },
    { id: 'plaid' as const, label: 'Plaid', icon: '🏦' },
    { id: 'security' as const, label: 'Security', icon: '🔒' },
    { id: 'data' as const, label: 'Data', icon: '📦' },
  ];

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'info' as const;
      case 'advisor': return 'warning' as const;
      default: return 'success' as const;
    }
  };

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader title="Settings" />

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
          <Card title="Profile Information">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={updatingProfile}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Change Password">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" loading={changingPassword}>
                Change Password
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <Card title="Appearance">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Use dark theme across the app</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  isDark ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </Card>

          <Card title="Formatting">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Date Format"
                options={DATE_FORMAT_OPTIONS}
                value={preferences.dateFormat}
                onChange={(e) => updatePreference('dateFormat', e.target.value)}
              />
              <Select
                label="First Day of Week"
                options={[
                  { value: 'sunday', label: 'Sunday' },
                  { value: 'monday', label: 'Monday' },
                ]}
                value={preferences.firstDayOfWeek}
                onChange={(e) => updatePreference('firstDayOfWeek', e.target.value as 'sunday' | 'monday')}
              />
              <Select
                label="Number Format"
                options={NUMBER_FORMAT_OPTIONS}
                value={preferences.numberFormat}
                onChange={(e) => updatePreference('numberFormat', e.target.value as 'comma-dot' | 'dot-comma' | 'space-comma')}
              />
              <Select
                label="Currency"
                options={CURRENCIES.map(c => ({ value: c, label: c }))}
                value={preferences.currency}
                onChange={(e) => updatePreference('currency', e.target.value)}
              />
            </div>
          </Card>

          <Card title="Defaults">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Select
                  label="Default Account for New Transactions"
                  options={[
                    { value: '', label: 'None (always ask)' },
                    ...accounts.filter((a: { isActive: boolean }) => a.isActive).map((a: { id: string; name: string }) => ({
                      value: a.id,
                      label: a.name,
                    })),
                  ]}
                  value={preferences.defaultAccountId}
                  onChange={(e) => updatePreference('defaultAccountId', e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pre-select this account when creating new transactions.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Household Tab */}
      {activeTab === 'household' && (
        <div className="space-y-6">
          <Card title="Household Details">
            <form onSubmit={handleUpdateHousehold} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Household Name"
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                />
                <Select
                  label="Currency"
                  options={CURRENCIES.map(c => ({ value: c, label: c }))}
                  value={householdCurrency}
                  onChange={(e) => setHouseholdCurrency(e.target.value)}
                />
                <div>
                  <Select
                    label="Timezone"
                    options={TIMEZONES.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
                    value={householdTimezone}
                    onChange={(e) => setHouseholdTimezone(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Used for bill due dates and report date boundaries.</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={updatingHousehold}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Members">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage household members in the <button onClick={() => setActiveTab('members')} className="text-brand-700 dark:text-brand-400 hover:underline font-medium">Members tab</button>.
            </p>
          </Card>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Invite Form (owners only) */}
          {isOwner && (
            <Card title="Invite Member">
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <Select
                  options={[
                    { value: 'member', label: 'Member' },
                    { value: 'advisor', label: 'Advisor (view only)' },
                    { value: 'owner', label: 'Owner' },
                  ]}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                />
                <Button type="submit" loading={inviting}>
                  Send Invite
                </Button>
              </form>
            </Card>
          )}

          {/* Members List */}
          <Card title="Household Members">
            <div className="space-y-3">
              {members.map((m: { id: string; role: string; isPrimary: boolean; user: { id: string; name: string; email: string } }) => (
                <div key={m.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
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
                      <Select
                        options={[
                          { value: 'owner', label: 'Owner' },
                          { value: 'member', label: 'Member' },
                          { value: 'advisor', label: 'Advisor' },
                        ]}
                        value={m.role}
                        onChange={(e) => handleUpdateRole(m.user.id, e.target.value)}
                        className="!text-xs !px-2 !py-1"
                      />
                    ) : (
                      <Badge variant={roleBadgeVariant(m.role)}>
                        {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                      </Badge>
                    )}
                    {isOwner && m.user.id !== user?.id && (
                      <Button variant="danger" size="sm" onClick={() => handleRemoveMember(m.user.id, m.user.name || m.user.email)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-gray-400 italic">No members found.</p>
              )}
            </div>
          </Card>

          {/* Pending Invitations */}
          {isOwner && invitations.length > 0 && (
            <Card title="Pending Invitations">
              <div className="space-y-3">
                {invitations.map((inv: { id: string; email: string; role: string; expiresAt: string; createdAt: string }) => (
                  <div key={inv.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{inv.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Invited as {inv.role} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="warning">Pending</Badge>
                      <Button variant="danger" size="sm" onClick={() => handleCancelInvitation(inv.id)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card title="Notification Preferences" subtitle="Choose which notifications you receive and how.">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-gray-700 dark:text-gray-300 pb-3 pr-4">Notification</th>
                  {CHANNELS.map((ch) => (
                    <th key={ch.key} className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 pb-3 px-4">{ch.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {NOTIFICATION_TYPES.map((nt) => (
                  <tr key={nt.key}>
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
                              enabled ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-600'
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
        </Card>
      )}

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <Card title="Manage Tags" subtitle="Create, edit, or remove tags used to organize your transactions.">
          <div className="mb-4">
            {showCreateTag ? (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-8 w-8 rounded border-0 cursor-pointer"
                />
                <Input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="max-w-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <Button variant="primary" size="sm" onClick={handleCreateTag}>Create</Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowCreateTag(false); setNewTagName(''); }}>Cancel</Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setShowCreateTag(true)}>+ New Tag</Button>
            )}
          </div>
          {tags.length === 0 && !showCreateTag ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No tags yet. Click &quot;+ New Tag&quot; above to create one.</p>
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
                      <Input
                        type="text"
                        value={editTagName}
                        onChange={(e) => setEditTagName(e.target.value)}
                        className="max-w-xs"
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleSaveTag(tag.id)}>Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingTagId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <span
                          className="inline-block h-4 w-4 rounded-full"
                          style={{ backgroundColor: tag.colorHex || tag.color || '#3B82F6' }}
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{tag.name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {tag.transactionsCount ?? 0} transaction{tag.transactionsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleStartEditTag(tag)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteTag(tag.id)}>Delete</Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          <Card title="Your Referral Link">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Share your referral link with friends. When they sign up through your link, they&apos;ll be tracked in the referral program.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <code className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-md font-mono text-sm truncate">
                  {myReferralCode ? `${window.location.origin}/r/${myReferralCode}` : '...'}
                </code>
                <Button onClick={() => {
                  if (myReferralCode) {
                    navigator.clipboard.writeText(`${window.location.origin}/r/${myReferralCode}`);
                    handleCopyCode();
                  }
                }} disabled={!myReferralCode}>
                  {codeCopied ? '✓ Copied' : '🔗 Copy Link'}
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <code className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-md font-mono text-lg tracking-wider">
                  {myReferralCode || '...'}
                </code>
                <Button onClick={handleCopyCode} disabled={!myReferralCode} variant="secondary">
                  📋 Code
                </Button>
              </div>
            </div>
          </Card>

          {/* Referral Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.referralClicks ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Link Clicks</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{myReferrals.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sign-ups</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {myReferrals.length > 0 ? Math.round((myReferrals.length / Math.max(user?.referralClicks ?? 1, 1)) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Conversion</p>
              </div>
            </Card>
          </div>

          <Card title={`Your Referrals (${myReferrals.length})`}>
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
                    <Badge variant={ref.status === 'completed' ? 'success' : ref.status === 'rewarded' ? 'info' : 'warning'}>
                      {ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'apikeys' && (
        <div className="space-y-6">
          <Card title="API Keys" subtitle="Create and manage API keys for programmatic access to your data.">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newKeyName.trim()) return;
                try {
                  const result = await createApiKey(newKeyName.trim());
                  if (result?.errors?.length) {
                    toast.error(result.errors[0]);
                  } else {
                    setNewlyCreatedKey(result?.plainTextKey || null);
                    setNewKeyName('');
                    toast.success('API key created');
                  }
                } catch {
                  toast.error('Failed to create API key');
                }
              }}
              className="flex flex-col sm:flex-row gap-3 mb-6"
            >
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Key name (e.g., My Dashboard)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" loading={creatingKey}>
                Generate Key
              </Button>
            </form>

            {newlyCreatedKey && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                  ✅ API key created — copy it now, it won&apos;t be shown again!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded border border-green-300 dark:border-green-700 font-mono text-sm break-all">
                    {newlyCreatedKey}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(newlyCreatedKey);
                      toast.success('Copied!');
                    }}
                  >
                    📋 Copy
                  </Button>
                </div>
                <button
                  onClick={() => setNewlyCreatedKey(null)}
                  className="mt-2 text-xs text-green-600 dark:text-green-400 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {apiKeysLoading ? (
              <p className="text-sm text-gray-400 italic">Loading API keys...</p>
            ) : apiKeys.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No API keys yet. Create one above to get started.</p>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">🔑</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {key.name}
                          {key.revoked && <span className="ml-2 text-xs text-red-500">(Revoked)</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created {new Date(key.createdAt).toLocaleDateString()}
                          {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    {!key.revoked && (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={revokingKeyId === key.id}
                        onClick={async () => {
                          if (!confirm(`Revoke API key "${key.name}"? This cannot be undone.`)) return;
                          setRevokingKeyId(key.id);
                          try {
                            await revokeApiKey(key.id);
                            toast.success('API key revoked');
                          } catch {
                            toast.error('Failed to revoke key');
                          } finally {
                            setRevokingKeyId(null);
                          }
                        }}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Usage">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>Include your API key in the <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">X-API-Key</code> header with every request.</p>
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
{`curl -H "X-API-Key: your_key_here" \\
  ${window.location.origin}/api/v1/accounts`}
              </pre>
              <p>
                See the <a href="/docs" className="text-brand-700 dark:text-brand-400 hover:underline font-medium">API Documentation</a> for all available endpoints.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Sharing Tab */}
      {activeTab === 'sharing' && (
        <div className="space-y-6">
          <Card title="Share Tokens" subtitle="Create tokens for embeddable widgets. Share tokens provide read-only access to specific data.">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Select
                label="Widget Type"
                options={[
                  { value: 'net_worth', label: 'Net Worth' },
                  { value: 'spending', label: 'Monthly Spending' },
                ]}
                value={newTokenWidgetType}
                onChange={(e) => setNewTokenWidgetType(e.target.value)}
              />
              <Select
                label="Expires"
                options={[
                  { value: '', label: 'Never' },
                  { value: '7', label: '7 days' },
                  { value: '30', label: '30 days' },
                  { value: '90', label: '90 days' },
                  { value: '365', label: '1 year' },
                ]}
                value={newTokenExpiry}
                onChange={(e) => setNewTokenExpiry(e.target.value)}
              />
              <div className="flex items-end">
                <Button
                  loading={creatingToken}
                  onClick={async () => {
                    try {
                      const result = await createShareToken(
                        newTokenWidgetType,
                        newTokenExpiry ? parseInt(newTokenExpiry) : undefined
                      );
                      if (result?.errors?.length) {
                        toast.error(result.errors[0]);
                      } else {
                        setNewlyCreatedToken(result?.shareToken?.token || null);
                        toast.success('Share token created');
                      }
                    } catch {
                      toast.error('Failed to create share token');
                    }
                  }}
                >
                  Create Token
                </Button>
              </div>
            </div>

            {newlyCreatedToken && (
              <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-success-800 dark:text-success-300 mb-2">
                  ✅ Share token created
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded border border-success-300 dark:border-success-700 font-mono text-sm break-all">
                    {newlyCreatedToken}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(newlyCreatedToken);
                      toast.success('Copied!');
                    }}
                  >
                    📋 Copy
                  </Button>
                </div>
                <button
                  onClick={() => setNewlyCreatedToken(null)}
                  className="mt-2 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {shareTokensLoading ? (
              <p className="text-sm text-gray-400 italic">Loading share tokens...</p>
            ) : shareTokens.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No share tokens yet. Create one to embed widgets on external sites.</p>
            ) : (
              <div className="space-y-3">
                {shareTokens.map((token) => (
                  <div key={token.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">🔗</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {token.widgetType === 'net_worth' ? 'Net Worth Widget' : 'Spending Widget'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created {new Date(token.createdAt).toLocaleDateString()}
                          {token.expiresAt ? ` · Expires ${new Date(token.expiresAt).toLocaleDateString()}` : ' · Never expires'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                          {token.token.slice(0, 12)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(token.token);
                          toast.success('Token copied');
                        }}
                      >
                        Copy
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={revokingTokenId === token.id}
                        onClick={async () => {
                          if (!confirm('Revoke this share token? Any embeds using it will stop working.')) return;
                          setRevokingTokenId(token.id);
                          try {
                            await revokeShareToken(token.id);
                            toast.success('Share token revoked');
                          } catch {
                            toast.error('Failed to revoke token');
                          } finally {
                            setRevokingTokenId(null);
                          }
                        }}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Embedding">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>Use share tokens with the embed endpoints to display widgets on any website:</p>
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
{`<iframe
  src="${window.location.origin}/api/v1/embed/net_worth?token=YOUR_TOKEN"
  width="400" height="200" frameborder="0"
></iframe>`}
              </pre>
              <p>
                See the <a href="/docs#embeds" className="text-brand-700 dark:text-brand-400 hover:underline font-medium">Embeddable Widgets documentation</a> for more details.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Plaid Category Mapping Tab */}
      {activeTab === 'plaid' && (
        <PlaidMappingsTab />
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card title="Two-Factor Authentication">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {twoFactorEnabled ? '2FA is enabled' : '2FA is not enabled'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add an extra layer of security to your account using an authenticator app.
                </p>
              </div>
              <Button
                variant={twoFactorEnabled ? 'danger' : 'primary'}
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  toast(twoFactorEnabled ? '2FA disabled (placeholder)' : '2FA enabled (placeholder)', { icon: 'ℹ️' });
                }}
              >
                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Button>
            </div>
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
              ⚠️ Two-factor authentication is coming soon. This is a preview of the interface.
            </p>
          </Card>

          <Card title="Active Sessions">
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
                <Badge variant="success">Active Now</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 !text-red-600 dark:!text-red-400"
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
            >
              Log out all other sessions
            </Button>
          </Card>
        </div>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <Card title="Export Data">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Download all your financial data as a JSON file. Includes accounts, transactions, categories, tags, budgets, goals, and recurring items.
            </p>
            <Button onClick={handleExport} loading={exporting}>
              📥 Export All Data (JSON)
            </Button>
          </Card>

          <Card title="Danger Zone" className="!border-2 !border-red-200 dark:!border-red-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Permanently delete your account and anonymize all associated data. This action cannot be undone.
            </p>
            {!showDeleteForm ? (
              <Button variant="danger" onClick={() => setShowDeleteForm(true)}>
                Delete My Account
              </Button>
            ) : (
              <div className="space-y-3 max-w-md">
                <Input
                  label='Type "DELETE" to confirm'
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                />
                <Input
                  label="Enter your password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
                <div className="flex space-x-3">
                  <Button
                    variant="danger"
                    loading={deletingAccount}
                    disabled={deleteConfirm !== 'DELETE' || !deletePassword}
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
                  >
                    Permanently Delete Account
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowDeleteForm(false); setDeleteConfirm(''); setDeletePassword(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
