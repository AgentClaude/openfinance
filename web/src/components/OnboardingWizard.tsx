import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import {
  SparklesIcon,
  BanknotesIcon,
  TagIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { CREATE_MANUAL_ACCOUNT } from '@/graphql/mutations';
import { useAccounts } from '@/hooks/useAccounts';
import Button from '@/components/ui/Button';

interface OnboardingWizardProps {
  userName: string;
  onComplete: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking', icon: '🏦', description: 'Everyday spending account' },
  { value: 'savings', label: 'Savings', icon: '🐖', description: 'Savings or high-yield account' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳', description: 'Credit card or line of credit' },
  { value: 'investment', label: 'Investment', icon: '📈', description: 'Brokerage or retirement account' },
  { value: 'loan', label: 'Loan', icon: '🏠', description: 'Mortgage, auto, or personal loan' },
  { value: 'other', label: 'Other', icon: '💰', description: 'Cash, crypto, or other assets' },
];

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'explore', label: 'Explore' },
  { id: 'done', label: 'Ready!' },
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ userName, onComplete }) => {
  const navigate = useNavigate();
  const { refetch: refetchAccounts } = useAccounts();
  const [step, setStep] = useState(0);
  const [createAccount, { loading: creating }] = useMutation(CREATE_MANUAL_ACCOUNT);

  // Account form
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('checking');
  const [accountBalance, setAccountBalance] = useState('');
  const [addedAccounts, setAddedAccounts] = useState<{ name: string; type: string }[]>([]);
  const [showAccountForm, setShowAccountForm] = useState(false);

  const handleAddAccount = useCallback(async () => {
    if (!accountName.trim()) return;
    try {
      await createAccount({
        variables: {
          name: accountName.trim(),
          accountType,
          balance: parseFloat(accountBalance || '0'),
        },
      });
      setAddedAccounts(prev => [...prev, { name: accountName.trim(), type: accountType }]);
      setAccountName('');
      setAccountBalance('');
      setAccountType('checking');
      setShowAccountForm(false);
      refetchAccounts();
    } catch (e) {
      console.error('Failed to add account:', e);
    }
  }, [accountName, accountType, accountBalance, createAccount, refetchAccounts]);

  const handleComplete = useCallback(() => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
    navigate('/dashboard');
  }, [navigate, onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
    navigate('/dashboard');
  }, [navigate, onComplete]);

  const firstName = userName.split(' ')[0] || 'there';

  const inputClasses = 'block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-3 py-2.5 transition-colors';

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-all duration-300 ${
                i < step ? 'bg-brand-600 text-white' :
                i === step ? 'bg-brand-600 text-white ring-4 ring-brand-200 dark:ring-brand-800' :
                'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
              }`}>
                {i < step ? <CheckCircleIcon className="h-5 w-5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-12 transition-all duration-300 ${
                  i < step ? 'bg-brand-600' : 'bg-gray-200 dark:bg-slate-700'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          {/* Step: Welcome */}
          {step === 0 && (
            <div className="p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 mb-6">
                <SparklesIcon className="h-8 w-8 text-brand-600 dark:text-brand-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Welcome, {firstName}! 🎉
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Let's get your finances set up in just a couple of minutes. You can always change things later.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left max-w-lg mx-auto">
                {[
                  { icon: BanknotesIcon, text: 'Add your accounts' },
                  { icon: TagIcon, text: 'Categorize spending' },
                  { icon: ChartBarIcon, text: 'Track your goals' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <Icon className="h-5 w-5 text-brand-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button onClick={() => setStep(1)}>
                  Get Started <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
                <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Step: Add Accounts */}
          {step === 1 && (
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 mb-4">
                  <BuildingLibraryIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Add Your Accounts</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Add your bank accounts, credit cards, and investments to see the full picture.
                </p>
              </div>

              {/* Added accounts list */}
              {addedAccounts.length > 0 && (
                <div className="mb-6 space-y-2">
                  {addedAccounts.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{a.type.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Account form */}
              {showAccountForm ? (
                <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-5 mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. Chase Checking"
                      className={inputClasses}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ACCOUNT_TYPES.map(t => (
                        <button
                          key={t.value}
                          onClick={() => setAccountType(t.value)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            accountType === t.value
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500'
                              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                          }`}
                        >
                          <div className="text-lg mb-0.5">{t.icon}</div>
                          <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{t.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Balance</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={accountBalance}
                        onChange={(e) => setAccountBalance(e.target.value)}
                        placeholder="0.00"
                        className={inputClasses + ' pl-7'}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleAddAccount} loading={creating} disabled={!accountName.trim()}>
                      Add Account
                    </Button>
                    <button onClick={() => setShowAccountForm(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAccountForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Add an Account</span>
                </button>
              )}

              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(0)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <ArrowLeftIcon className="h-4 w-4" /> Back
                </button>
                <Button onClick={() => setStep(2)}>
                  {addedAccounts.length > 0 ? 'Continue' : 'Skip for now'} <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Explore Features */}
          {step === 2 && (
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Here's What You Can Do</h2>
                <p className="text-gray-500 dark:text-gray-400">OpenFinance is packed with tools to manage your money.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {[
                  { emoji: '📊', title: 'Dashboard', desc: 'See your full financial picture at a glance' },
                  { emoji: '💰', title: 'Budgets', desc: 'Set monthly budgets and track spending per category' },
                  { emoji: '🔄', title: 'Recurring', desc: 'Auto-detect subscriptions and upcoming bills' },
                  { emoji: '📈', title: 'Reports', desc: '7 chart types — spending, trends, net worth, and more' },
                  { emoji: '🎯', title: 'Goals', desc: 'Set savings goals and track your progress' },
                  { emoji: '📥', title: 'Import', desc: 'Import transactions from CSV (Mint, bank exports)' },
                  { emoji: '🏷️', title: 'Rules', desc: 'Auto-categorize transactions with custom rules' },
                  { emoji: '🔍', title: 'Search', desc: 'Find any transaction instantly with ⌘K' },
                ].map(f => (
                  <div key={f.title} className="flex gap-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
                    <span className="text-2xl flex-shrink-0">{f.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{f.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <ArrowLeftIcon className="h-4 w-4" /> Back
                </button>
                <Button onClick={() => setStep(3)}>
                  Almost Done <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === 3 && (
            <div className="p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/30 mb-6">
                <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">You're All Set! 🚀</h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-2 max-w-md mx-auto">
                {addedAccounts.length > 0
                  ? `Great — you've added ${addedAccounts.length} account${addedAccounts.length > 1 ? 's' : ''}. Your dashboard is ready.`
                  : 'Your dashboard is ready. You can add accounts anytime from the Accounts page.'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-8 max-w-md mx-auto">
                Tip: Connect a bank via Plaid for automatic transaction syncing, or import a CSV from your bank's website.
              </p>
              <Button onClick={handleComplete} className="text-base px-8 py-3">
                Go to Dashboard <ArrowRightIcon className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
