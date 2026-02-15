import React, { useState } from 'react';
import {
  CheckCircleIcon,
  TagIcon,
  EyeSlashIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Category, Tag } from '@/types';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

interface BulkActionToolbarProps {
  selectedCount: number;
  categories: Category[];
  tags?: Tag[];
  onAction: (action: string, categoryId?: string, tagId?: string) => Promise<void>;
  onClearSelection: () => void;
  loading?: boolean;
}

const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  categories,
  tags = [],
  onAction,
  onClearSelection,
  loading,
}) => {
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [showTagSelect, setShowTagSelect] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedCount === 0) return null;

  const flatCategories = categories.flatMap(cat => [
    cat,
    ...(cat.children || []),
  ]);

  const categoryOptions = [
    { value: '', label: 'Select category...' },
    ...flatCategories.map(c => ({ value: c.id, label: c.name })),
  ];

  const tagOptions = [
    { value: '', label: 'Select tag...' },
    ...tags.map(t => ({ value: t.id, label: t.name })),
  ];

  const handleCategorize = async () => {
    if (selectedCategoryId) {
      await onAction('categorize', selectedCategoryId);
      setShowCategorySelect(false);
      setSelectedCategoryId('');
    }
  };

  const handleTag = async () => {
    if (selectedTagId) {
      await onAction('tag', undefined, selectedTagId);
      setShowTagSelect(false);
      setSelectedTagId('');
    }
  };

  const handleDelete = async () => {
    await onAction('delete');
    setConfirmDelete(false);
  };

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 rounded-lg mb-4 flex-wrap">
      <span className="text-sm font-medium text-brand-800 dark:text-brand-300">
        {selectedCount} selected
      </span>

      <div className="flex items-center gap-2 ml-auto flex-wrap">
        {/* Mark Reviewed */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('mark_reviewed')}
          disabled={loading}
        >
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Mark Reviewed
        </Button>

        {/* Categorize */}
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

        {/* Tag */}
        {tags.length > 0 && (
          showTagSelect ? (
            <div className="flex items-center gap-2">
              <Select
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value)}
                options={tagOptions}
              />
              <Button size="sm" onClick={handleTag} disabled={!selectedTagId || loading}>
                Apply
              </Button>
              <button onClick={() => setShowTagSelect(false)} className="text-gray-400">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTagSelect(true)}
              disabled={loading}
            >
              <TagIcon className="h-4 w-4 mr-1" />
              Tag
            </Button>
          )
        )}

        {/* Exclude */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('exclude')}
          disabled={loading}
        >
          <EyeSlashIcon className="h-4 w-4 mr-1" />
          Exclude
        </Button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600 font-medium">Delete {selectedCount}?</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="!text-red-600 hover:!bg-red-50"
            >
              Confirm
            </Button>
            <button onClick={() => setConfirmDelete(false)} className="text-gray-400">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            disabled={loading}
            className="!text-red-600 hover:!bg-red-50"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}

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
