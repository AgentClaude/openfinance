import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const BtnDemo: React.FC<{ variant: string; classes: string; label: string }> = ({ classes, label }) => (
  <div className="flex items-center gap-3">
    <button className={`btn ${classes} px-3 py-1.5 text-sm`}>{label} sm</button>
    <button className={`btn ${classes} px-4 py-2 text-sm`}>{label} md</button>
    <button className={`btn ${classes} px-6 py-3 text-base`}>{label} lg</button>
    <button className={`btn ${classes} px-4 py-2 text-sm opacity-50 cursor-not-allowed`}>{label} disabled</button>
  </div>
);

const ButtonsPage: React.FC = () => (
  <div className="p-8 max-w-3xl space-y-8">
    <h1 className="text-3xl font-bold tracking-heading text-slate-900 mb-2">Buttons</h1>
    <p className="text-slate-500 mb-6">Primary uses brand teal. One primary button per section.</p>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Primary</h3>
      <BtnDemo variant="primary" classes="btn-primary" label="Primary" />
    </section>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Secondary</h3>
      <BtnDemo variant="secondary" classes="btn-secondary" label="Secondary" />
    </section>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Ghost</h3>
      <BtnDemo variant="ghost" classes="btn-ghost" label="Ghost" />
    </section>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Danger</h3>
      <BtnDemo variant="danger" classes="btn-danger" label="Danger" />
    </section>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">With Icon</h3>
      <div className="flex gap-3">
        <button className="btn btn-primary px-4 py-2 text-sm inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Transaction
        </button>
        <button className="btn btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export
        </button>
      </div>
    </section>
  </div>
);

const meta: Meta = {
  title: 'Brand/Buttons',
  component: ButtonsPage,
};
export default meta;

export const AllVariants: StoryObj = {};
