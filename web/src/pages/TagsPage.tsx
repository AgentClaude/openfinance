import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useQuery, useMutation } from '@apollo/client';
import { GET_TAGS } from '@/graphql/queries';
import { CREATE_TAG, UPDATE_TAG, DELETE_TAG } from '@/graphql/mutations';
import { Tag } from '@/types';
import clsx from 'clsx';

const defaultColors = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#14b8a6', '#a855f7', '#d946ef', '#f43f5e', '#0ea5e9',
];

type FilterMode = 'all' | 'active' | 'inactive';

const TagsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<Tag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [formData, setFormData] = useState({
    name: '',
    colorHex: defaultColors[0],
  });

  const { data, loading, error } = useQuery(GET_TAGS);
  const { addToast } = useToast();

  const [createTag, { loading: creating }] = useMutation(CREATE_TAG, {
    refetchQueries: [{ query: GET_TAGS }],
    onCompleted: () => {
      addToast({ type: 'success', title: 'Tag created' });
      closeModal();
    },
    onError: (err) => addToast({ type: 'error', title: err.message }),
  });

  const [updateTag, { loading: updating }] = useMutation(UPDATE_TAG, {
    refetchQueries: [{ query: GET_TAGS }],
    onCompleted: () => {
      addToast({ type: 'success', title: 'Tag updated' });
      closeModal();
    },
    onError: (err) => addToast({ type: 'error', title: err.message }),
  });

  const [deleteTag] = useMutation(DELETE_TAG, {
    refetchQueries: [{ query: GET_TAGS }],
    onCompleted: () => {
      addToast({ type: 'success', title: 'Tag deleted' });
      setDeleteConfirmTag(null);
    },
    onError: (err) => addToast({ type: 'error', title: err.message }),
  });

  const tags: Tag[] = data?.tags || [];

  const filteredTags = useMemo(() => {
    let result = tags;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q));
    }
    if (filterMode === 'active') result = result.filter(t => t.isActive !== false);
    if (filterMode === 'inactive') result = result.filter(t => t.isActive === false);
    return result;
  }, [tags, searchQuery, filterMode]);

  const stats = useMemo(() => ({
    total: tags.length,
    active: tags.filter(t => t.isActive !== false).length,
    inactive: tags.filter(t => t.isActive === false).length,
    totalUsage: tags.reduce((sum, t) => sum + ((t as any)?.transactionsCount || 0), 0),
  }), [tags]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTag(null);
    setFormData({ name: '', colorHex: defaultColors[0] });
  };

  const openCreateModal = () => {
    setEditingTag(null);
    setFormData({ name: '', colorHex: defaultColors[Math.floor(Math.random() * defaultColors.length)] });
    setIsModalOpen(true);
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      colorHex: tag.colorHex || tag.color || defaultColors[0],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      addToast({ type: 'error', title: 'Tag name is required' });
      return;
    }
    if (editingTag) {
      updateTag({ variables: { id: editingTag.id, name: formData.name, colorHex: formData.colorHex } });
    } else {
      createTag({ variables: { input: { name: formData.name, color: formData.colorHex } } });
    }
  };

  const handleToggleActive = (tag: Tag) => {
    updateTag({
      variables: { id: tag.id, isActive: tag.isActive === false ? true : false },
    });
  };

  const handleDelete = () => {
    if (deleteConfirmTag) {
      deleteTag({ variables: { id: deleteConfirmTag.id } });
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-500">Error loading tags: {error.message}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Tags"
        subtitle={`${stats.total} tags · ${stats.totalUsage} transactions tagged`}
        actions={
          <Button onClick={openCreateModal} variant="primary" size="sm">
            <PlusIcon className="h-4 w-4 mr-1" />
            New Tag
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tags', value: stats.total, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Active', value: stats.active, color: 'text-green-600 dark:text-green-400' },
          { label: 'Inactive', value: stats.inactive, color: 'text-gray-500 dark:text-gray-400' },
          { label: 'Tagged Txns', value: stats.totalUsage, color: 'text-purple-600 dark:text-purple-400' },
        ].map(s => (
          <Card key={s.label}>
            <div className="p-4 text-center">
              <div className={clsx('text-2xl font-bold', s.color)}>{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['all', 'active', 'inactive'] as FilterMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors',
                filterMode === mode
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Tag List */}
      {filteredTags.length === 0 ? (
        <EmptyState
          icon={<TagIcon className="h-12 w-12" />}
          title={searchQuery ? 'No tags match your search' : 'No tags yet'}
          description={searchQuery ? 'Try a different search term.' : 'Create your first tag to start organizing transactions.'}
          actionLabel={!searchQuery ? 'Create Tag' : undefined}
          onAction={!searchQuery ? openCreateModal : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filteredTags.map(tag => (
            <Card key={tag.id}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                    style={{ backgroundColor: tag.colorHex || tag.color || '#6366f1' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'font-medium text-sm',
                        tag.isActive === false ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'
                      )}>
                        {tag.name}
                      </span>
                      {tag.isActive === false && (
                        <Badge variant="warning" size="sm">Inactive</Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(tag as any)?.transactionsCount || 0} transaction{((tag as any)?.transactionsCount || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(tag)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={tag.isActive === false ? 'Activate' : 'Deactivate'}
                  >
                    {tag.isActive === false ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEditModal(tag)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmTag(tag)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Delete"
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
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTag ? 'Edit Tag' : 'New Tag'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <Input
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., vacation, business, tax-deductible"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {defaultColors.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, colorHex: color }))}
                  className={clsx(
                    'w-8 h-8 rounded-full transition-all',
                    formData.colorHex === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preview
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: formData.colorHex }}
              >
                <TagIcon className="h-3 w-3" />
                {formData.name || 'tag name'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={closeModal} variant="secondary" size="sm">Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="sm"
            disabled={creating || updating || !formData.name.trim()}
          >
            {creating || updating ? 'Saving...' : editingTag ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmTag}
        onClose={() => setDeleteConfirmTag(null)}
        title="Delete Tag"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete <strong>{deleteConfirmTag?.name}</strong>?
          {((deleteConfirmTag as any)?.transactionsCount || 0) > 0 && (
            <> This tag is used on <strong>{(deleteConfirmTag as any)?.transactionsCount}</strong> transaction{((deleteConfirmTag as any)?.transactionsCount || 0) !== 1 ? 's' : ''}. They will be untagged.</>
          )}
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={() => setDeleteConfirmTag(null)} variant="secondary" size="sm">Cancel</Button>
          <Button onClick={handleDelete} variant="danger" size="sm">Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default TagsPage;
