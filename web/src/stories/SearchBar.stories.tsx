import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import SearchBar from '../components/ui/SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'UI/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => React.createElement('div', { style: { maxWidth: 400 } }, React.createElement(Story))],
};
export default meta;
type Story = StoryObj<typeof SearchBar>;

const SearchBarDemo = (props: { placeholder?: string; debounceMs?: number }) => {
  const [query, setQuery] = useState('');
  return (
    <div className="space-y-2">
      <SearchBar query={query} onChange={setQuery} {...props} />
      <p className="text-sm text-gray-500">Current value: "{query}"</p>
    </div>
  );
};

export const Default: Story = {
  render: () => <SearchBarDemo />,
};

export const CustomPlaceholder: Story = {
  render: () => <SearchBarDemo placeholder="Search transactions..." />,
};

export const FastDebounce: Story = {
  render: () => <SearchBarDemo placeholder="Fast search..." debounceMs={100} />,
};
