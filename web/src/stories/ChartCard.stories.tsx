import type { Meta, StoryObj } from '@storybook/react-vite';
import ChartCard from '../components/shared/ChartCard';

const meta: Meta<typeof ChartCard> = {
  title: 'Shared/ChartCard',
  component: ChartCard,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ChartCard>;

export const Default: Story = {
  args: {
    title: 'Spending by Category',
    subtitle: 'Current month breakdown',
    children: (
      <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-400">
        Chart placeholder
      </div>
    ),
  },
};

export const WithActions: Story = {
  args: {
    title: 'Income vs Expenses',
    actions: (
      <select className="rounded-md border-gray-300 text-sm">
        <option>Last 6 months</option>
        <option>Last 12 months</option>
      </select>
    ),
    children: (
      <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-400">
        Chart placeholder
      </div>
    ),
  },
};
