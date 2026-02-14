import React, { useState } from 'react';
import {
  CheckCircleIcon,
  TagIcon,
  EyeSlashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Category } from '@/types';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

interface BulkActionToolbarProps {
  selectedCount: number;
  categories: Category[];
  onAction: (action: string, categoryId?: string) => Promise<void>;
  onClearSelection: () => void;
  loading?: boolean;
}

const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  categories,
  onAction,
  onClearSelection,
  loading,
}) => {
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  if (selectedCount === 0) return null;

  const flatCategories = categories.flatMap(cat => [
    cat,
    ...(cat.children || []),
  ]);

  const categoryOptions = [
    { value: '', label: 'Select category...' },
    ...flatCategories.map(c => ({ value: c.id, label: c.name })),
  ];

  const handleCategorize = async () => {
    if (selectedCategoryId) {
      await onAction('categorize', selectedCategoryId);
      setShowCategorySelect(false);
      setSelectedCategoryId('');
    }
  };

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 rounded-lg mb-4">
      <span className="text-sm font-medium text-brand-800 dark:text-brand-300">
        {selectedCount} selected
      </span>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('mark_reviewed')}
          disabled={loading}
        >
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Mark Reviewed
        </Button>

        {showCategorySelect ? (
          <div className="flex items-center gap-2">
            <Select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              options={categoryOptions}
            />
            <Button size="sm" onClick={handleCategorize} disabled={!selectedCategoryId || loading}>
              Apply
            </Button>
            <button onClick={() => setShowCategorySelect(false)} className="text-gray-400">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCategorySelect(true)}
            disabled={loading}
          >
            <TagIcon className="h-4 w-4 mr-1" />
            Categorize
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('exclude')}
          disabled={loading}
        >
          <EyeSlashIcon className="h-4 w-4 mr-1" />
          Exclude
        </Button>

        <button
          onClick={onClearSelection}
          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-400"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default BulkActionToolbar;
