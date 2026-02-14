import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Transaction, Category } from '@/types';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import AmountDisplay from '@/components/ui/AmountDisplay';

interface SplitTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSplit: (transactionId: string, splits: Array<{ amount: number; categoryId?: string; description?: string }>) => Promise<any>;
}

interface SplitRow {
  amount: string;
  categoryId: string;
  description: string;
}

const SplitTransactionModal: React.FC<SplitTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  categories,
  onSplit,
}) => {
  const [splits, setSplits] = useState<SplitRow[]>([
    { amount: '', categoryId: '', description: '' },
    { amount: '', categoryId: '', description: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction && isOpen) {
      const halfAmount = (Math.abs(transaction.amount) / 2).toFixed(2);
      setSplits([
        { amount: halfAmount, categoryId: transaction.categoryId || '', description: '' },
        { amount: halfAmount, categoryId: '', description: '' },
      ]);
      setError(null);
    }
  }, [transaction, isOpen]);

  if (!transaction) return null;

  const totalAmount = Math.abs(transaction.amount);
  const splitTotal = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const remaining = totalAmount - splitTotal;
  const isBalanced = Math.abs(remaining) < 0.01;

  const flatCategories = categories.flatMap(cat => [
    cat,
    ...(cat.children || []),
  ]);

  const categoryOptions = [
    { value: '', label: 'Uncategorized' },
    ...flatCategories.map(c => ({ value: c.id, label: c.name })),
  ];

  const addSplit = () => {
    setSplits([...splits, { amount: '', categoryId: '', description: '' }]);
  };

  const removeSplit = (index: number) => {
    if (splits.length <= 2) return;
    setSplits(splits.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, field: keyof SplitRow, value: string) => {
    const updated = [...splits];
    updated[index] = { ...updated[index], [field]: value };
    setSplits(updated);
  };

  const handleSave = async () => {
    if (!isBalanced) {
      setError(`Splits must total ${totalAmount.toFixed(2)}. Currently ${splitTotal.toFixed(2)} (${remaining > 0 ? `$${remaining.toFixed(2)} remaining` : `$${Math.abs(remaining).toFixed(2)} over`})`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const sign = transaction.amount < 0 ? -1 : 1;
      const splitData = splits.map(s => ({
        amount: parseFloat(s.amount) * sign,
        categoryId: s.categoryId || undefined,
        description: s.description || undefined,
      }));
      await onSplit(transaction.id, splitData);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to split transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                    Split Transaction
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.merchantName}</p>
                    </div>
                    <AmountDisplay amount={transaction.amount} className="text-lg font-semibold" />
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {splits.map((split, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={split.amount}
                          onChange={(e) => updateSplit(idx, 'amount', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Select
                          value={split.categoryId}
                          onChange={(e) => updateSplit(idx, 'categoryId', e.target.value)}
                          options={categoryOptions}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Description"
                          value={split.description}
                          onChange={(e) => updateSplit(idx, 'description', e.target.value)}
                        />
                      </div>
                      {splits.length > 2 && (
                        <button
                          onClick={() => removeSplit(idx)}
                          className="p-2 text-red-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={addSplit}
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <PlusIcon className="h-4 w-4" /> Add split
                  </button>
                  <div className={`text-sm font-medium ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {isBalanced ? '✓ Balanced' : `$${Math.abs(remaining).toFixed(2)} ${remaining > 0 ? 'remaining' : 'over'}`}
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded">{error}</div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button variant="secondary" onClick={onClose}>Cancel</Button>
                  <Button onClick={handleSave} loading={saving} disabled={!isBalanced}>
                    Split Transaction
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SplitTransactionModal;
