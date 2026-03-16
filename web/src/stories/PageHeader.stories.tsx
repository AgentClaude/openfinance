import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

const meta: Meta<typeof PageHeader> = {
  title: 'UI/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Simple: Story = { args: { title: 'Transactions' } };
export const WithSubtitle: Story = {
  args: { title: 'Budget', subtitle: 'Track your spending against your plan' },
};
export const WithActions: Story = {
  args: {
    title: 'Accounts',
    subtitle: 'Manage your connected financial accounts',
    actions: React.createElement(
      'div',
      { className: 'flex gap-2' },
      React.createElement(Button, { variant: 'secondary', size: 'sm', children: 'Export' }),
      React.createElement(Button, { size: 'sm', children: '+ Add Account' }),
    ),
  },
};
