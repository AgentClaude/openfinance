import type { Meta, StoryObj } from '@storybook/react-vite';
import FormField from '../components/shared/FormField';

const meta: Meta<typeof FormField> = {
  title: 'Shared/FormField',
  component: FormField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    label: 'Email Address',
    children: (
      <input
        type="email"
        placeholder="you@example.com"
        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
      />
    ),
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    error: 'Password must be at least 8 characters',
    children: (
      <input
        type="password"
        className="block w-full rounded-lg border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
      />
    ),
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Username',
    helperText: 'Only letters, numbers, and underscores',
    children: (
      <input
        type="text"
        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
      />
    ),
  },
};

export const Required: Story = {
  args: {
    label: 'Full Name',
    required: true,
    children: (
      <input
        type="text"
        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
      />
    ),
  },
};
