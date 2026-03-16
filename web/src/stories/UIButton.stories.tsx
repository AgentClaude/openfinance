import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Button from '../components/ui/Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onClick: fn() },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: 'Save Changes', variant: 'primary' } };
export const Secondary: Story = { args: { children: 'Cancel', variant: 'secondary' } };
export const Danger: Story = { args: { children: 'Delete Account', variant: 'danger' } };
export const Ghost: Story = { args: { children: 'Learn More', variant: 'ghost' } };
export const Small: Story = { args: { children: 'Small', size: 'sm' } };
export const Medium: Story = { args: { children: 'Medium', size: 'md' } };
export const Large: Story = { args: { children: 'Large', size: 'lg' } };
export const Loading: Story = { args: { children: 'Saving...', loading: true } };
export const Disabled: Story = { args: { children: 'Disabled', disabled: true } };
export const SubmitButton: Story = { args: { children: 'Submit', type: 'submit' } };
