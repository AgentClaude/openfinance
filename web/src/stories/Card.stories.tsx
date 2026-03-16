import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  args: {
    children: React.createElement('p', { className: 'text-gray-600 dark:text-gray-400' }, 'Simple card content.'),
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Net Worth',
    subtitle: 'Your total assets minus liabilities',
    children: React.createElement('p', { className: 'text-3xl font-bold text-gray-900 dark:text-gray-100' }, '$125,430.00'),
  },
};

export const WithActions: Story = {
  args: {
    title: 'Recent Transactions',
    actions: React.createElement(Button, { variant: 'secondary', size: 'sm', children: 'View All' }),
    children: React.createElement('p', { className: 'text-gray-500' }, 'Transaction list would go here.'),
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Budget Summary',
    children: React.createElement('p', { className: 'text-gray-600 dark:text-gray-400' }, 'You\'ve spent $2,340 of $3,000 this month.'),
    footer: React.createElement('div', { className: 'text-sm text-gray-500' }, 'Updated 5 minutes ago'),
  },
};

export const Clickable: Story = {
  args: {
    title: 'Checking Account',
    subtitle: 'Chase ••4521',
    children: React.createElement('p', { className: 'text-2xl font-bold text-gray-900 dark:text-gray-100' }, '$8,421.30'),
    onClick: () => alert('Card clicked'),
    className: 'cursor-pointer hover:shadow-md transition-shadow',
  },
};
