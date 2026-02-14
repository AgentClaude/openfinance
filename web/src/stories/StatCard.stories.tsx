import type { Meta, StoryObj } from '@storybook/react-vite';
import { CurrencyDollarIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import StatCard from '../components/shared/StatCard';

const meta: Meta<typeof StatCard> = {
  title: 'Shared/StatCard',
  component: StatCard,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    label: 'Total Income',
    value: '$12,450.00',
  },
};

export const WithTrendUp: Story = {
  args: {
    label: 'Net Worth',
    value: '$84,200',
    trend: { direction: 'up', value: '+5.2%' },
  },
};

export const WithTrendDown: Story = {
  args: {
    label: 'Monthly Expenses',
    value: '$3,200',
    trend: { direction: 'down', value: '-2.1%' },
    valueClassName: 'text-red-600',
  },
};

export const WithIcon: Story = {
  args: {
    label: 'Savings',
    value: '$9,250',
    icon: <BanknotesIcon className="h-6 w-6" />,
    trend: { direction: 'up', value: '+12%' },
  },
};

export const CustomColor: Story = {
  args: {
    label: 'Cash Flow',
    value: '$1,850',
    valueClassName: 'text-green-600',
  },
};
