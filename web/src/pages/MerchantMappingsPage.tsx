import React, { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  PlayIcon,
  SparklesIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { useMerchantMappings, MerchantMapping, MerchantSuggestion } from '@/hooks/useMerchantMappings';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

const matchTypeOptions = [
  { value: 'contains', label: 'Contains' },
  { value: 'exact', label: 'Exact Match' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
];

const MerchantMappingsPage: React.FC = () => {
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingMapping, setEditingMapping] = useState<MerchantMapping | null>(null);
  const [suggestions, setSuggestions] = useState<MerchantSuggestion[]>([]);
  const [form, setForm] = useState({
    rawPattern: '',
    cleanName: '',
    matchType: 'contains',
  });

  const {
    mappings, loading, applying, suggesting,
    createMapping, updateMapping, deleteMapping, applyMappings, suggestMappings,
  } = useMerchantMappings();

  const openCreate = () => {
    setEditingMapping(null);
    setForm({ rawPattern: '', cleanName: '', matchType: 'contains' });
    setShowModal(true);
  };

  const openEdit = (mapping: MerchantMapping) => {
    setEditingMapping(mapping);
    setForm({
      rawPattern: mapping.rawPattern,
      cleanName: mapping.cleanName,
      matchType: mapping.matchType,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.rawPattern.trim() || !form.cleanName.trim()) return;

    try {
      if (editingMapping) {
        await updateMapping(editingMapping.id, {
          rawPattern: form.rawPattern.trim(),
          cleanName: form.cleanName.trim(),
          matchType: form.matchType,
        });
        addToast({ title: 'Mapping updated', type: 'success' });
      } else {
        await createMapping({
          rawPattern: form.rawPattern.trim(),
          cleanName: form.cleanName.trim(),
          matchType: form.matchType,
        });
        addToast({ title: 'Mapping created', type: 'success' });
      }
      setShowModal(false);
      setEditingMapping(null);
    } catch (e: any) {
      addToast({ title: e.message, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this mapping?')) {
      try {
        await deleteMapping(id);
        addToast({ title: 'Mapping deleted', type: 'success' });
      } catch (e: any) {
        addToast({ title: e.message, type: 'error' });
      }
    }
  };

  const handleToggle = async (mapping: MerchantMapping) => {
    try {
      await updateMapping(mapping.id, { isActive: !mapping.isActive });
    } catch (e: any) {
      addToast({ title: e.message, type: 'error' });
    }
  };

  const handleSuggest = async () => {
    try {
      const results = await suggestMappings();
      setSuggestions(results);
      setShowSuggestions(true);
      if (results.length === 0) {
        addToast({ title: 'No new suggestions found', type: 'info' });
      }
    } catch (e: any) {
      addToast({ title: e.message, type: 'error' });
    }
  };

  const handleAcceptSuggestion = async (suggestion: MerchantSuggestion) => {
    try {
      await createMapping({
        rawPattern: suggestion.rawPattern,
        cleanName: suggestion.suggestedName,
        matchType: 'contains',
      });
      setSuggestions(prev => prev.filter(s => s.rawPattern !== suggestion.rawPattern));
      addToast({ title: `Mapping created: "${suggestion.rawPattern}" → "${suggestion.suggestedName}"`, type: 'success' });
    } catch (e: any) {
      addToast({ title: e.message, type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Merchant Name Mappings"
        subtitle="Clean up raw merchant names from your bank — map ugly descriptions to readable names"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={handleSuggest}
              variant="secondary"
              disabled={suggesting}
            >
              <SparklesIcon className="h-4 w-4 mr-1" />
              {suggesting ? 'Scanning...' : 'Suggest Mappings'}
            </Button>
            <Button
              onClick={async () => {
                try {
                  const result = await applyMappings();
                  const count = result.updatedCount;
                  addToast({ title: `Renamed merchants on ${count} transaction${count !== 1 ? 's' : ''}`, type: 'success' });
                } catch (e: any) {
                  addToast({ title: e.message, type: 'error' });
                }
              }}
              variant="secondary"
              disabled={applying || mappings.length === 0}
            >
              <PlayIcon className="h-4 w-4 mr-1" />
              {applying ? 'Applying...' : 'Apply All'}
            </Button>
            <Button onClick={openCreate}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Mapping
            </Button>
          </div>
        }
      />

      {/* Suggestions panel */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="p-4 mb-6 border-info-200 dark:border-info-800 bg-info-50 dark:bg-info-900/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-info-700 dark:text-info-300">
              <SparklesIcon className="h-4 w-4 inline mr-1" />
              Suggested Mappings ({suggestions.length})
            </h3>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-xs text-info-500 hover:text-info-700"
            >
              Dismiss
            </button>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">"{s.rawPattern}"</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">"{s.suggestedName}"</span>
                  <span className="ml-2 text-xs text-gray-400">({s.transactionCount} txns)</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAcceptSuggestion(s)}>Accept</Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSuggestions(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {mappings.length === 0 ? (
        <EmptyState
          icon={<ArrowsRightLeftIcon className="h-12 w-12" />}
          title="No merchant mappings"
          description="Create mappings to clean up raw merchant names from your bank. For example, map 'AMZN MKTP US*2K7...' to 'Amazon'."
          actionLabel="Add Mapping"
          onAction={openCreate}
        />
      ) : (
        <div className="space-y-3">
          {mappings.map((mapping) => (
            <Card key={mapping.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(mapping)}
                      aria-label={`${mapping.isActive ? 'Disable' : 'Enable'} mapping: ${mapping.rawPattern}`}
                      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                        mapping.isActive ? 'bg-brand-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          mapping.isActive ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        <span className="text-gray-500 dark:text-gray-400">
                          {mapping.matchType.replace('_', ' ')}
                        </span>{' '}
                        "<span className="font-semibold">{mapping.rawPattern}</span>"
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="font-semibold text-brand-700 dark:text-brand-400">{mapping.cleanName}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">
                    {mapping.appliedCount} applied
                  </Badge>
                  <button
                    onClick={() => openEdit(mapping)}
                    aria-label={`Edit mapping: ${mapping.rawPattern}`}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(mapping.id)}
                    aria-label={`Delete mapping: ${mapping.rawPattern}`}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingMapping(null); }}
        title={editingMapping ? 'Edit Mapping' : 'Create Mapping'}
      >
        <div className="space-y-4">
          <Input
            label="Raw Pattern"
            value={form.rawPattern}
            onChange={(e) => setForm({ ...form, rawPattern: e.target.value })}
            placeholder="e.g. AMZN MKTP US, SQ *COFFEE SHOP"
          />
          <Select
            label="Match Type"
            value={form.matchType}
            onChange={(e) => setForm({ ...form, matchType: e.target.value })}
            options={matchTypeOptions}
          />
          <Input
            label="Clean Name"
            value={form.cleanName}
            onChange={(e) => setForm({ ...form, cleanName: e.target.value })}
            placeholder="e.g. Amazon, Local Coffee Shop"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingMapping(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!form.rawPattern.trim() || !form.cleanName.trim()}>
              {editingMapping ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MerchantMappingsPage;
