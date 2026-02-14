import React, { useState, useCallback } from 'react';
import { 
  PlusIcon,
  BanknotesIcon,
  CreditCardIcon,
  HomeIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { useAccounts } from '@/hooks/useAccounts';
import { AccountType } from '@/types';
import AdjustBalanceModal from '@/components/AdjustBalanceModal';
import BalanceHistory from '@/components/BalanceHistory';
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
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);

  const {
    accounts, loading, creating,
    createAccount, createPlaidLinkToken, exchangePlaidToken,
    getAccountsByType, getNetWorth,
  } = useAccounts();
  const { addToast } = useToast();
  const navigate = useNavigate();

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

  // Open Plaid Link when token is ready
  React.useEffect(() => {
    if (linkToken && plaidReady) {
      openPlaidLink();
    }
  }, [linkToken, plaidReady, openPlaidLink]);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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

      addToast({
        type: 'success',
        title: 'Account created',
        message: `${formData.name} has been added successfully.`,
      });

      setIsAddModalOpen(false);
      setFormData({ name: '', type: AccountType.DEPOSITORY, subtype: '', balance: '' });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to create account',
        message: error.message || 'An error occurred while creating the account.',
      });
    }
  };

  const isFormValid = formData.name && formData.balance;

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
        title="Accounts" 
        subtitle={`Net Worth: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(getNetWorth())}`}
        actions={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={<BanknotesIcon className="h-12 w-12" />}
          title="No accounts yet"
          description="Add your first account to start tracking your finances."
          actionLabel="Add Account"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          {Object.values(AccountType).map(type => {
            const accountsOfType = getAccountsByType(type);
            if (accountsOfType.length === 0) return null;

            const IconComponent = accountTypeIcons[type];
            const totalBalance = accountsOfType.reduce((sum, account) => sum + account.balance, 0);

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
                    <div key={account.id}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setExpandedAccountId(expandedAccountId === account.id ? null : account.id)}>
                      <div className="flex items-center justify-between mb-3">
                        <h3
                          className="font-medium text-gray-900 dark:text-gray-100 hover:text-brand-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/transactions?accountId=${account.id}`);
                          }}
                        >{account.name}</h3>
                        <div className="flex items-center gap-2">
                          {!account.isActive && (
                            <Badge variant="secondary" size="sm">Inactive</Badge>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdjustAccount({ id: account.id, name: account.name, balance: account.balance });
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
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
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Account •••{account.mask}
                          </p>
                        )}

                        {account.subtype && (
                          <Badge variant="secondary" size="sm">
                            {account.subtype}
                          </Badge>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <AmountDisplay 
                            amount={account.balance} 
                            size="lg" 
                            colorize={type !== AccountType.CREDIT && type !== AccountType.LOAN}
                          />
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Updated {format(new Date(account.balanceDate), 'MMM d')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                    {expandedAccountId === account.id && (
                      <div className="mt-2">
                        <BalanceHistory accountId={account.id} />
                      </div>
                    )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Account"
        size="lg"
      >
        {/* Tab Headers */}
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={creating}
                disabled={!isFormValid}
              >
                Add Account
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Connect Your Bank
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Securely connect your bank accounts using Plaid to automatically sync transactions.
            </p>
            <Button
              onClick={handleConnectBank}
              disabled={plaidLoading}
            >
              {plaidLoading ? 'Connecting...' : 'Connect Bank Account'}
            </Button>
          </div>
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

export default AccountsPage;