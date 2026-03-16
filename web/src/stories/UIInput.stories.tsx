import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import Input from '../components/ui/Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => React.createElement('div', { style: { maxWidth: 400 } }, React.createElement(Story))],
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = { args: { placeholder: 'Enter text...' } };
export const WithLabel: Story = { args: { label: 'Email', placeholder: 'you@example.com', type: 'email' } };
export const WithError: Story = { args: { label: 'Password', type: 'password', error: 'Password must be at least 8 characters', value: 'short' } };
export const WithHelperText: Story = { args: { label: 'Username', placeholder: 'johndoe', helperText: 'This will be your display name' } };
export const Disabled: Story = { args: { label: 'Read Only', value: 'Cannot edit this', disabled: true } };
export const NumberInput: Story = { args: { label: 'Amount', type: 'number', placeholder: '0.00' } };
