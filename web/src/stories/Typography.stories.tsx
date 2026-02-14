import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const TypographyPage: React.FC = () => (
  <div className="p-8 max-w-3xl space-y-12">
    <section>
      <h2 className="text-lg font-semibold text-slate-500 uppercase tracking-widest mb-6">Heading Scale</h2>
      <div className="space-y-4">
        <p className="text-5xl font-bold tracking-heading text-slate-900">text-5xl — Marketing Headlines</p>
        <p className="text-4xl font-bold tracking-heading text-slate-900">text-4xl — Dashboard Totals</p>
        <p className="text-3xl font-bold tracking-heading text-slate-900">text-3xl — Page Titles</p>
        <p className="text-2xl font-semibold tracking-heading text-slate-900">text-2xl — Section Titles</p>
        <p className="text-xl font-semibold text-slate-900">text-xl — Section Headers</p>
        <p className="text-lg font-medium text-slate-900">text-lg — Card Titles</p>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-slate-500 uppercase tracking-widest mb-6">Body Text</h2>
      <div className="space-y-3">
        <p className="text-base text-slate-700">text-base (16px) — Primary body text. OpenFinance exists to make world-class personal finance tools free and accessible to everyone.</p>
        <p className="text-sm text-slate-500">text-sm (14px) — Secondary text, table cells, descriptions.</p>
        <p className="text-xs text-slate-400">text-xs (12px) — Captions, timestamps, metadata.</p>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-semibold text-slate-500 uppercase tracking-widest mb-6">Financial Numbers</h2>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Dashboard Total (tabular-nums)</p>
          <p className="text-4xl font-bold tracking-heading text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>$124,567.89</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Positive Amount</p>
          <p className="text-2xl font-semibold text-success-600" style={{ fontVariantNumeric: 'tabular-nums' }}>+$2,450.00</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Negative Amount</p>
          <p className="text-2xl font-semibold text-danger-600" style={{ fontVariantNumeric: 'tabular-nums' }}>-$890.34</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Column-aligned numbers (tabular-nums)</p>
          <div className="font-mono text-sm space-y-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <p className="text-slate-700">$  1,234.56</p>
            <p className="text-slate-700">$ 12,345.67</p>
            <p className="text-slate-700">$123,456.78</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Monospace (JetBrains Mono)</p>
          <p className="font-mono text-base text-slate-700">Account: ****4829 · Routing: 021000021</p>
        </div>
      </div>
    </section>
  </div>
);

const meta: Meta = {
  title: 'Brand/Typography',
  component: TypographyPage,
};
export default meta;

export const Scale: StoryObj = {};
