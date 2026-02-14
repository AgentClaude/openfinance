import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useMutation } from '@apollo/client';
import { SPLIT_TRANSACTION } from '@/graphql/mutations';
import { Transaction, Category } from '@/types';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';

interface SplitRow {
  amount: string;
  categoryId: string;
  description: string;
}

interface SplitTransactionModalProps {
  transaction: Transaction;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SplitTransactionModal: React.FC<SplitTransactionModalProps> = ({
  transaction,
  categories,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const absAmount = Math.abs(transaction.amount);
  const [rows, setRows] = useState<SplitRow[]>([
    { amount: '', categoryId: transaction.categoryId || '', description: '' },
    { amount: '', categoryId: '', description: '' },
  ]);
  const [error, setError] = useState<string | null>(null);

  const [splitTransaction, { loading }] = useMutation(SPLIT_TRANSACTION);

  const categoryOptions = [
    { value: '', label: 'Uncategorized' },
    ...categories.filter(c => !c.parentId).map(c => ({
      value: c.id,
      label: c.name,
    })),
  ];

  const rowsTotal = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const remaining = Math.round((absAmount - rowsTotal) * 100) / 100;

  const updateRow = (index: number, field: keyof SplitRow, value: string) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, { amount: remaining > 0 ? remaining.toFixed(2) : '', categoryId: '', description: '' }]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 2) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);
    const sign = transaction.amount < 0 ? -1 : 1;
    const splits = rows.map(r => ({
      amount: parseFloat(r.amount) * sign,
      categoryId: r.categoryId || null,
      description: r.description || null,
    }));

    try {
      const { data } = await splitTransaction({
        variables: { transactionId: transaction.id, splits },
      });
      if (data?.splitTransaction?.errors?.length) {
        setError(data.splitTransaction.errors.join(', '));
      } else {
        onSuccess();
        onClose();
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Split Transaction
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {transaction.description} — <span className="font-semibold">${absAmount.toFixed(2)}</span>
                </p>

                {error && (
                  <div className="bg-red-50 text-red-700 text-sm rounded-md p-3 mb-4">{error}</div>
                )}

                <div className="space-y-3 mt-4">
                  {rows.map((row, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-24">
                        <Input
                          label={i === 0 ? 'Amount' : undefined}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={row.amount}
                          onChange={e => updateRow(i, 'amount', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Select
                          label={i === 0 ? 'Category' : undefined}
                          options={categoryOptions}
                          value={row.categoryId}
                          onChange={e => updateRow(i, 'categoryId', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          label={i === 0 ? 'Description' : undefined}
                          placeholder="Optional"
                          value={row.description}
                          onChange={e => updateRow(i, 'description', e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => removeRow(i)}
                        disabled={rows.length <= 2}
                        className={`mt-${i === 0 ? '6' : '0'} p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <Button variant="secondary" size="sm" onClick={addRow}>
                    <PlusIcon className="h-4 w-4 mr-1" /> Add Row
                  </Button>
                  <span className={`text-sm font-medium ${Math.abs(remaining) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}>
                    {Math.abs(remaining) < 0.01 ? '✓ Balanced' : `$${remaining.toFixed(2)} remaining`}
                  </span>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                  <Button
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={Math.abs(remaining) >= 0.01}
                    className="flex-1"
                  >
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
