import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const EmptyState: React.FC<{ icon: string; title: string; desc: string; cta?: string }> = ({ icon, title, desc, cta }) => (
  <div className="card p-12 text-center max-w-md mx-auto">
    <div className="text-5xl mb-4 text-slate-300">{icon}</div>
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">{desc}</p>
    {cta && <button className="btn btn-primary mt-4 px-4 py-2 text-sm">{cta}</button>}
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="card p-6 max-w-sm space-y-4 animate-pulse">
    <div className="h-4 bg-slate-200 rounded w-1/3" />
    <div className="h-8 bg-slate-200 rounded w-2/3" />
    <div className="space-y-2">
      <div className="h-3 bg-slate-200 rounded w-full" />
      <div className="h-3 bg-slate-200 rounded w-5/6" />
      <div className="h-3 bg-slate-200 rounded w-4/6" />
    </div>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-sm text-slate-500">Loading transactions...</span>
  </div>
);

const ErrorState: React.FC = () => (
  <div className="max-w-md border-l-4 border-danger-500 bg-danger-50 p-4 rounded-r-lg">
    <div className="flex gap-3">
      <span className="text-danger-600 text-lg">⚠️</span>
      <div>
        <h4 className="text-sm font-semibold text-danger-800">We couldn't sync your account</h4>
        <p className="text-sm text-danger-700 mt-1">Your bank may be experiencing issues — we'll retry automatically.</p>
        <button className="text-sm font-medium text-danger-700 underline mt-2">Retry now</button>
      </div>
    </div>
  </div>
);

const StatesPage: React.FC = () => (
  <div className="p-8 max-w-3xl space-y-12">
    <h1 className="text-3xl font-bold tracking-heading text-slate-900">UI States</h1>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Empty States</h3>
      <div className="space-y-6">
        <EmptyState icon="📊" title="No transactions yet" desc="Connect a bank account or add one manually to start tracking." cta="Connect Account" />
        <EmptyState icon="🎯" title="No goals yet" desc="Set a savings goal to track your progress toward what matters." cta="Create Goal" />
        <EmptyState icon="📈" title="Not enough data for reports" desc="Come back after a month of tracking." />
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Loading States</h3>
      <div className="space-y-6">
        <div>
          <p className="text-xs text-slate-400 mb-2">Skeleton</p>
          <LoadingSkeleton />
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2">Spinner</p>
          <LoadingSpinner />
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2">Button loading</p>
          <button className="btn btn-primary px-4 py-2 text-sm inline-flex items-center gap-2 opacity-80 cursor-wait">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </button>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Error States</h3>
      <ErrorState />
    </section>
  </div>
);

const meta: Meta = {
  title: 'Brand/States',
  component: StatesPage,
};
export default meta;

export const AllStates: StoryObj = {};
