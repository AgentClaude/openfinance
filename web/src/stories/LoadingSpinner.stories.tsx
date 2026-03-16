import type { Meta, StoryObj } from '@storybook/react-vite';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

export const Small: Story = { args: { size: 'sm' } };
export const Medium: Story = { args: { size: 'md' } };
export const Large: Story = { args: { size: 'lg' } };
export const CustomColor: Story = { args: { size: 'md', className: 'text-brand-600' } };
