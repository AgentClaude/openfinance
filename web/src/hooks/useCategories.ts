import { useQuery, useMutation } from '@apollo/client';
import { GET_CATEGORIES } from '@/graphql/queries';
import { CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY } from '@/graphql/mutations';
import { Category } from '@/types';

interface CreateCategoryInput {
  name: string;
  icon?: string;
  color?: string;
  groupName: string;
  parentId?: string;
}

interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

export const useCategories = () => {
  const { data, loading, error, refetch } = useQuery(GET_CATEGORIES);

  const [createCategoryMutation, { loading: creating }] = useMutation(
    CREATE_CATEGORY,
    {
      refetchQueries: [{ query: GET_CATEGORIES }],
    }
  );

  const [updateCategoryMutation, { loading: updating }] = useMutation(
    UPDATE_CATEGORY
  );

  const [deleteCategoryMutation, { loading: deleting }] = useMutation(
    DELETE_CATEGORY,
    {
      refetchQueries: [{ query: GET_CATEGORIES }],
    }
  );

  const categories: Category[] = data?.categories || [];

  const createCategory = async (input: CreateCategoryInput) => {
    try {
      const result = await createCategoryMutation({
        variables: { input },
      });
      return result.data.createCategory;
    } catch (error) {
      throw error;
    }
  };

  const updateCategory = async (id: string, input: UpdateCategoryInput) => {
    try {
      const result = await updateCategoryMutation({
        variables: { id, input },
      });
      return result.data.updateCategory;
    } catch (error) {
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteCategoryMutation({
        variables: { id },
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  const getCategoriesByGroup = () => {
    const grouped: Record<string, Category[]> = {};
    
    categories.forEach(category => {
      if (!category.parentId) { // Only top-level categories
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
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByGroup,
    getSubcategories,
    getCategoryById,
    getSystemCategories,
    getUserCategories,
    getCategoryPath,
  };
};