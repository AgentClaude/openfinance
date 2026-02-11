import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Transaction, Category, Tag } from '@/types';
import AmountDisplay from '@/components/ui/AmountDisplay';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { format } from 'date-fns';

interface TransactionDetailPanelProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  tags: Tag[];
  onSave: (id: string, input: any) => Promise<any>;
  onCreateTag: (input: { name: string; color?: string }) => Promise<Tag>;
  saving?: boolean;
}

const TAG_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

const TransactionDetailPanel: React.FC<TransactionDetailPanelProps> = ({
  transaction,
  isOpen,
  onClose,
  categories,
  tags: allTags,
  onSave,
  onCreateTag,
  saving,
}) => {
  const [categoryId, setCategoryId] = useState<string>('');
  const [needsReview, setNeedsReview] = useState(false);
  const [notes, setNotes] = useState('');
  const [transactionTags, setTransactionTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (transaction) {
      setCategoryId(transaction.categoryId || '');
      setNeedsReview(transaction.needsReview);
      setNotes('');
      setTransactionTags(transaction.tags || []);
      setFeedback(null);
    }
  }, [transaction]);

  if (!transaction) return null;

  const categoryOptions = [
    { value: '', label: 'Uncategorized' },
    ...categories.filter(c => !c.parentId).map(c => ({
      value: c.id,
      label: c.name,
    })),
  ];

  const handleSave = async () => {
    try {
      await onSave(transaction.id, {
        categoryId: categoryId || undefined,
        needsReview,
      });
      setFeedback({ type: 'success', message: 'Transaction updated!' });
      setTimeout(() => setFeedback(null), 2000);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Failed to save' });
    }
  };

  const handleAddTag = async () => {
    const name = tagInput.trim();
    if (!name) return;

    // Check if tag already exists
    let tag = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (!tag) {
      try {
        const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
        tag = await onCreateTag({ name, color });
      } catch {
        return;
      }
    }

    if (tag && !transactionTags.find(t => t.id === tag!.id)) {
      setTransactionTags(prev => [...prev, tag!]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagId: string) => {
    setTransactionTags(prev => prev.filter(t => t.id !== tagId));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 md:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-indigo-600 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-semibold text-white">
                          Transaction Details
                        </Dialog.Title>
                        <button
                          type="button"
                          className="rounded-md text-indigo-200 hover:text-white focus:outline-none"
                          onClick={onClose}
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="mt-4">
                        <AmountDisplay amount={transaction.amount} size="xl" colorize={false} className="!text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-4 py-6 sm:px-6 space-y-6">
                      {/* Feedback */}
                      {feedback && (
                        <div className={`rounded-md p-3 text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                          {feedback.message}
                        </div>
                      )}

                      {/* Basic Info */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                          <p className="text-sm text-gray-900 mt-1">{transaction.description}</p>
                        </div>
                        {transaction.merchantName && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Merchant</label>
                            <p className="text-sm text-gray-900 mt-1">{transaction.merchantName}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
                            <p className="text-sm text-gray-900 mt-1">{format(new Date(transaction.date), 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {transaction.account.name}
                              {transaction.account.mask && <span className="text-gray-500"> •••{transaction.account.mask}</span>}
                            </p>
                          </div>
                        </div>
                        {transaction.pending && (
                          <Badge variant="warning" size="sm">Pending</Badge>
                        )}
                      </div>

                      <hr />

                      {/* Category */}
                      <div>
                        <Select
                          label="Category"
                          options={categoryOptions}
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                        />
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {transactionTags.map(tag => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: tag.color || '#6366f1' }}
                            >
                              {tag.name}
                              <button
                                onClick={() => handleRemoveTag(tag.id)}
                                className="hover:bg-white/20 rounded-full p-0.5"
                              >
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder="Add tag..."
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                          />
                          <Button size="sm" variant="secondary" onClick={handleAddTag}>Add</Button>
                        </div>
                        {/* Tag suggestions */}
                        {tagInput && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {allTags
                              .filter(t => t.name.toLowerCase().includes(tagInput.toLowerCase()) && !transactionTags.find(tt => tt.id === t.id))
                              .slice(0, 5)
                              .map(tag => (
                                <button
                                  key={tag.id}
                                  onClick={() => {
                                    setTransactionTags(prev => [...prev, tag]);
                                    setTagInput('');
                                  }}
                                  className="px-2 py-0.5 rounded-full text-xs border border-gray-300 hover:bg-gray-100 text-gray-700"
                                >
                                  {tag.name}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add notes..."
                          rows={3}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        />
                      </div>

                      {/* Review Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {needsReview ? (
                            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                          ) : (
                            <CheckIcon className="h-5 w-5 text-green-500" />
                          )}
                          <span className="text-sm text-gray-700">
                            {needsReview ? 'Needs Review' : 'Reviewed'}
                          </span>
                        </div>
                        <button
                          onClick={() => setNeedsReview(!needsReview)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${needsReview ? 'bg-amber-500' : 'bg-green-500'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${needsReview ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                      <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose} className="flex-1">
                          Cancel
                        </Button>
                        <Button onClick={handleSave} loading={saving} className="flex-1">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TransactionDetailPanel;
