import React, { useState } from 'react';
import { XMarkIcon, BoltIcon } from '@heroicons/react/24/outline';
import { Transaction, Category } from '@/types';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useRules } from '@/hooks/useRules';

interface CreateRuleFromTransactionModalProps {
  transaction: Transaction;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MATCH_FIELDS = [
  { value: 'merchant_name', label: 'Merchant Name' },
  { value: 'description', label: 'Description' },
];

const MATCH_TYPES = [
  { value: 'exact', label: 'Exactly matches' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
];

const CreateRuleFromTransactionModal: React.FC<CreateRuleFromTransactionModalProps> = ({
  transaction,
  categories,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createRule, creating } = useRules();

  // Default to merchant_name if available, otherwise description
  const defaultField = transaction.merchantName ? 'merchant_name' : 'description';
  const defaultValue = transaction.merchantName || transaction.description || '';

  const [matchField, setMatchField] = useState(defaultField);
  const [matchType, setMatchType] = useState('exact');
  const [matchValue, setMatchValue] = useState(defaultValue);
  const [categoryId, setCategoryId] = useState(transaction.categoryId || '');
  const [renameTo, setRenameTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Update match value when field changes
  const handleFieldChange = (field: string) => {
    setMatchField(field);
    if (field === 'merchant_name') {
      setMatchValue(transaction.merchantName || transaction.description || '');
    } else {
      setMatchValue(transaction.description || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!matchValue.trim()) {
      setError('Match value is required');
      return;
    }
    if (!categoryId) {
      setError('Category is required');
      return;
    }

    try {
      await createRule({
        matchField,
        matchType,
        matchValue: matchValue.trim(),
        categoryId,
        renameTo: renameTo.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create rule';
      setError(msg);
    }
  };

  if (!isOpen) return null;

  const categoryOptions = [
    { value: '', label: 'Select category...' },
    ...categories.filter(c => !c.parentId).map(c => ({
      value: c.id,
      label: c.name,
    })),
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-brand-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Rule</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a rule to automatically categorize future transactions matching this pattern.
          </p>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Match Field"
              options={MATCH_FIELDS}
              value={matchField}
              onChange={(e) => handleFieldChange(e.target.value)}
            />
            <Select
              label="Match Type"
              options={MATCH_TYPES}
              value={matchType}
              onChange={(e) => setMatchType(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Match Value
            </label>
            <input
              type="text"
              value={matchValue}
              onChange={(e) => setMatchValue(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Value to match..."
            />
          </div>

          <Select
            label="Assign Category"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rename To <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={renameTo}
              onChange={(e) => setRenameTo(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Clean merchant name..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={creating} className="flex-1">
              Create Rule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRuleFromTransactionModal;
