import React, { useState, useEffect } from 'react';
import { XMarkIcon, BoltIcon } from '@heroicons/react/24/outline';
import { Transaction, Category } from '@/types';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

interface CreateRuleFromTransactionModalProps {
  transaction: Transaction;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onCreateRule: (input: {
    matchField: string;
    matchType: string;
    matchValue: string;
    categoryId: string;
    renameTo?: string;
  }) => Promise<unknown>;
}

const MATCH_FIELDS = [
  { value: 'merchant_name', label: 'Merchant Name' },
  { value: 'description', label: 'Description' },
];

const MATCH_TYPES = [
  { value: 'contains', label: 'Contains' },
  { value: 'exact', label: 'Exact Match' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
];

const CreateRuleFromTransactionModal: React.FC<CreateRuleFromTransactionModalProps> = ({
  transaction,
  categories,
  isOpen,
  onClose,
  onCreateRule,
}) => {
  const [matchField, setMatchField] = useState('merchant_name');
  const [matchType, setMatchType] = useState('contains');
  const [matchValue, setMatchValue] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      // Pre-fill from transaction
      if (transaction.merchantName) {
        setMatchField('merchant_name');
        setMatchValue(transaction.merchantName);
      } else {
        setMatchField('description');
        setMatchValue(transaction.description || '');
      }
      setCategoryId(transaction.categoryId || '');
      setMatchType('contains');
      setRenameTo('');
      setError(null);
    }
  }, [isOpen, transaction]);

  // Update matchValue when field changes
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
    if (!matchValue.trim() || !categoryId) return;

    setSaving(true);
    setError(null);
    try {
      await onCreateRule({
        matchField,
        matchType,
        matchValue: matchValue.trim(),
        categoryId,
        ...(renameTo.trim() ? { renameTo: renameTo.trim() } : {}),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
    } finally {
      setSaving(false);
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-brand-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Rule</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a rule to automatically categorize future transactions matching this pattern.
          </p>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Match Field */}
          <Select
            label="Match Field"
            options={MATCH_FIELDS}
            value={matchField}
            onChange={(e) => handleFieldChange(e.target.value)}
          />

          {/* Match Type */}
          <Select
            label="Match Type"
            options={MATCH_TYPES}
            value={matchType}
            onChange={(e) => setMatchType(e.target.value)}
          />

          {/* Match Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Match Value
            </label>
            <input
              type="text"
              value={matchValue}
              onChange={(e) => setMatchValue(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
              placeholder="Enter text to match..."
              required
            />
          </div>

          {/* Category */}
          <Select
            label="Assign Category"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />

          {/* Rename To (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rename To <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={renameTo}
              onChange={(e) => setRenameTo(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
              placeholder="Clean merchant name..."
            />
            <p className="mt-1 text-xs text-gray-400">Optionally rename matching transactions to a cleaner name</p>
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Rule Preview</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              When <span className="font-medium text-brand-600">{matchField === 'merchant_name' ? 'merchant name' : 'description'}</span>
              {' '}<span className="font-medium">{matchType.replace('_', ' ')}</span>
              {' '}<span className="font-medium text-brand-600">"{matchValue}"</span>
              {categoryId && (
                <>, assign to <span className="font-medium text-brand-600">
                  {categories.find(c => c.id === categoryId)?.name || 'selected category'}
                </span></>
              )}
              {renameTo && (
                <> and rename to <span className="font-medium text-brand-600">"{renameTo}"</span></>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1" type="button">
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={!matchValue.trim() || !categoryId} className="flex-1">
              <BoltIcon className="h-4 w-4 mr-1.5" />
              Create Rule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRuleFromTransactionModal;
