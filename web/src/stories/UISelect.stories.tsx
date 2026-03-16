import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import Select from '../components/ui/Select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => React.createElement('div', { style: { maxWidth: 400 } }, React.createElement(Story))],
};
export default meta;
type Story = StoryObj<typeof Select>;

const categoryOptions = [
  { value: 'food', label: 'Food & Drink' },
  { value: 'housing', label: 'Housing' },
  { value: 'transport', label: 'Transportation' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'entertainment', label: 'Entertainment' },
];

const accountOptions = [
  { value: 'checking', label: 'Checking ••4521' },
  { value: 'savings', label: 'Savings ••8923' },
  { value: 'credit', label: 'Credit Card ••1234' },
  { value: 'closed', label: 'Old Account (closed)', disabled: true },
];

export const Default: Story = { args: { options: categoryOptions, placeholder: 'Select category' } };
export const WithLabel: Story = { args: { label: 'Category', options: categoryOptions, placeholder: 'Choose...' } };
export const WithError: Story = { args: { label: 'Account', options: accountOptions, error: 'Please select an account' } };
export const WithDisabledOption: Story = { args: { label: 'Account', options: accountOptions, placeholder: 'Pick account' } };
export const Disabled: Story = { args: { label: 'Category', options: categoryOptions, disabled: true, value: 'food' } };
