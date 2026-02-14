import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const ColorSwatch: React.FC<{ name: string; hex: string; className?: string }> = ({ name, hex, className }) => (
  <div className="flex flex-col items-center">
    <div className={`w-16 h-16 rounded-lg border border-slate-200 ${className || ''}`} style={{ backgroundColor: hex }} />
    <span className="text-xs font-medium mt-1.5 text-slate-700">{name}</span>
    <span className="text-xs text-slate-400 font-mono">{hex}</span>
  </div>
);

const ColorRow: React.FC<{ title: string; colors: { name: string; hex: string }[] }> = ({ title, colors }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-slate-900 mb-3">{title}</h3>
    <div className="flex flex-wrap gap-4">
      {colors.map(c => <ColorSwatch key={c.name} name={c.name} hex={c.hex} />)}
    </div>
  </div>
);

const ColorsPage: React.FC = () => (
  <div className="p-8 max-w-4xl">
    <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">OpenFinance Color System</h1>
    <p className="text-slate-500 mb-8">Brand colors based on deep teal — bridging trust and growth.</p>

    <ColorRow title="Brand / Primary — Deep Teal" colors={[
      { name: '50', hex: '#F0FDFA' }, { name: '100', hex: '#CCFBF1' }, { name: '200', hex: '#99F6E4' },
      { name: '300', hex: '#5EEAD4' }, { name: '400', hex: '#2DD4BF' }, { name: '500', hex: '#14B8A6' },
      { name: '600', hex: '#0D9488' }, { name: '700', hex: '#0F766E' }, { name: '800', hex: '#115E59' },
      { name: '900', hex: '#134E4A' }, { name: '950', hex: '#042F2E' },
    ]} />

    <ColorRow title="Accent — Warm Amber" colors={[
      { name: '100', hex: '#FEF3C7' }, { name: '300', hex: '#FCD34D' },
      { name: '500', hex: '#F59E0B' }, { name: '600', hex: '#D97706' }, { name: '700', hex: '#B45309' },
    ]} />

    <ColorRow title="Semantic" colors={[
      { name: 'Success', hex: '#059669' }, { name: 'Warning', hex: '#D97706' },
      { name: 'Error', hex: '#DC2626' }, { name: 'Info', hex: '#0284C7' },
    ]} />

    <ColorRow title="Money Colors" colors={[
      { name: 'Income', hex: '#059669' }, { name: 'Expense', hex: '#DC2626' },
      { name: 'Transfer', hex: '#64748B' }, { name: 'Inv Gain', hex: '#10B981' },
      { name: 'Inv Loss', hex: '#E11D48' },
    ]} />

    <ColorRow title="Light Mode Surfaces" colors={[
      { name: 'Background', hex: '#FFFFFF' }, { name: 'Surface', hex: '#F8FAFC' },
      { name: 'Border', hex: '#E2E8F0' }, { name: 'Border Subtle', hex: '#F1F5F9' },
    ]} />

    <ColorRow title="Dark Mode Surfaces" colors={[
      { name: 'Background', hex: '#0F172A' }, { name: 'Surface', hex: '#1E293B' },
      { name: 'Raised', hex: '#334155' }, { name: 'Text Primary', hex: '#F1F5F9' },
      { name: 'Text Secondary', hex: '#94A3B8' },
    ]} />

    <ColorRow title="Chart Palette" colors={[
      { name: '1 Teal', hex: '#0D9488' }, { name: '2 Amber', hex: '#F59E0B' },
      { name: '3 Violet', hex: '#7C3AED' }, { name: '4 Rose', hex: '#E11D48' },
      { name: '5 Sky', hex: '#0EA5E9' }, { name: '6 Emerald', hex: '#10B981' },
      { name: '7 Orange', hex: '#F97316' }, { name: '8 Indigo', hex: '#6366F1' },
    ]} />
  </div>
);

const meta: Meta = {
  title: 'Brand/Colors',
  component: ColorsPage,
};
export default meta;

export const Palette: StoryObj = {};
