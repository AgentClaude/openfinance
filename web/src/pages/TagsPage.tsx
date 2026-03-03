import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_TAGS = gql`
  query GetTags {
    tags {
      id
      name
      color
      transactionCount
    }
  }
`;

const CREATE_TAG = gql`
  mutation CreateTag($name: String!, $color: String) {
    createTag(input: { name: $name, color: $color }) {
      id
      name
      color
    }
  }
`;

const DELETE_TAG = gql`
  mutation DeleteTag($id: ID!) {
    deleteTag(input: { id: $id }) {
      id
    }
  }
`;

export default function TagsPage() {
  const { data, loading } = useQuery(GET_TAGS);
  const [createTag] = useMutation(CREATE_TAG, { refetchQueries: ['GetTags'] });
  const [deleteTag] = useMutation(DELETE_TAG, { refetchQueries: ['GetTags'] });
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createTag({ variables: { name: newName.trim(), color: newColor } });
    setNewName('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Tags</h1>

      <form onSubmit={handleCreate} className="flex gap-3 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New tag name..."
          className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Add
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : !data?.tags?.length ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No tags yet</p>
          <p className="text-sm">Create tags to organize your transactions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.tags.map((tag: { id: string; name: string; color: string; transactionCount?: number }) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color || '#6366f1' }}
                />
                <span className="font-medium dark:text-white">{tag.name}</span>
                {tag.transactionCount != null && (
                  <span className="text-sm text-gray-500">
                    {tag.transactionCount} transaction{tag.transactionCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteTag({ variables: { id: tag.id } })}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
