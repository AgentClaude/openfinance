import { useQuery, useMutation } from '@apollo/client';
import { GET_TAGS } from '@/graphql/queries';
import { CREATE_TAG } from '@/graphql/mutations';
import { Tag } from '@/types';

interface CreateTagInput {
  name: string;
  color?: string;
}

export const useTags = () => {
  const { data, loading, error, refetch } = useQuery(GET_TAGS);

  const [createTagMutation, { loading: creating }] = useMutation(
    CREATE_TAG,
    {
      refetchQueries: [{ query: GET_TAGS }],
    }
  );

  const tags: Tag[] = data?.tags || [];

  const createTag = async (input: CreateTagInput) => {
    try {
      const result = await createTagMutation({
        variables: { input },
      });
      return result.data.createTag;
    } catch (error) {
      throw error;
    }
  };

  const getTagById = (id: string) => {
    return tags.find(tag => tag.id === id);
  };

  const getTagsByName = (name: string) => {
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(name.toLowerCase())
    );
  };

  return {
    tags,
    loading,
    creating,
    error,
    refetch,
    createTag,
    getTagById,
    getTagsByName,
  };
};