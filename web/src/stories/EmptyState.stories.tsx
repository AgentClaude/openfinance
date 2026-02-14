import type { Meta, StoryObj } from '@storybook/react-vite';
import { InboxIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';
import EmptyState from '../components/ui/EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No transactions',
    description: 'Get started by adding your first transaction.',
  },
};

export const WithIcon: Story = {
  args: {
    icon: <InboxIcon className="h-12 w-12" />,
    title: 'No data yet',
    description: 'Your data will appear here once available.',
  },
};

export const WithAction: Story = {
  args: {
    icon: <DocumentPlusIcon className="h-12 w-12" />,
    title: 'No accounts',
    description: 'Connect your first bank account to get started.',
    actionLabel: 'Add Account',
    onAction: () => alert('Add account clicked'),
  },
};
