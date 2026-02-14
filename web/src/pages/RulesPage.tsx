import React, { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  PlayIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useRules, Rule } from '@/hooks/useRules';
import { useCategories } from '@/hooks/useCategories';
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
import CategoryIcon from '@/components/ui/CategoryIcon';

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  children?: Category[];
}

const matchFieldOptions = [
  { value: 'merchant_name', label: 'Merchant Name' },
  { value: 'description', label: 'Description' },
];

const matchTypeOptions = [
  { value: 'contains', label: 'Contains' },
  { value: 'exact', label: 'Exact Match' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
];

const RulesPage: React.FC = () => {
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [form, setForm] = useState({
    matchField: 'merchant_name',
    matchType: 'contains',
    matchValue: '',
    categoryId: '',
    renameTo: '',
    priority: 0,
  });

  const {
    rules, loading, applying,
    createRule, updateRule, deleteRule, applyRules,
  } = useRules();
  const { categories } = useCategories();

  // Flatten categories for select
  const allCategories: Category[] = [];
  (categories || []).forEach((cat: Category) => {
    allCategories.push(cat);
    cat.children?.forEach((child: Category) => allCategories.push(child));
  });

  const openCreate = () => {
    setEditingRule(null);
    setForm({ matchField: 'merchant_name', matchType: 'contains', matchValue: '', categoryId: allCategories[0]?.id || '', renameTo: '', priority: 0 });
    setShowModal(true);
  };

  const openEdit = (rule: Rule) => {
    setEditingRule(rule);
    setForm({
      matchField: rule.matchField,
      matchType: rule.matchType,
      matchValue: rule.matchValue,
      categoryId: rule.categoryId,
      renameTo: rule.renameTo || '',
      priority: rule.priority,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.matchValue.trim() || !form.categoryId) return;

    const variables: Record<string, unknown> = {
      matchField: form.matchField,
      matchType: form.matchType,
      matchValue: form.matchValue.trim(),
      categoryId: form.categoryId,
      priority: form.priority,
    };
    if (form.renameTo.trim()) variables.renameTo = form.renameTo.trim();

    try {
      if (editingRule) {
        await updateRule(editingRule.id, variables);
        addToast({ title: 'Rule updated', type: 'success' });
      } else {
        await createRule(variables as any);
        addToast({ title: 'Rule created', type: 'success' });
      }
      setShowModal(false);
      setEditingRule(null);
    } catch (e: any) {
      addToast({ title: e.message, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this rule?')) {
      try {
        await deleteRule(id);
        addToast({ title: 'Rule deleted', type: 'success' });
      } catch (e: any) {
        addToast({ title: e.message, type: 'error' });
      }
    }
  };

  const handleToggle = async (rule: Rule) => {
    try {
      await updateRule(rule.id, { isActive: !rule.isActive });
    } catch (e: any) {
      addToast({ title: e.message, type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Categorization Rules"
        subtitle="Automatically categorize transactions based on patterns"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                try {
                  const result = await applyRules();
                  const count = result.updatedCount;
                  addToast({ title: `Applied rules to ${count} transaction${count !== 1 ? 's' : ''}`, type: 'success' });
                } catch (e: any) {
                  addToast({ title: e.message, type: 'error' });
                }
              }}
              variant="secondary"
              disabled={applying || rules.length === 0}
            >
              <PlayIcon className="h-4 w-4 mr-1" />
              {applying ? 'Applying...' : 'Apply Rules'}
            </Button>
            <Button onClick={openCreate}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>
        }
      />

      {rules.length === 0 ? (
        <EmptyState
          icon={<BoltIcon className="h-12 w-12" />}
          title="No categorization rules"
          description="Create rules to automatically categorize transactions based on merchant name or description patterns."
          actionLabel="Create Rule"
          onAction={openCreate}
        />
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(rule)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        rule.isActive ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          rule.isActive ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        When{' '}
                        <span className="text-indigo-600">
                          {rule.matchField === 'merchant_name' ? 'merchant name' : 'description'}
                        </span>{' '}
                        <span className="text-gray-500 dark:text-gray-400">{rule.matchType.replace('_', ' ')}</span>{' '}
                        "<span className="font-semibold">{rule.matchValue}</span>"
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">→ Categorize as</span>
                        <Badge style={{ backgroundColor: rule.category.color + '20', color: rule.category.color }}>
                          {rule.category.icon && <CategoryIcon icon={rule.category.icon} className="mr-1" />} {rule.category.name}
                        </Badge>
                        {rule.renameTo && (
                          <span className="text-xs text-gray-400">
                            → Rename to "{rule.renameTo}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {rule.matchesCount} match{rule.matchesCount !== 1 ? 'es' : ''}
                  </span>
                  <button
                    onClick={() => openEdit(rule)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
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

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingRule(null); }}
        title={editingRule ? 'Edit Rule' : 'Create Rule'}
      >
        <div className="space-y-4">
          <Select
            label="Match Field"
            value={form.matchField}
            onChange={(e) => setForm({ ...form, matchField: e.target.value })}
            options={matchFieldOptions}
          />
          <Select
            label="Match Type"
            value={form.matchType}
            onChange={(e) => setForm({ ...form, matchType: e.target.value })}
            options={matchTypeOptions}
          />
          <Input
            label="Match Value"
            value={form.matchValue}
            onChange={(e) => setForm({ ...form, matchValue: e.target.value })}
            placeholder="e.g. starbucks, amazon, netflix"
          />
          <Select
            label="Category"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            options={allCategories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Input
            label="Rename Merchant To (optional)"
            value={form.renameTo}
            onChange={(e) => setForm({ ...form, renameTo: e.target.value })}
            placeholder="e.g. Starbucks"
          />
          <Input
            label="Priority"
            type="number"
            value={form.priority.toString()}
            onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingRule(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!form.matchValue.trim() || !form.categoryId}>
              {editingRule ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RulesPage;
