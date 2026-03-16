import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';
import {
  HomeIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  CogIcon,
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

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Transactions', href: '/transactions', icon: BanknotesIcon },
  { name: 'Accounts', href: '/accounts', icon: CreditCardIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export const Expanded: Story = { args: { navigation, isCollapsed: false } };
export const Collapsed: Story = { args: { navigation, isCollapsed: true } };
