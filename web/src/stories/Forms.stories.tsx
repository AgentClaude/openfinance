import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

const FormsPage: React.FC = () => (
  <div className="p-8 max-w-lg space-y-10">
    <h1 className="text-3xl font-bold tracking-heading text-slate-900">Form Elements</h1>

    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Text Inputs</h3>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
        <input type="email" className="input" placeholder="you@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input type="text" className="input pl-7 text-right" placeholder="0.00" style={{ fontVariantNumeric: 'tabular-nums' }} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <input type="text" className="input input-error" value="Invalid entry" readOnly />
        <p className="text-sm text-danger-600 mt-1 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
          This field is required
        </p>
      </div>
    </section>

    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Select</h3>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
        <select className="input">
          <option>🛒 Groceries</option>
          <option>🍽️ Dining</option>
          <option>🚗 Transport</option>
          <option>🏠 Housing</option>
        </select>
      </div>
    </section>

    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Toggle</h3>
      <div className="flex items-center gap-3">
        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-brand-600 transition-colors">
          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
        </button>
        <span className="text-sm text-slate-700">Auto-categorize transactions</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300 transition-colors">
          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
        </button>
        <span className="text-sm text-slate-700">Send email notifications</span>
      </div>
    </section>

    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Checkbox</h3>
      <div className="space-y-2">
        {['Checking', 'Savings', 'Credit Card'].map(label => (
          <label key={label} className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded text-brand-700 focus:ring-brand-500 border-slate-300" defaultChecked={label === 'Checking'} />
            <span className="text-sm text-slate-700">{label}</span>
          </label>
        ))}
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Complete Form</h3>
      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Transaction name</label>
          <input type="text" className="input" placeholder="e.g. Whole Foods" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
            <input type="text" className="input" placeholder="$0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input type="date" className="input" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button className="btn btn-ghost">Cancel</button>
          <button className="btn btn-primary">Save Transaction</button>
        </div>
      </div>
    </section>
  </div>
);

const meta: Meta = {
  title: 'Brand/Forms',
  component: FormsPage,
};
export default meta;

export const AllElements: StoryObj = {};
