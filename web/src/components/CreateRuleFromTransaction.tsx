import React, { useState, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_CATEGORIZATION_RULE } from '@/graphql/mutations';
import { GET_CATEGORIZATION_RULES } from '@/graphql/queries';
import { Transaction, Category } from '@/types';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { XMarkIcon, BoltIcon } from '@heroicons/react/24/outline';

interface Props {
  transaction: Transaction;
  categories: Category[];
  selectedCategoryId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

const CreateRuleFromTransaction: React.FC<Props> = ({
  transaction,
  categories,
  selectedCategoryId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const defaultMatchValue = transaction.merchantName || transaction.description || '';

  const [matchField, setMatchField] = useState('merchant_name');
  const [matchType, setMatchType] = useState(transaction.merchantName ? 'exact' : 'contains');
  const [matchValue, setMatchValue] = useState(defaultMatchValue);
  const [categoryId, setCategoryId] = useState(selectedCategoryId || transaction.category?.id || '');
  const [error, setError] = useState('');

  const [createRule, { loading }] = useMutation(CREATE_CATEGORIZATION_RULE, {
    refetchQueries: [{ query: GET_CATEGORIZATION_RULES }],
  });

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: `${c.icon || '📁'} ${c.name}` })),
    [categories]
  );

  // Update match value when field changes
  const handleFieldChange = (field: string) => {
    setMatchField(field);
    if (field === 'merchant_name') {
      setMatchValue(transaction.merchantName || '');
      setMatchType('exact');
    } else {
      setMatchValue(transaction.description || '');
      setMatchType('contains');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!matchValue.trim()) {
      setError('Match value is required');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    try {
      await createRule({
        variables: {
          matchField,
          matchType,
          matchValue: matchValue.trim(),
          categoryId,
        },
      });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create rule';
      setError(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create Auto-Categorization Rule
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Future transactions matching this rule will be automatically categorized.
          </p>

          {/* Match Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              When
            </label>
            <Select
              value={matchField}
              onChange={(e) => handleFieldChange(e.target.value)}
              options={MATCH_FIELDS}
            />
          </div>

          {/* Match Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Match Type
            </label>
            <Select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value)}
              options={MATCH_TYPES}
            />
          </div>

          {/* Match Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value
            </label>
            <input
              type="text"
              value={matchValue}
              onChange={(e) => setMatchValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Starbucks"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assign to Category
            </label>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categoryOptions}
              placeholder="Select category..."
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rule Preview</p>
            <p className="text-sm text-gray-900 dark:text-white">
              When <span className="font-semibold">{MATCH_FIELDS.find(f => f.value === matchField)?.label}</span>
              {' '}<span className="font-semibold">{MATCH_TYPES.find(t => t.value === matchType)?.label?.toLowerCase()}</span>
              {' '}"<span className="font-semibold text-blue-600 dark:text-blue-400">{matchValue}</span>"
              {' → '}
              <span className="font-semibold text-green-600 dark:text-green-400">
                {categories.find(c => c.id === categoryId)?.name || '...'}
              </span>
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRuleFromTransaction;
