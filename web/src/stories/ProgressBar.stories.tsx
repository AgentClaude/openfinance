import type { Meta, StoryObj } from '@storybook/react-vite';
import ProgressBar from '../components/ui/ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = { args: { value: 60, max: 100 } };
export const WithLabel: Story = { args: { value: 750, max: 1000, label: 'Budget Used', showPercentage: true } };
export const Success: Story = { args: { value: 30, max: 100, color: 'success', showPercentage: true } };
export const Warning: Story = { args: { value: 85, max: 100, color: 'warning', showPercentage: true } };
export const Danger: Story = { args: { value: 120, max: 100, color: 'danger', label: 'Over Budget', showPercentage: true } };
export const Small: Story = { args: { value: 50, max: 100, size: 'sm' } };
export const Large: Story = { args: { value: 50, max: 100, size: 'lg' } };
