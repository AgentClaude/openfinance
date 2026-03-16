import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import Dropdown from '../components/ui/Dropdown';
import Button from '../components/ui/Button';

const meta: Meta<typeof Dropdown> = {
  title: 'UI/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => React.createElement('div', { style: { minHeight: 250 } }, React.createElement(Story)),
  ],
};
export default meta;
type Story = StoryObj<typeof Dropdown>;

const defaultItems = [
  { label: 'Edit', onClick: () => console.log('Edit') },
  { label: 'Duplicate', onClick: () => console.log('Duplicate') },
  { label: 'Archive', onClick: () => console.log('Archive'), disabled: true },
  { label: 'Delete', onClick: () => console.log('Delete'), variant: 'danger' as const },
];

export const Default: Story = {
  args: {
    trigger: React.createElement(Button, { variant: 'secondary', size: 'sm', children: 'Actions ▾' }),
    items: defaultItems,
  },
};

export const AlignLeft: Story = {
  args: {
    trigger: React.createElement(Button, { variant: 'secondary', size: 'sm', children: 'Options ▾' }),
    items: defaultItems,
    align: 'left',
  },
};
