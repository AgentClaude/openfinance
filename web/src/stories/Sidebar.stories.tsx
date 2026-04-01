import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';
import type { NavGroup } from '../components/ui/Sidebar';
import {
  HomeIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  CogIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';

const meta: Meta<typeof Sidebar> = {
  title: 'UI/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <div style={{ height: 500, display: 'flex' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Sidebar>;

const groups: NavGroup[] = [
  {
    label: 'Main',
    flat: true,
    items: [
      { name: 'Dashboard', href: '/', icon: HomeIcon },
    ],
  },
  {
    label: 'Money',
    items: [
      { name: 'Transactions', href: '/transactions', icon: BanknotesIcon },
      { name: 'Accounts', href: '/accounts', icon: CreditCardIcon },
      { name: 'Goals', href: '/goals', icon: FlagIcon },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    ],
  },
  {
    label: 'Settings',
    flat: true,
    items: [
      { name: 'Settings', href: '/settings', icon: CogIcon },
    ],
  },
];

export const Expanded: Story = { args: { groups, isCollapsed: false } };
export const Collapsed: Story = { args: { groups, isCollapsed: true } };
