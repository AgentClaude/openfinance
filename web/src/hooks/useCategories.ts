import { useQuery, useMutation } from '@apollo/client';
import { GET_CATEGORIES } from '@/graphql/queries';
import { CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY, TOGGLE_CATEGORY_HIDDEN } from '@/graphql/mutations';
import { Category } from '@/types';

interface CreateCategoryInput {
  name: string;
  icon?: string;
  color?: string;
  groupName: string;
  parentId?: string;
}

interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

interface UseCategoriesOptions {
  includeHidden?: boolean;
}

export const useCategories = (options: UseCategoriesOptions = {}) => {
  const { includeHidden = false } = options;

  const { data, loading, error, refetch } = useQuery(GET_CATEGORIES, {
    variables: { includeHidden },
  });

  const [createCategoryMutation, { loading: creating }] = useMutation(
    CREATE_CATEGORY,
    {
      refetchQueries: [{ query: GET_CATEGORIES, variables: { includeHidden } }],
    }
  );

  const [updateCategoryMutation, { loading: updating }] = useMutation(
    UPDATE_CATEGORY
  );

  const [deleteCategoryMutation, { loading: deleting }] = useMutation(
    DELETE_CATEGORY,
    {
      refetchQueries: [{ query: GET_CATEGORIES, variables: { includeHidden } }],
    }
  );

  const [toggleHiddenMutation, { loading: togglingHidden }] = useMutation(
    TOGGLE_CATEGORY_HIDDEN,
    {
      refetchQueries: [{ query: GET_CATEGORIES, variables: { includeHidden } }],
    }
  );

  const categories: Category[] = data?.categories || [];

  const createCategory = async (input: CreateCategoryInput) => {
    const result = await createCategoryMutation({
      variables: { input },
    });
    return result.data.createCategory;
  };

  const updateCategory = async (id: string, input: UpdateCategoryInput) => {
    const result = await updateCategoryMutation({
      variables: { id, input },
    });
    return result.data.updateCategory;
  };

  const deleteCategory = async (id: string) => {
    await deleteCategoryMutation({
      variables: { id },
    });
    return true;
  };

  const toggleCategoryHidden = async (id: string, hidden: boolean) => {
    const result = await toggleHiddenMutation({
      variables: { id, hidden },
    });
    return result.data.toggleCategoryHidden;
  };

  const getCategoriesByGroup = () => {
    const grouped: Record<string, Category[]> = {};
    
    categories.forEach(category => {
      if (!category.parentId) {
        if (!grouped[category.groupName]) {
          grouped[category.groupName] = [];
        }
        grouped[category.groupName].push(category);
      }
    });

    return grouped;
  };

  const getSubcategories = (parentId: string) => {
    return categories.filter(category => category.parentId === parentId);
  };

  const getCategoryById = (id: string) => {
    return categories.find(category => category.id === id);
  };

  const getSystemCategories = () => {
    return categories.filter(category => category.isSystem);
  };

  const getUserCategories = () => {
    return categories.filter(category => !category.isSystem);
  };

  const getCategoryPath = (categoryId: string): string => {
    const category = getCategoryById(categoryId);
    if (!category) return '';

    if (category.parentId) {
      const parent = getCategoryById(category.parentId);
      return parent ? `${parent.name} > ${category.name}` : category.name;
    }

    return category.name;
  };

  return {
    categories,
    loading,
    creating,
    updating,
    deleting,
    togglingHidden,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryHidden,
    getCategoriesByGroup,
    getSubcategories,
    getCategoryById,
    getSystemCategories,
    getUserCategories,
    getCategoryPath,
  };
};
