import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const ToastDemo: React.FC<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }> = ({ type, title, message }) => {
  const styles = {
    success: { border: 'border-l-success-600', bg: 'bg-success-50', icon: '✅', titleColor: 'text-success-800', msgColor: 'text-success-700' },
    error:   { border: 'border-l-danger-600', bg: 'bg-danger-50', icon: '❌', titleColor: 'text-danger-800', msgColor: 'text-danger-700' },
    warning: { border: 'border-l-warning-600', bg: 'bg-warning-50', icon: '⚠️', titleColor: 'text-warning-800', msgColor: 'text-warning-700' },
    info:    { border: 'border-l-info-600', bg: 'bg-info-50', icon: 'ℹ️', titleColor: 'text-info-800', msgColor: 'text-info-700' },
  };
  const s = styles[type];

  return (
    <div className={`${s.bg} border-l-4 ${s.border} rounded-r-lg p-4 max-w-sm shadow-card`}>
      <div className="flex gap-3">
        <span className="text-base flex-shrink-0">{s.icon}</span>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${s.titleColor}`}>{title}</p>
          <p className={`text-sm ${s.msgColor} mt-0.5`}>{message}</p>
        </div>
        <button className="text-slate-400 hover:text-slate-600 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

const ToastPage: React.FC = () => (
  <div className="p-8 max-w-lg space-y-8">
    <h1 className="text-3xl font-bold tracking-heading text-slate-900">Toasts</h1>
    <p className="text-slate-500">Top-right, stacked. Auto-dismiss 5s for success, persistent for errors. 4px semantic left border.</p>

    <div className="space-y-4">
      <ToastDemo type="success" title="Budget updated" message="Your dining budget has been set to $400/month." />
      <ToastDemo type="error" title="Sync failed" message="We couldn't connect to your bank. Check your connection and try again." />
      <ToastDemo type="warning" title="Over budget" message="You've spent 95% of your dining budget with 10 days left." />
      <ToastDemo type="info" title="New feature" message="You can now split transactions across multiple categories." />
    </div>
  </div>
);

const meta: Meta = {
  title: 'Brand/Toast',
  component: ToastPage,
};
export default meta;

export const AllTypes: StoryObj = {};
