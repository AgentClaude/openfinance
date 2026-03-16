import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

const AccountCard: React.FC = () => (
  <div className="card p-6 max-w-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
          <span className="text-brand-700 font-semibold text-sm">🏦</span>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Checking Account</p>
          <p className="text-sm text-slate-500">Chase ****4829</p>
        </div>
      </div>
    </div>
    <p className="text-3xl font-bold tracking-heading text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>$12,450.89</p>
    <p className="text-sm text-success-600 mt-1">+$1,240.00 this month</p>
  </div>
);

const TransactionCard: React.FC = () => (
  <div className="card divide-y divide-slate-200 dark:divide-slate-700 max-w-md">
    {[
      { emoji: '🛒', name: 'Whole Foods', cat: 'Groceries', amount: '-$84.32', color: 'text-danger-600' },
      { emoji: '💰', name: 'Payroll Deposit', cat: 'Income', amount: '+$3,200.00', color: 'text-success-600' },
      { emoji: '🏠', name: 'Rent Payment', cat: 'Housing', amount: '-$1,800.00', color: 'text-danger-600' },
    ].map((tx, i) => (
      <div key={i} className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">{tx.emoji}</span>
          <div>
            <p className="text-sm font-medium text-slate-900">{tx.name}</p>
            <p className="text-xs text-slate-500">{tx.cat}</p>
          </div>
        </div>
        <span className={`text-sm font-semibold ${tx.color}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{tx.amount}</span>
      </div>
    ))}
  </div>
);

const StatCardDemo: React.FC = () => (
  <div className="grid grid-cols-3 gap-4 max-w-2xl">
    {[
      { label: 'Net Worth', value: '$145,230', trend: '+2.4%', up: true },
      { label: 'Monthly Spend', value: '$4,120', trend: '-8.1%', up: false },
      { label: 'Savings Rate', value: '32%', trend: '+5.0%', up: true },
    ].map((s, i) => (
      <div key={i} className="card p-4">
        <p className="text-sm text-slate-500">{s.label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
        <p className={`text-sm font-medium mt-1 ${s.up ? 'text-success-600' : 'text-danger-600'}`}>{s.trend}</p>
      </div>
    ))}
  </div>
);

const CardsPage: React.FC = () => (
  <div className="p-8 max-w-4xl space-y-10">
    <h1 className="text-3xl font-bold tracking-heading text-slate-900">Cards</h1>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Account Card</h3>
      <AccountCard />
    </section>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Transaction List Card</h3>
      <TransactionCard />
    </section>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Stat Cards</h3>
      <StatCardDemo />
    </section>
  </div>
);

const meta: Meta = {
  title: 'Brand/Cards',
  component: CardsPage,
};
export default meta;

export const AllCards: StoryObj = {};
