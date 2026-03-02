import React from 'react';
import Modal from '@/components/ui/Modal';
import { WidgetConfig } from '@/hooks/useDashboardLayout';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onToggle: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onReset: () => void;
}

const DashboardCustomizeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  widgets,
  onToggle,
  onMove,
  onReset,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customize Dashboard">
      <div className="space-y-1">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Show, hide, and reorder your dashboard widgets.
        </p>

        {widgets.map((widget, index) => (
          <div
            key={widget.id}
            className={clsx(
              'flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
              widget.visible
                ? 'bg-gray-50 dark:bg-gray-800'
                : 'bg-gray-50/50 dark:bg-gray-800/50 opacity-60'
            )}
          >
            <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                checked={widget.visible}
                onChange={() => onToggle(widget.id)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-base">{widget.icon}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {widget.label}
              </span>
            </label>

            <div className="flex items-center gap-0.5 ml-2">
              <button
                onClick={() => onMove(widget.id, 'up')}
                disabled={index === 0}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Move up"
              >
                <ChevronUpIcon className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={() => onMove(widget.id, 'down')}
                disabled={index === widgets.length - 1}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Move down"
              >
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Reset to default
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

export default DashboardCustomizeModal;
