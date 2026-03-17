import type { Meta, StoryObj } from '@storybook/react-vite';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';

interface SampleRow {
  id: string;
  name: string;
  amount: number;
  status: string;
  category: string;
}

const sampleData: SampleRow[] = [
  { id: '1', name: 'Groceries', amount: 125.50, status: 'completed', category: 'Food' },
  { id: '2', name: 'Gas Station', amount: 45.00, status: 'pending', category: 'Transport' },
  { id: '3', name: 'Restaurant', amount: 82.30, status: 'completed', category: 'Food' },
  { id: '4', name: 'Subscription', amount: 14.99, status: 'recurring', category: 'Entertainment' },
  { id: '5', name: 'Electric Bill', amount: 156.22, status: 'completed', category: 'Utilities' },
  { id: '6', name: 'Gym Membership', amount: 49.99, status: 'recurring', category: 'Health' },
  { id: '7', name: 'Coffee Shop', amount: 6.50, status: 'completed', category: 'Food' },
  { id: '8', name: 'Internet', amount: 89.00, status: 'recurring', category: 'Utilities' },
  { id: '9', name: 'Parking', amount: 12.00, status: 'completed', category: 'Transport' },
  { id: '10', name: 'Streaming Service', amount: 15.99, status: 'recurring', category: 'Entertainment' },
  { id: '11', name: 'Hardware Store', amount: 67.45, status: 'completed', category: 'Home' },
  { id: '12', name: 'Phone Bill', amount: 75.00, status: 'completed', category: 'Utilities' },
];

const columns = [
  { key: 'name', label: 'Description', sortable: true },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    align: 'right' as const,
    cellClassName: 'tabular-nums font-medium',
    render: (row: SampleRow) => `$${row.amount.toFixed(2)}`,
  },
  { key: 'category', label: 'Category' },
  {
    key: 'status',
    label: 'Status',
    render: (row: SampleRow) => {
      const variant = row.status === 'completed' ? 'success' : row.status === 'pending' ? 'warning' : 'info';
      return <Badge variant={variant}>{row.status}</Badge>;
    },
  },
];

const meta: Meta<typeof DataTable<SampleRow>> = {
  title: 'UI/DataTable',
  component: DataTable,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DataTable<SampleRow>>;

export const Default: Story = {
  args: { columns, data: sampleData },
};

export const WithTitle: Story = {
  args: { columns, data: sampleData, title: 'Recent Transactions', subtitle: `(${sampleData.length})` },
};

export const Loading: Story = {
  args: { columns, data: [], loading: true },
};

export const Empty: Story = {
  args: { columns, data: [], emptyTitle: 'No transactions found', emptyDescription: 'Try adjusting your filters.' },
};

export const Sortable: Story = {
  args: { columns, data: sampleData, sortKey: 'amount', sortDirection: 'desc', onSort: () => {} },
};

export const Searchable: Story = {
  args: {
    columns,
    data: sampleData,
    title: 'Transactions',
    searchable: true,
    searchPlaceholder: 'Search transactions...',
    filterFn: (item: SampleRow, q: string) =>
      item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q),
  },
};

export const Paginated: Story = {
  args: {
    columns,
    data: sampleData,
    title: 'All Transactions',
    pagination: { pageSize: 5, pageSizeOptions: [5, 10, 25] },
  },
};

export const SearchableAndPaginated: Story = {
  args: {
    columns,
    data: sampleData,
    title: 'Transactions',
    searchable: true,
    searchPlaceholder: 'Filter...',
    pagination: { pageSize: 5, pageSizeOptions: [5, 10] },
  },
};

export const ExpandableRows: Story = {
  args: {
    columns,
    data: sampleData,
    title: 'Expandable Table',
    getRowId: (item: SampleRow) => item.id,
    renderExpandedRow: (item: SampleRow) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p><strong>ID:</strong> {item.id}</p>
        <p><strong>Category:</strong> {item.category}</p>
        <p><strong>Amount:</strong> ${item.amount.toFixed(2)}</p>
      </div>
    ),
  },
};

export const WithSelection: Story = {
  args: {
    columns,
    data: sampleData,
    getRowId: (item: SampleRow) => item.id,
    selectedIds: ['1', '3'],
    onSelectRow: () => {},
    onSelectAll: () => {},
  },
};
