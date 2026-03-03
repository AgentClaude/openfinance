import React from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { DashboardWidget } from '@/hooks/useDashboardLayout';
import clsx from 'clsx';

interface Props {
  widgets: DashboardWidget[];
  onToggle: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onReset: () => void;
  onClose: () => void;
}

const DashboardCustomizePanel: React.FC<Props> = ({
  widgets,
  onToggle,
  onMove,
  onReset,
  onClose,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Customize Dashboard
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {widgets.map((widget, index) => (
          <div
            key={widget.id}
            className={clsx(
              'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
              widget.visible
                ? 'bg-gray-50 dark:bg-gray-700/50'
                : 'bg-gray-100/50 dark:bg-gray-800/50 opacity-60'
            )}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle(widget.id)}
                className={clsx(
                  'p-0.5 rounded',
                  widget.visible
                    ? 'text-brand-600 hover:text-brand-700'
                    : 'text-gray-400 hover:text-gray-600'
                )}
                title={widget.visible ? 'Hide widget' : 'Show widget'}
              >
                {widget.visible ? (
                  <EyeIcon className="h-4 w-4" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4" />
                )}
              </button>
              <span className={clsx(
                'text-sm',
                widget.visible
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400'
              )}>
                {widget.label}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onMove(widget.id, 'up')}
                disabled={index === 0}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <ChevronUpIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onMove(widget.id, 'down')}
                disabled={index === widgets.length - 1}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardCustomizePanel;
