import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const chartColors = [
  { name: '1 — Teal', hex: '#0D9488', usage: 'Primary category' },
  { name: '2 — Amber', hex: '#F59E0B', usage: 'Secondary metric' },
  { name: '3 — Violet', hex: '#7C3AED', usage: 'Third category' },
  { name: '4 — Rose', hex: '#E11D48', usage: 'Negative emphasis' },
  { name: '5 — Sky', hex: '#0EA5E9', usage: 'Fifth category' },
  { name: '6 — Emerald', hex: '#10B981', usage: 'Positive emphasis' },
  { name: '7 — Orange', hex: '#F97316', usage: 'Seventh category' },
  { name: '8 — Indigo', hex: '#6366F1', usage: 'Eighth category' },
];

const ChartsPage: React.FC = () => (
  <div className="p-8 max-w-3xl space-y-10">
    <h1 className="text-3xl font-bold tracking-heading text-slate-900">Chart Color Palette</h1>
    <p className="text-slate-500">Maximum 8 colors per chart. Group remaining as "Other" in slate-400.</p>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Palette Swatches</h3>
      <div className="grid grid-cols-4 gap-4">
        {chartColors.map(c => (
          <div key={c.name} className="text-center">
            <div className="w-full h-20 rounded-lg mb-2" style={{ backgroundColor: c.hex }} />
            <p className="text-sm font-medium text-slate-700">{c.name}</p>
            <p className="text-xs text-slate-400 font-mono">{c.hex}</p>
            <p className="text-xs text-slate-500 mt-0.5">{c.usage}</p>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Sample Bar Chart</h3>
      <div className="card p-6">
        <div className="flex items-end gap-3 h-40">
          {[
            { pct: 80, idx: 0 }, { pct: 55, idx: 1 }, { pct: 45, idx: 2 },
            { pct: 70, idx: 3 }, { pct: 35, idx: 4 }, { pct: 60, idx: 5 },
          ].map(bar => (
            <div key={bar.idx} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all duration-500 ease-out"
                style={{ height: `${bar.pct}%`, backgroundColor: chartColors[bar.idx].hex }}
              />
              <span className="text-xs text-slate-400">Cat {bar.idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Donut Segments (visual reference)</h3>
      <div className="flex gap-2 h-6">
        {chartColors.map((c, i) => (
          <div key={i} className="flex-1 first:rounded-l-full last:rounded-r-full" style={{ backgroundColor: c.hex }} />
        ))}
      </div>
    </section>
  </div>
);

const meta: Meta = {
  title: 'Brand/Charts',
  component: ChartsPage,
};
export default meta;

export const Palette: StoryObj = {};
