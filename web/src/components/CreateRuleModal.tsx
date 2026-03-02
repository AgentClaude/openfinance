import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CREATE_CATEGORIZATION_RULE, APPLY_CATEGORIZATION_RULES } from '@/graphql/mutations';
import { GET_CATEGORIZATION_RULES } from '@/graphql/queries';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Category } from '@/types';

interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantName?: string | null;
  description?: string;
  categoryId?: string;
  categories: Category[];
  onSuccess?: () => void;
}

const MATCH_FIELD_OPTIONS = [
  { value: 'merchant_name', label: 'Merchant Name' },
  { value: 'description', label: 'Description' },
];

const MATCH_TYPE_OPTIONS = [
  { value: 'contains', label: 'Contains' },
  { value: 'exact', label: 'Exact Match' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
];

const CreateRuleModal: React.FC<CreateRuleModalProps> = ({
  isOpen,
  onClose,
  merchantName,
  description,
  categoryId: initialCategoryId,
  categories,
  onSuccess,
}) => {
  const [matchField, setMatchField] = useState('merchant_name');
  const [matchType, setMatchType] = useState('contains');
  const [matchValue, setMatchValue] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [applyToExisting, setApplyToExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createRule, { loading }] = useMutation(CREATE_CATEGORIZATION_RULE, {
    refetchQueries: [{ query: GET_CATEGORIZATION_RULES }],
  });
  const [applyRules] = useMutation(APPLY_CATEGORIZATION_RULES);

  // Pre-fill from transaction
  useEffect(() => {
    if (isOpen) {
      if (merchantName) {
        setMatchField('merchant_name');
        setMatchValue(merchantName);
      } else if (description) {
        setMatchField('description');
        setMatchValue(description);
      }
      setMatchType('contains');
      setCategoryId(initialCategoryId || '');
      setRenameTo('');
      setApplyToExisting(true);
      setError(null);
    }
  }, [isOpen, merchantName, description, initialCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchValue.trim() || !categoryId) {
      setError('Match value and category are required.');
      return;
    }
    try {
      await createRule({
        variables: {
          matchField,
          matchType,
          matchValue: matchValue.trim(),
          categoryId,
          renameTo: renameTo.trim() || undefined,
        },
      });
      if (applyToExisting) {
        await applyRules();
      }
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create rule';
      setError(msg);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Select category...' },
    ...categories.filter(c => !c.parentId).map(c => ({
      value: c.id,
      label: c.name,
    })),
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create Categorization Rule</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <p className="text-sm text-gray-500">
            Automatically categorize future transactions matching this rule.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Match Field"
              options={MATCH_FIELD_OPTIONS}
              value={matchField}
              onChange={(e) => setMatchField(e.target.value)}
            />
            <Select
              label="Match Type"
              options={MATCH_TYPE_OPTIONS}
              value={matchType}
              onChange={(e) => setMatchType(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Match Value</label>
            <input
              type="text"
              value={matchValue}
              onChange={(e) => setMatchValue(e.target.value)}
              placeholder="e.g. Starbucks"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
            />
          </div>

          <Select
            label="Assign Category"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rename To <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={renameTo}
              onChange={(e) => setRenameTo(e.target.value)}
              placeholder="Clean merchant name"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToExisting}
              onChange={(e) => setApplyToExisting(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700">Apply to existing transactions</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1" type="button">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Create Rule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRuleModal;
