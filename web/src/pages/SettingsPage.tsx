import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useSettings } from '@/hooks/useSettings';
import { useThemeContext } from '@/components/ThemeProvider';
import { usePreferences } from '@/hooks/usePreferences';
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

type TabId = 'profile' | 'preferences' | 'household';

export default function SettingsPage() {
  const { user } = useAuth();
  const { updateProfile, updatingProfile, changePassword, changingPassword } = useSettings();
  const { isDark, toggleTheme } = useThemeContext();
  const { preferences, updatePreference } = usePreferences();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: '👤' },
    { id: 'preferences' as const, label: 'Preferences', icon: '⚙️' },
    { id: 'household' as const, label: 'Household', icon: '🏠' },
  ];

  const inputClasses = 'mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border';
  const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
  const cardClasses = 'bg-white dark:bg-gray-800 shadow rounded-lg p-6';
  const headingClasses = 'text-lg font-medium text-gray-900 dark:text-gray-100 mb-4';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
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
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                >
                  {updatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className={cardClasses}>
            <h2 className={headingClasses}>Change Password</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className={labelClasses}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClasses}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className={labelClasses}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  isDark ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className={cardClasses}>
            <h2 className={headingClasses}>Formatting</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClasses}>Date Format</label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => updatePreference('dateFormat', e.target.value)}
                  className={inputClasses}
                >
                  {DATE_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>First Day of Week</label>
                <select
                  value={preferences.firstDayOfWeek}
                  onChange={(e) => updatePreference('firstDayOfWeek', e.target.value as 'sunday' | 'monday')}
                  className={inputClasses}
                >
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Number Format</label>
                <select
                  value={preferences.numberFormat}
                  onChange={(e) => updatePreference('numberFormat', e.target.value as 'comma-dot' | 'dot-comma' | 'space-comma')}
                  className={inputClasses}
                >
                  {NUMBER_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Currency</label>
                <select
                  value={preferences.currency}
                  onChange={(e) => updatePreference('currency', e.target.value)}
                  className={inputClasses}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Household Tab */}
      {activeTab === 'household' && (
        <div className="space-y-6">
          <div className={cardClasses}>
            <h2 className={headingClasses}>Household Details</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClasses}>Household Name</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {user?.household?.name || 'My Household'}
                </p>
              </div>
              <div>
                <label className={labelClasses}>Currency</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {user?.household?.currency || 'USD'}
                </p>
              </div>
            </div>
          </div>

          <div className={cardClasses}>
            <h2 className={headingClasses}>Members</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name || 'You'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">
                  Owner
                </span>
              </div>

              <div className="pt-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Household collaboration is coming soon. You&apos;ll be able to invite family members to share accounts and budgets.
                </p>
                <button
                  disabled
                  className="mt-3 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
                >
                  Invite Member (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
