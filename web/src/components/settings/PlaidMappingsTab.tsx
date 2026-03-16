import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PLAID_CATEGORY_MAPPINGS, GET_CATEGORIES } from '@/graphql/queries';
import {
  SEED_PLAID_CATEGORY_MAPPINGS,
  UPDATE_PLAID_CATEGORY_MAPPING,
  RESET_PLAID_CATEGORY_MAPPINGS,
} from '@/graphql/mutations';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';

interface PlaidMapping {
  id: string;
  plaidPrimary: string;
  plaidDetailed: string | null;
  isDefault: boolean;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    groupName: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  groupName: string | null;
}

function formatPlaidCategory(key: string): string {
  return key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PlaidMappingsTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { data: mappingsData, loading: mappingsLoading, refetch } = useQuery(GET_PLAID_CATEGORY_MAPPINGS);
  const { data: categoriesData } = useQuery(GET_CATEGORIES, { variables: { includeHidden: false } });

  const [seedMappings, { loading: seeding }] = useMutation(SEED_PLAID_CATEGORY_MAPPINGS, {
    onCompleted: (data) => {
      const { created, skipped } = data.seedPlaidCategoryMappings;
      toast.success(`Created ${created} mappings (${skipped} already existed)`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [updateMapping] = useMutation(UPDATE_PLAID_CATEGORY_MAPPING, {
    onCompleted: () => {
      toast.success('Mapping updated');
      setEditingId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [resetMappings, { loading: resetting }] = useMutation(RESET_PLAID_CATEGORY_MAPPINGS, {
    onCompleted: (data) => {
      toast.success(`Mappings reset — ${data.resetPlaidCategoryMappings.created} defaults created`);
      setShowResetConfirm(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const mappings: PlaidMapping[] = mappingsData?.plaidCategoryMappings ?? [];
  const categories: Category[] = categoriesData?.categories ?? [];

  // Group by primary category
  const grouped = mappings.reduce<Record<string, PlaidMapping[]>>((acc, m) => {
    if (!acc[m.plaidPrimary]) acc[m.plaidPrimary] = [];
    acc[m.plaidPrimary].push(m);
    return acc;
  }, {});

  const categoryOptions = categories
    .map((c) => ({ value: c.id, label: `${c.icon || '📁'} ${c.name}` }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (mappingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Plaid Category Mappings">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Map Plaid's financial categories to your OpenFinance categories. When transactions sync
          from your bank, these mappings determine the default category. You can customize any mapping
          — custom mappings override defaults.
        </p>

        <div className="flex items-center gap-3 mb-6">
          {mappings.length === 0 ? (
            <Button onClick={() => seedMappings()} loading={seeding}>
              🌱 Seed Default Mappings
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => seedMappings()} loading={seeding}>
                🌱 Add Missing Defaults
              </Button>
              {!showResetConfirm ? (
                <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(true)}>
                  🔄 Reset to Defaults
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 dark:text-red-400">Delete all custom mappings?</span>
                  <Button variant="danger" size="sm" onClick={() => resetMappings()} loading={resetting}>
                    Confirm Reset
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {mappings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏦</p>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No mappings configured</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Seed default mappings to automatically categorize Plaid transactions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([primary, items]) => (
                <div key={primary} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatPlaidCategory(primary)}
                    </h4>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {items
                      .sort((a, b) => {
                        // Primary (no detailed) first, then by detailed
                        if (!a.plaidDetailed && b.plaidDetailed) return -1;
                        if (a.plaidDetailed && !b.plaidDetailed) return 1;
                        return (a.plaidDetailed || '').localeCompare(b.plaidDetailed || '');
                      })
                      .map((mapping) => (
                        <div
                          key={mapping.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {mapping.plaidDetailed
                                  ? formatPlaidCategory(mapping.plaidDetailed)
                                  : formatPlaidCategory(primary) + ' (default)'}
                              </p>
                              {mapping.plaidDetailed && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
                                  {mapping.plaidDetailed}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {editingId === mapping.id ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={mapping.category.id}
                                  onChange={(e) => {
                                    updateMapping({
                                      variables: { id: mapping.id, categoryId: e.target.value },
                                    });
                                  }}
                                  options={categoryOptions}
                                  className="w-48"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingId(null)}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingId(mapping.id)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                              >
                                <span>{mapping.category.icon || '📁'}</span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                  {mapping.category.name}
                                </span>
                                {!mapping.isDefault && (
                                  <Badge variant="info" className="ml-1 !text-xs !py-0">
                                    Custom
                                  </Badge>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      <Card title="How It Works">
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
          <p>
            When Plaid syncs transactions from your bank, each transaction includes a category.
            OpenFinance uses these mappings to automatically assign your own categories.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">1. Detailed Match</p>
              <p className="text-xs">Tries the most specific Plaid sub-category first (e.g., "Food And Drink Coffee" → Coffee).</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">2. Primary Match</p>
              <p className="text-xs">Falls back to the broad category (e.g., "Food And Drink" → Restaurants).</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">3. Rules Engine</p>
              <p className="text-xs">If no mapping matches, your categorization rules are applied as a last resort.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
