import type { Meta, StoryObj } from '@storybook/react-vite';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';

const meta: Meta<typeof PageContainer> = {
  title: 'Layout/PageContainer',
  component: PageContainer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Consistent page-level container that standardizes max-width and vertical spacing. Wraps page content inside AppLayout.',
      },
    },
  },
  argTypes: {
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageContainer>;

export const Default: Story = {
  args: {
    maxWidth: 'full',
    children: (
      <>
        <PageHeader title="Dashboard" subtitle="Overview of your finances" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Net Worth">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">$42,350</p>
          </Card>
          <Card title="Monthly Spending">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">$3,280</p>
          </Card>
          <Card title="Budget Remaining">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">$1,720</p>
          </Card>
        </div>
      </>
    ),
  },
};

export const NarrowSettings: Story = {
  args: {
    maxWidth: '4xl',
    children: (
      <>
        <PageHeader title="Settings" subtitle="Manage your preferences" />
        <Card title="Profile">
          <p className="text-sm text-gray-600 dark:text-gray-400">Profile settings content...</p>
        </Card>
        <Card title="Notifications">
          <p className="text-sm text-gray-600 dark:text-gray-400">Notification preferences...</p>
        </Card>
      </>
    ),
  },
};

export const CompactActivity: Story = {
  args: {
    maxWidth: '3xl',
    children: (
      <>
        <PageHeader title="Activity Feed" subtitle="See what's happening" />
        <Card>
          <div className="space-y-3">
            {['Categorized transaction: Starbucks → Coffee', 'Budget updated for March', 'New account connected: Chase'].map(
              (text, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm">
                    📋
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{text}</p>
                </div>
              ),
            )}
          </div>
        </Card>
      </>
    ),
  },
};
