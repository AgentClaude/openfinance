import React, { useState, useCallback } from 'react';
import { 
  PlusIcon,
  BanknotesIcon,
  CreditCardIcon,
  HomeIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAccounts } from '@/hooks/useAccounts';
import { Account, AccountType } from '@/types';
import AdjustBalanceModal from '@/components/AdjustBalanceModal';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import AmountDisplay from '@/components/ui/AmountDisplay';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { usePlaidLink } from 'react-plaid-link';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import clsx from 'clsx';

import { usePageTitle } from '@/hooks/usePageTitle';

const accountTypeIcons = {
  [AccountType.DEPOSITORY]: BanknotesIcon,
  [AccountType.CREDIT]: CreditCardIcon,
  [AccountType.LOAN]: HomeIcon,
  [AccountType.INVESTMENT]: ChartBarIcon,
  [AccountType.OTHER]: BanknotesIcon,
};

const accountTypeLabels = {
  [AccountType.DEPOSITORY]: 'Banking',
  [AccountType.CREDIT]: 'Credit',
  [AccountType.LOAN]: 'Loans',
  [AccountType.INVESTMENT]: 'Investment',
  [AccountType.OTHER]: 'Other',
};

const accountTypeOptions = [
  { value: AccountType.DEPOSITORY, label: 'Banking Account' },
  { value: AccountType.CREDIT, label: 'Credit Account' },
  { value: AccountType.LOAN, label: 'Loan Account' },
  { value: AccountType.INVESTMENT, label: 'Investment Account' },
  { value: AccountType.OTHER, label: 'Other' },
];

const AccountsPage: React.FC = () => {
  usePageTitle('Accounts');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'connect'>('manual');
  const [formData, setFormData] = useState({
    name: '',
    type: AccountType.DEPOSITORY,
    subtype: '',
    balance: '',
  });

  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [adjustAccount, setAdjustAccount] = useState<{ id: string; name: string; balance: number } | null>(null);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', interestRate: '', creditLimit: '', minimumPayment: '' });
  const [showHidden, setShowHidden] = useState(false);

  const {
    accounts, loading, creating, updating,
    createAccount, createPlaidLinkToken, exchangePlaidToken,
    updateAccount, toggleHidden,
  } = useAccounts(true); // includeHidden=true so we can manage all accounts
  const { addToast } = useToast();
  const navigate = useNavigate();

  const visibleAccounts = accounts.filter(a => !a.isHidden);
  const hiddenAccounts = accounts.filter(a => a.isHidden);

  const getVisibleByType = (type: AccountType) => visibleAccounts.filter(a => a.type === type);

  const onPlaidSuccess = useCallback(async (publicToken: string, metadata: any) => {
    try {
      setPlaidLoading(true);
      const result = await exchangePlaidToken(publicToken, metadata);
      const count = Array.isArray(result) ? result.length : 1;
      addToast({ type: 'success', title: 'Connected', message: `Successfully connected ${count} account${count !== 1 ? 's' : ''}!` });
      setIsAddModalOpen(false);
      setLinkToken(null);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to connect account' });
    } finally {
      setPlaidLoading(false);
    }
  }, [exchangePlaidToken, addToast]); // eslint-disable-line react-hooks/exhaustive-deps

  const { open: openPlaidLink, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: () => {
      setLinkToken(null);
    },
  });

  const handleConnectBank = async () => {
    try {
      setPlaidLoading(true);
      const linkData = await createPlaidLinkToken();
      const token = linkData?.linkToken;
      if (token) {
        setLinkToken(token);
      } else {
        addToast({ type: 'error', title: 'Error', message: 'Failed to initialize bank connection' });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to start bank connection' });
    } finally {
      setPlaidLoading(false);
    }
  };

  React.useEffect(() => {
    if (linkToken && plaidReady) {
      openPlaidLink();
    }
  }, [linkToken, plaidReady, openPlaidLink]);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccount({
        name: formData.name,
        type: formData.type,
        subtype: formData.subtype || undefined,
        balance: parseFloat(formData.balance),
      });
      addToast({ type: 'success', title: 'Account created', message: `${formData.name} has been added successfully.` });
      setIsAddModalOpen(false);
      setFormData({ name: '', type: AccountType.DEPOSITORY, subtype: '', balance: '' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Failed to create account', message: error.message || 'An error occurred.' });
    }
  };

  const handleToggleHidden = async (account: Account) => {
    try {
      const newHidden = !account.isHidden;
      await toggleHidden(account.id, newHidden);
      addToast({
        type: 'success',
        title: newHidden ? 'Account hidden' : 'Account restored',
        message: `${account.name} has been ${newHidden ? 'hidden from' : 'restored to'} your accounts.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to update account' });
    }
  };

  const openEditModal = (account: Account) => {
    setEditAccount(account);
    setEditFormData({
      name: account.name,
      interestRate: account.interestRate != null ? String(account.interestRate) : '',
      creditLimit: account.creditLimit != null ? String(account.creditLimit) : '',
      minimumPayment: account.minimumPayment != null ? String(account.minimumPayment) : '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccount) return;

    try {
      const updates: Record<string, unknown> = { id: editAccount.id };
      if (editFormData.name !== editAccount.name) updates.name = editFormData.name;
      if (editFormData.interestRate !== '') updates.interestRate = parseFloat(editFormData.interestRate);
      if (editFormData.creditLimit !== '') updates.creditLimit = parseFloat(editFormData.creditLimit);
      if (editFormData.minimumPayment !== '') updates.minimumPayment = parseFloat(editFormData.minimumPayment);

      await updateAccount(updates as any);
      addToast({ type: 'success', title: 'Account updated', message: `${editFormData.name} has been updated.` });
      setEditAccount(null);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to update account' });
    }
  };

  const isFormValid = formData.name && formData.balance;
  const showCreditFields = editAccount?.type === AccountType.CREDIT || editAccount?.type === AccountType.LOAN;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const netWorth = visibleAccounts.reduce((sum, a) => {
    if (a.type === AccountType.CREDIT || a.type === AccountType.LOAN) {
      return sum - Math.abs(a.balance);
    }
    return sum + a.balance;
  }, 0);

  return (
    <div>
      <PageHeader 
        title="Accounts" 
        subtitle={`Net Worth: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(netWorth)}`}
        actions={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        }
      />

      {visibleAccounts.length === 0 && hiddenAccounts.length === 0 ? (
        <EmptyState
          icon={<BanknotesIcon className="h-12 w-12" />}
          title="No accounts yet"
          description="Add your first account to start tracking your finances."
          actionLabel="Add Account"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          {/* Visible accounts grouped by type */}
          {Object.values(AccountType).map(type => {
            const accountsOfType = getVisibleByType(type);
            if (accountsOfType.length === 0) return null;

            const IconComponent = accountTypeIcons[type];
            const totalBalance = accountsOfType.reduce((sum, a) => sum + a.balance, 0);

            return (
              <div key={type}>
                <div className="flex items-center mb-4">
                  <IconComponent className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {accountTypeLabels[type]}
                  </h2>
                  <div className="ml-auto">
                    <AmountDisplay amount={totalBalance} size="md" colorize={false} className="font-semibold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accountsOfType.map(account => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onNavigate={() => navigate(`/accounts/${account.id}`)}
                      onEdit={() => openEditModal(account)}
                      onToggleHidden={() => handleToggleHidden(account)}
                      onAdjustBalance={() => setAdjustAccount({ id: account.id, name: account.name, balance: account.balance })}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Hidden accounts section */}
          {hiddenAccounts.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                onClick={() => setShowHidden(!showHidden)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
                data-testid="toggle-hidden-accounts"
              >
                {showHidden ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
                <EyeSlashIcon className="h-4 w-4" />
                Hidden Accounts ({hiddenAccounts.length})
              </button>

              {showHidden && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hiddenAccounts.map(account => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      isHiddenView
                      onNavigate={() => navigate(`/accounts/${account.id}`)}
                      onEdit={() => openEditModal(account)}
                      onToggleHidden={() => handleToggleHidden(account)}
                      onAdjustBalance={() => setAdjustAccount({ id: account.id, name: account.name, balance: account.balance })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Account"
        size="lg"
      >
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('manual')}
              className={clsx(
                'whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'manual'
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
              )}
            >
              Manual Account
            </button>
            <button
              onClick={() => setActiveTab('connect')}
              className={clsx(
                'whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'connect'
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
              )}
            >
              Connect Bank
            </button>
          </nav>
        </div>

        {activeTab === 'manual' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="e.g., Chase Checking"
              required
            />
            <Select
              label="Account Type"
              options={accountTypeOptions}
              value={formData.type}
              onChange={(e) => handleFormChange('type', e.target.value)}
              required
            />
            <Input
              label="Subtype (Optional)"
              value={formData.subtype}
              onChange={(e) => handleFormChange('subtype', e.target.value)}
              placeholder="e.g., Checking, Savings, etc."
            />
            <Input
              label="Current Balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => handleFormChange('balance', e.target.value)}
              placeholder="0.00"
              required
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={creating} disabled={!isFormValid}>Add Account</Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Connect Your Bank</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Securely connect your bank accounts using Plaid to automatically sync transactions.
            </p>
            <Button onClick={handleConnectBank} disabled={plaidLoading}>
              {plaidLoading ? 'Connecting...' : 'Connect Bank Account'}
            </Button>
          </div>
        )}
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        isOpen={!!editAccount}
        onClose={() => setEditAccount(null)}
        title="Edit Account"
        size="md"
      >
        {editAccount && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Account Name"
              value={editFormData.name}
              onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            {showCreditFields && (
              <>
                <Input
                  label="Interest Rate (%)"
                  type="number"
                  step="0.01"
                  value={editFormData.interestRate}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                  placeholder="e.g., 19.99"
                />
                <Input
                  label="Credit Limit ($)"
                  type="number"
                  step="0.01"
                  value={editFormData.creditLimit}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, creditLimit: e.target.value }))}
                  placeholder="e.g., 5000.00"
                />
                <Input
                  label="Minimum Payment ($)"
                  type="number"
                  step="0.01"
                  value={editFormData.minimumPayment}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, minimumPayment: e.target.value }))}
                  placeholder="e.g., 25.00"
                />
              </>
            )}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditAccount(null)}>Cancel</Button>
              <Button type="submit" loading={updating}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Adjust Balance Modal */}
      {adjustAccount && (
        <AdjustBalanceModal
          isOpen={!!adjustAccount}
          onClose={() => setAdjustAccount(null)}
          accountId={adjustAccount.id}
          accountName={adjustAccount.name}
          currentBalance={adjustAccount.balance}
        />
      )}
    </div>
  );
};

interface AccountCardProps {
  account: Account;
  isHiddenView?: boolean;
  onNavigate: () => void;
  onEdit: () => void;
  onToggleHidden: () => void;
  onAdjustBalance: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isHiddenView = false,
  onNavigate,
  onEdit,
  onToggleHidden,
  onAdjustBalance,
}) => {
  return (
    <Card
      className={clsx(
        'hover:shadow-md transition-shadow cursor-pointer',
        isHiddenView && 'opacity-60'
      )}
      onClick={onNavigate}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 hover:text-brand-700 cursor-pointer truncate mr-2">
          {account.name}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isHiddenView && (
            <Badge variant="secondary" size="sm">Hidden</Badge>
          )}
          {account.isManual && (
            <Badge variant="secondary" size="sm">Manual</Badge>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Edit Account"
            data-testid={`edit-account-${account.id}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleHidden(); }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={isHiddenView ? 'Show Account' : 'Hide Account'}
            data-testid={`toggle-hidden-${account.id}`}
          >
            {isHiddenView ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAdjustBalance(); }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Adjust Balance"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {account.officialName && account.officialName !== account.name && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{account.officialName}</p>
        )}
        {account.mask && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Account •••{account.mask}</p>
        )}

        <div className="flex flex-wrap gap-1">
          {account.subtype && (
            <Badge variant="secondary" size="sm">{account.subtype}</Badge>
          )}
          {account.interestRate != null && account.interestRate > 0 && (
            <Badge variant="secondary" size="sm">{account.interestRate}% APR</Badge>
          )}
        </div>

        {account.creditLimit != null && account.creditLimit > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Credit Used</span>
              <span>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(account.balance))}
                {' / '}
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(account.creditLimit)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className={clsx(
                  'h-1.5 rounded-full',
                  Math.abs(account.balance) / account.creditLimit > 0.75
                    ? 'bg-red-500'
                    : Math.abs(account.balance) / account.creditLimit > 0.5
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                )}
                style={{ width: `${Math.min(100, (Math.abs(account.balance) / account.creditLimit) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <AmountDisplay 
            amount={account.balance} 
            size="lg" 
            colorize={account.type !== AccountType.CREDIT && account.type !== AccountType.LOAN}
          />
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Updated {format(new Date(account.balanceDate), 'MMM d')}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AccountsPage;
