import React, { useState } from 'react';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  TagIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/types';
import CategoryIcon from '@/components/ui/CategoryIcon';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Dropdown from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { FormField } from '@/components/shared';
import clsx from 'clsx';

const defaultColors = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
];

const groupOptions = [
  { value: 'Income', label: 'Income' },
  { value: 'Housing', label: 'Housing' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Food & Dining', label: 'Food & Dining' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Health', label: 'Health' },
  { value: 'Bills & Utilities', label: 'Bills & Utilities' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Debt Payments', label: 'Debt Payments' },
  { value: 'Pets', label: 'Pets' },
  { value: 'Kids', label: 'Kids' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Fees', label: 'Fees' },
  { value: 'Giving', label: 'Giving' },
  { value: 'Taxes', label: 'Taxes' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Other', label: 'Other' },
];

const CategoriesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: defaultColors[0],
    groupName: 'Other',
    parentId: '',
  });

  const {
    categories,
    loading,
    creating,
    updating,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryHidden,
    getCategoriesByGroup,
    getSubcategories,
    getSystemCategories,
    getUserCategories,
  } = useCategories({ includeHidden: showHidden });

  const { addToast } = useToast();

  const handleToggleHidden = async (category: Category) => {
    try {
      await toggleCategoryHidden(category.id, !category.isHidden);
      addToast({
        type: 'success',
        title: category.isHidden ? 'Category shown' : 'Category hidden',
        message: `${category.name} is now ${category.isHidden ? 'visible' : 'hidden'} in budgets and reports.`,
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to update category',
        message: error.message || 'An error occurred.',
      });
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '',
      color: defaultColors[0],
      groupName: 'Other',
      parentId: '',
    });
    setEditingCategory(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon || '',
      color: category.color || defaultColors[0],
      groupName: category.groupName,
      parentId: category.parentId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const categoryData = {
      name: formData.name,
      icon: formData.icon || undefined,
      color: formData.color,
      groupName: formData.groupName,
      parentId: formData.parentId || undefined,
    };

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        addToast({
          type: 'success',
          title: 'Category updated',
          message: `${formData.name} has been updated successfully.`,
        });
      } else {
        await createCategory(categoryData);
        addToast({
          type: 'success',
          title: 'Category created',
          message: `${formData.name} has been created successfully.`,
        });
      }
      
      handleModalClose();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: editingCategory ? 'Failed to update category' : 'Failed to create category',
        message: error.message || 'An error occurred while saving the category.',
      });
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.isSystem) {
      addToast({
        type: 'error',
        title: 'Cannot delete system category',
        message: 'System categories cannot be deleted.',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      await deleteCategory(category.id);
      addToast({
        type: 'success',
        title: 'Category deleted',
        message: `${category.name} has been deleted successfully.`,
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to delete category',
        message: error.message || 'An error occurred while deleting the category.',
      });
    }
  };

  const categoriesByGroup = getCategoriesByGroup();
  const parentCategoryOptions = [
    { value: '', label: 'None (Top-level category)' },
    ...categories.filter(cat => !cat.parentId).map(category => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const isFormValid = formData.name.trim();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Categories" 
        subtitle={`${getUserCategories().length} custom, ${getSystemCategories().length} system${showHidden ? ' (showing hidden)' : ''}`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowHidden(!showHidden)}
              className={showHidden ? 'text-brand-600 dark:text-brand-400' : ''}
            >
              {showHidden ? <EyeSlashIcon className="h-4 w-4 mr-1.5" /> : <EyeIcon className="h-4 w-4 mr-1.5" />}
              {showHidden ? 'Hide Hidden' : 'Show Hidden'}
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        }
      />

      {Object.keys(categoriesByGroup).length === 0 ? (
        <EmptyState
          icon={<TagIcon className="h-12 w-12" />}
          title="No categories yet"
          description="Create your first category to start organizing your transactions."
          actionLabel="Add Category"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(categoriesByGroup).map(([groupName, groupCategories]) => (
            <Card key={groupName} title={groupName}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupCategories.map(category => {
                  const subcategories = getSubcategories(category.id);
                  
                  const menuItems = [
                    {
                      label: category.isHidden ? 'Show' : 'Hide',
                      icon: category.isHidden ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />,
                      onClick: () => handleToggleHidden(category),
                    },
                    ...(!category.isSystem ? [
                      {
                        label: 'Edit',
                        icon: <PencilIcon className="h-4 w-4" />,
                        onClick: () => handleEdit(category),
                      },
                      {
                        label: 'Delete',
                        icon: <TrashIcon className="h-4 w-4" />,
                        onClick: () => handleDelete(category),
                        variant: 'danger' as const,
                      },
                    ] : []),
                  ];

                  return (
                    <div
                      key={category.id}
                      className={clsx(
                        'p-4 border rounded-lg hover:shadow-md transition-shadow',
                        category.isHidden
                          ? 'border-dashed border-gray-300 dark:border-gray-600 opacity-60'
                          : 'border-gray-200 dark:border-gray-700'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {category.icon && <CategoryIcon icon={category.icon} className="text-lg" />}
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className={clsx(
                            'font-medium',
                            category.isHidden ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
                          )}>{category.name}</span>
                          {category.isSystem && (
                            <LockClosedIcon className="h-4 w-4 text-gray-400" title="System category" />
                          )}
                          {category.isHidden && (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" title="Hidden category" />
                          )}
                        </div>
                        
                        <Dropdown
                          triggerLabel={`Actions for ${category.name}`}
                          trigger={
                            <PencilIcon className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                          }
                          items={menuItems}
                          align="right"
                        />
                      </div>

                      {subcategories.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Subcategories:</div>
                          <div className="flex flex-wrap gap-1">
                            {subcategories.map(subcategory => (
                              <Badge
                                key={subcategory.id}
                                variant="secondary"
                                size="sm"
                                style={{
                                  backgroundColor: subcategory.color + '20',
                                  color: subcategory.color,
                                }}
                              >
                                {subcategory.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        {category.transactionCount ?? 0} transaction{category.transactionCount === 1 ? '' : 's'} this month
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            placeholder="e.g., Groceries, Gas, Entertainment"
            required
          />

          <Select
            label="Group"
            options={groupOptions}
            value={formData.groupName}
            onChange={(e) => handleFormChange('groupName', e.target.value)}
            required
          />

          <Select
            label="Parent Category (Optional)"
            options={parentCategoryOptions}
            value={formData.parentId}
            onChange={(e) => handleFormChange('parentId', e.target.value)}
          />

          <Input
            label="Icon (Optional)"
            value={formData.icon}
            onChange={(e) => handleFormChange('icon', e.target.value)}
            placeholder="🍔 (paste emoji)"
            helperText="Paste an emoji to use as the category icon"
          />

          <FormField label="Color">
            <div className="flex flex-wrap gap-2">
              {defaultColors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={clsx(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    formData.color === color
                      ? 'border-gray-400 scale-110'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleFormChange('color', color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleModalClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={creating || updating}
              disabled={!isFormValid}
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;