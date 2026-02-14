import type { Meta, StoryObj } from '@storybook/react-vite';
import FilterBar from '../components/shared/FilterBar';

const meta: Meta<typeof FilterBar> = {
  title: 'Shared/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FilterBar>;

export const DateOnly: Story = {
  args: {
    dateFrom: '2024-01-01',
    dateTo: '2024-06-30',
    onDateFromChange: () => {},
    onDateToChange: () => {},
  },
};

export const WithCategories: Story = {
  args: {
    dateFrom: '2024-01-01',
    dateTo: '2024-06-30',
    onDateFromChange: () => {},
    onDateToChange: () => {},
    categories: [
      { label: 'Food & Dining', value: '1' },
      { label: 'Transportation', value: '2' },
      { label: 'Shopping', value: '3' },
    ],
    onCategoryChange: () => {},
  },
};

export const FullFilters: Story = {
  args: {
    dateFrom: '2024-01-01',
    dateTo: '2024-06-30',
    onDateFromChange: () => {},
    onDateToChange: () => {},
    categories: [
      { label: 'Food & Dining', value: '1' },
      { label: 'Transportation', value: '2' },
    ],
    onCategoryChange: () => {},
    accounts: [
      { label: 'Checking ••1234', value: '1' },
      { label: 'Savings ••5678', value: '2' },
    ],
    onAccountChange: () => {},
    onReset: () => {},
  },
};
