import type { Meta, StoryObj } from '@storybook/react-vite';
import DataTable from '../components/ui/DataTable';

interface SampleRow {
  id: string;
  name: string;
  amount: number;
  status: string;
}

const sampleData: SampleRow[] = [
  { id: '1', name: 'Groceries', amount: 125.50, status: 'completed' },
  { id: '2', name: 'Gas Station', amount: 45.00, status: 'pending' },
  { id: '3', name: 'Restaurant', amount: 82.30, status: 'completed' },
  { id: '4', name: 'Subscription', amount: 14.99, status: 'recurring' },
];

const columns = [
  { key: 'name', label: 'Description', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, render: (row: SampleRow) => `$${row.amount.toFixed(2)}` },
  { key: 'status', label: 'Status' },
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

export const Loading: Story = {
  args: { columns, data: [], loading: true },
};

export const Empty: Story = {
  args: { columns, data: [], emptyTitle: 'No transactions found', emptyDescription: 'Try adjusting your filters.' },
};

export const Sortable: Story = {
  args: { columns, data: sampleData, sortKey: 'amount', sortDirection: 'desc', onSort: () => {} },
};
