import type { Meta, StoryObj } from '@storybook/react-vite';
import Badge from '../components/ui/Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: 'Default' } };
export const Success: Story = { args: { children: 'Completed', variant: 'success' } };
export const Warning: Story = { args: { children: 'Pending', variant: 'warning' } };
export const Danger: Story = { args: { children: 'Overdue', variant: 'danger' } };
export const Info: Story = { args: { children: 'New', variant: 'info' } };
export const Small: Story = { args: { children: 'Small', size: 'sm', variant: 'success' } };
