import React, { useState, useCallback } from 'react';
import { useMutation, useApolloClient } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  BanknotesIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  ChartBarSquareIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { CREATE_MANUAL_ACCOUNT } from '@/graphql/mutations';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import clsx from 'clsx';

interface OnboardingWizardProps {
  onComplete: () => void;
  userName?: string;
}

interface ManualAccountForm {
  name: string;
  type: string;
  balance: string;
}

const ACCOUNT_TYPES = [
  { value: 'DEPOSITORY', label: 'Checking / Savings', icon: BuildingLibraryIcon, description: 'Bank accounts, savings, money market' },
  { value: 'CREDIT', label: 'Credit Card', icon: CreditCardIcon, description: 'Credit cards, lines of credit' },
  { value: 'LOAN', label: 'Loan', icon: BanknotesIcon, description: 'Mortgage, auto loan, student loan' },
  { value: 'INVESTMENT', label: 'Investment', icon: ChartBarSquareIcon, description: '401k, IRA, brokerage accounts' },
];

const STEPS = ['Welcome', 'Add Accounts', 'All Set'];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, userName }) => {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const [step, setStep] = useState(0);
  const [addedAccounts, setAddedAccounts] = useState<string[]>([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState<ManualAccountForm>({ name: '', type: 'DEPOSITORY', balance: '' });
  const [formError, setFormError] = useState('');

  const [createAccount, { loading: creatingAccount }] = useMutation(CREATE_MANUAL_ACCOUNT);

  const handleAddAccount = useCallback(async () => {
    if (!accountForm.name.trim()) {
      setFormError('Account name is required');
      return;
    }
    const balance = parseFloat(accountForm.balance || '0');
    if (isNaN(balance)) {
      setFormError('Enter a valid balance');
      return;
    }
    setFormError('');
    try {
      const { data } = await createAccount({
        variables: {
          input: {
            name: accountForm.name.trim(),
            type: accountForm.type,
            balance,
          },
        },
      });
      if (data?.createManualAccount) {
        setAddedAccounts(prev => [...prev, data.createManualAccount.name]);
        setAccountForm({ name: '', type: 'DEPOSITORY', balance: '' });
        setShowAccountForm(false);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create account');
    }
  }, [accountForm, createAccount]);

  const handleFinish = useCallback(async () => {
    localStorage.setItem('onboarding_completed', 'true');
    // Clear cached accounts so dashboard fetches fresh data including any added accounts
    await apolloClient.resetStore().catch(() => {});
    onComplete();
    navigate('/dashboard');
  }, [apolloClient, onComplete, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress dots */}
        <div className="flex justify-center mb-8 gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={clsx(
                'w-3 h-3 rounded-full transition-all duration-300',
                i <= step ? 'bg-brand-600 scale-110' : 'bg-gray-300 dark:bg-gray-600'
              )} />
              {i < STEPS.length - 1 && (
                <div className={clsx(
                  'w-12 h-0.5 transition-colors duration-300',
                  i < step ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
                )} />
              )}
            </div>
          ))}
        </div>

        <Card className="p-8 shadow-xl border-0">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/30 mb-2">
                <SparklesIcon className="w-10 h-10 text-brand-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome to OpenFinance{userName ? `, ${userName}` : ''}!
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Take control of your finances with budgets, spending insights, and goal tracking — all in one place.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                {[
                  { icon: BanknotesIcon, text: 'Track spending' },
                  { icon: ChartBarSquareIcon, text: 'Build budgets' },
                  { icon: RocketLaunchIcon, text: 'Reach goals' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Icon className="w-6 h-6 text-brand-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{text}</span>
                  </div>
                ))}
              </div>
              <Button variant="primary" size="lg" onClick={() => setStep(1)} className="mt-4">
                Get Started <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 1: Add Accounts */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Your Accounts</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Start by adding your bank accounts, credit cards, or investments.
                </p>
              </div>

              {/* Added accounts list */}
              {addedAccounts.length > 0 && (
                <div className="space-y-2">
                  {addedAccounts.map((name, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-300">{name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Account form */}
              {showAccountForm ? (
                <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setAccountForm(prev => ({ ...prev, type: value }))}
                          className={clsx(
                            'flex items-center gap-2 p-3 rounded-lg border text-left transition-colors text-sm',
                            accountForm.type === value
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                          )}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={accountForm.name}
                      onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Chase Checking"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Balance</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={accountForm.balance}
                        onChange={e => setAccountForm(prev => ({ ...prev, balance: e.target.value }))}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                  </div>
                  {formError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={handleAddAccount} loading={creatingAccount}>
                      Add Account
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowAccountForm(false); setFormError(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAccountForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span className="font-medium">Add a manual account</span>
                </button>
              )}

              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setStep(2)}
                >
                  {addedAccounts.length > 0 ? 'Continue' : 'Skip for Now'} <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: All Set */}
          {step === 2 && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                <CheckCircleIcon className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">You're All Set!</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {addedAccounts.length > 0
                  ? `Great — you've added ${addedAccounts.length} account${addedAccounts.length > 1 ? 's' : ''}. Here's what you can do next:`
                  : 'You can add accounts anytime from the Accounts page. Here\'s what to explore:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {[
                  { icon: BanknotesIcon, title: 'Budget', desc: 'Set spending limits by category' },
                  { icon: ChartBarSquareIcon, title: 'Reports', desc: 'Visualize your spending patterns' },
                  { icon: CreditCardIcon, title: 'Recurring', desc: 'Track bills and subscriptions' },
                  { icon: RocketLaunchIcon, title: 'Goals', desc: 'Save toward what matters' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Icon className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button variant="primary" size="lg" onClick={handleFinish}>
                  Go to Dashboard <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          You can always change these settings later.
        </p>
      </div>
    </div>
  );
};

export default OnboardingWizard;
