import React, { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  PlayIcon,
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
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
];

const MerchantMappingsPage: React.FC = () => {
  const { addToast } = useToast();
  const {
    mappings,
    loading,
    createMapping,
    updateMapping,
    deleteMapping,
    applyMappings,
    suggestMappings,
    creating,
    applying,
    suggesting,
  } = useMerchantMappings();

  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<MerchantMapping | null>(null);
  const [suggestions, setSuggestions] = useState<MerchantSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [form, setForm] = useState({
    rawPattern: '',
    cleanName: '',
    matchType: 'contains',
  });

  const resetForm = () => {
    setForm({ rawPattern: '', cleanName: '', matchType: 'contains' });
    setEditingMapping(null);
  };

  const openCreate = () => {
    resetForm();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rawPattern.trim() || !form.cleanName.trim()) {
      addToast('Pattern and clean name are required.', 'error');
      return;
    }
    try {
      if (editingMapping) {
        await updateMapping(editingMapping.id, {
          rawPattern: form.rawPattern.trim(),
          cleanName: form.cleanName.trim(),
          matchType: form.matchType,
        });
        addToast('Mapping updated.', 'success');
      } else {
        await createMapping(form.rawPattern.trim(), form.cleanName.trim(), form.matchType);
        addToast('Mapping created.', 'success');
      }
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save mapping';
      addToast(msg, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMapping(id);
      addToast('Mapping deleted.', 'success');
    } catch {
      addToast('Failed to delete mapping.', 'error');
    }
  };

  const handleToggle = async (mapping: MerchantMapping) => {
    try {
      await updateMapping(mapping.id, { isActive: !mapping.isActive });
      addToast(mapping.isActive ? 'Mapping disabled.' : 'Mapping enabled.', 'success');
    } catch {
      addToast('Failed to toggle mapping.', 'error');
    }
  };

  const handleApply = async () => {
    try {
      const count = await applyMappings();
      addToast(`Applied mappings to ${count} transaction${count === 1 ? '' : 's'}.`, 'success');
    } catch {
      addToast('Failed to apply mappings.', 'error');
    }
  };

  const handleSuggest = async () => {
    try {
      const results = await suggestMappings();
      setSuggestions(results);
      setShowSuggestions(true);
      if (results.length === 0) {
        addToast('No suggestions found — your transactions look clean!', 'info');
      }
    } catch {
      addToast('Failed to generate suggestions.', 'error');
    }
  };

  const handleAcceptSuggestion = async (suggestion: MerchantSuggestion) => {
    try {
      await createMapping(suggestion.rawPattern, suggestion.suggestedName, 'contains');
      setSuggestions(prev => prev.filter(s => s.rawPattern !== suggestion.rawPattern));
      addToast(`Created mapping: "${suggestion.rawPattern}" → "${suggestion.suggestedName}"`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create mapping';
      addToast(msg, 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  const activeMappings = mappings.filter(m => m.isActive);
  const inactiveMappings = mappings.filter(m => !m.isActive);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Merchant Mappings"
        description="Clean up messy transaction descriptions. Map raw merchant names to readable ones."
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSuggest}
              loading={suggesting}
              icon={<SparklesIcon className="h-4 w-4" />}
            >
              Auto-Suggest
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleApply}
              loading={applying}
              icon={<PlayIcon className="h-4 w-4" />}
            >
              Apply All
            </Button>
            <Button
              size="sm"
              onClick={openCreate}
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Add Mapping
            </Button>
          </div>
        }
      />

      {/* Suggestions Panel */}
      {showSuggestions && suggestions.length > 0 && (
        <Card>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-amber-500" />
                Suggested Mappings
              </h3>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                      {s.rawPattern}
                    </code>
                    <ArrowRightIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {s.suggestedName}
                    </span>
                    <Badge variant="default" size="sm">
                      {s.transactionCount} txn{s.transactionCount === 1 ? '' : 's'}
                    </Badge>
                  </div>
                  <div className="flex gap-1 ml-3">
                    <button
                      onClick={() => handleAcceptSuggestion(s)}
                      className="p-1.5 rounded-md text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                      title="Accept"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSuggestions(prev => prev.filter((_, idx) => idx !== i))}
                      className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Dismiss"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Mappings List */}
      {mappings.length === 0 ? (
        <EmptyState
          title="No merchant mappings yet"
          description="Create mappings to automatically clean up messy merchant names on your transactions. Try Auto-Suggest to get started!"
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleSuggest} loading={suggesting} icon={<SparklesIcon className="h-4 w-4" />}>
                Auto-Suggest
              </Button>
              <Button onClick={openCreate} icon={<PlusIcon className="h-4 w-4" />}>
                Add Mapping
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          {activeMappings.length > 0 && (
            <Card>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {activeMappings.map(mapping => (
                  <MappingRow
                    key={mapping.id}
                    mapping={mapping}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </Card>
          )}

          {inactiveMappings.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 pt-2">
                Disabled ({inactiveMappings.length})
              </h3>
              <Card>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {inactiveMappings.map(mapping => (
                    <MappingRow
                      key={mapping.id}
                      mapping={mapping}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingMapping ? 'Edit Mapping' : 'New Merchant Mapping'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Map raw transaction descriptions to clean merchant names.
          </p>

          <Input
            label="Raw Pattern"
            value={form.rawPattern}
            onChange={(e) => setForm(prev => ({ ...prev, rawPattern: e.target.value }))}
            placeholder="e.g. AMZN*MKTPLACE"
            required
          />

          <Select
            label="Match Type"
            options={matchTypeOptions}
            value={form.matchType}
            onChange={(e) => setForm(prev => ({ ...prev, matchType: e.target.value }))}
          />

          <Input
            label="Clean Name"
            value={form.cleanName}
            onChange={(e) => setForm(prev => ({ ...prev, cleanName: e.target.value }))}
            placeholder="e.g. Amazon"
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="flex-1"
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" loading={creating} className="flex-1">
              {editingMapping ? 'Save Changes' : 'Create Mapping'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

interface MappingRowProps {
  mapping: MerchantMapping;
  onEdit: (mapping: MerchantMapping) => void;
  onDelete: (id: string) => void;
  onToggle: (mapping: MerchantMapping) => void;
}

const MappingRow: React.FC<MappingRowProps> = ({ mapping, onEdit, onDelete, onToggle }) => {
  const matchTypeLabel = matchTypeOptions.find(o => o.value === mapping.matchType)?.label ?? mapping.matchType;

  return (
    <div className={`flex items-center justify-between px-5 py-3 ${!mapping.isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
              {mapping.rawPattern}
            </code>
            <ArrowRightIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {mapping.cleanName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" size="sm">{matchTypeLabel}</Badge>
            {mapping.appliedCount > 0 && (
              <span className="text-xs text-gray-400">
                Applied to {mapping.appliedCount} transaction{mapping.appliedCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-3">
        <button
          onClick={() => onToggle(mapping)}
          className={`p-1.5 rounded-md ${mapping.isActive ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          title={mapping.isActive ? 'Disable' : 'Enable'}
        >
          <div className={`h-4 w-8 rounded-full transition-colors ${mapping.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} relative`}>
            <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${mapping.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </button>
        <button
          onClick={() => onEdit(mapping)}
          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          title="Edit"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(mapping.id)}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default MerchantMappingsPage;
