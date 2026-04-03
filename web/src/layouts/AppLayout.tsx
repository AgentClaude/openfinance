import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  HomeIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
  TagIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  BoltIcon,
  ArrowPathIcon,
  ChartPieIcon,
  ArrowUpTrayIcon,
  FlagIcon,
  MagnifyingGlassIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  HeartIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CalculatorIcon,
  FireIcon,
  ChartBarSquareIcon,
  QueueListIcon,
  ScaleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import Sidebar, { type NavGroup } from '@/components/ui/Sidebar';
import Avatar from '@/components/ui/Avatar';
import Dropdown from '@/components/ui/Dropdown';
import NotificationBell from '@/components/NotificationBell';
import CommandPalette from '@/components/CommandPalette';
import { Transition } from '@headlessui/react';

const navigationGroups: NavGroup[] = [
  {
    label: 'Main',
    flat: true,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ],
  },
  {
    label: 'Money',
    items: [
      { name: 'Transactions', href: '/transactions', icon: CreditCardIcon },
      { name: 'Accounts', href: '/accounts', icon: BanknotesIcon },
      { name: 'Budget', href: '/budget', icon: ChartBarIcon },
      { name: 'Recurring', href: '/recurring', icon: ArrowPathIcon },
      { name: 'Subscriptions', href: '/subscriptions', icon: QueueListIcon },
      { name: 'Goals', href: '/goals', icon: FlagIcon },
    ],
  },
  {
    label: 'Wealth',
    items: [
      { name: 'Net Worth', href: '/net-worth', icon: ChartPieIcon },
      { name: 'Investments', href: '/investments', icon: ArrowTrendingUpIcon },
      { name: 'Debt Payoff', href: '/debt-payoff', icon: CalculatorIcon },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { name: 'Reports', href: '/reports', icon: ChartPieIcon },
      { name: 'Insights', href: '/insights', icon: LightBulbIcon },
      { name: 'Spending Heatmap', href: '/spending-heatmap', icon: ChartBarSquareIcon },
      { name: 'Forecast', href: '/forecast', icon: ArrowTrendingUpIcon },
      { name: 'Health Score', href: '/health', icon: HeartIcon },
      { name: 'Savings Rate', href: '/savings-rate', icon: BanknotesIcon },
      { name: 'Comparison', href: '/spending-comparison', icon: ScaleIcon },
    ],
  },
  {
    label: 'Summaries',
    items: [
      { name: 'Monthly Recap', href: '/monthly-recap', icon: CalendarDaysIcon },
      { name: 'Year in Review', href: '/year-in-review', icon: CalendarDaysIcon },
      { name: 'Tax Summary', href: '/tax-summary', icon: DocumentTextIcon },
      { name: 'FIRE Calculator', href: '/fire-calculator', icon: FireIcon },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Import', href: '/import', icon: ArrowUpTrayIcon },
      { name: 'Categories', href: '/categories', icon: TagIcon },
      { name: 'Rules', href: '/rules', icon: BoltIcon },
      { name: 'Merchants', href: '/merchant-mappings', icon: ArrowsRightLeftIcon },
      { name: 'Connections', href: '/connections', icon: LinkIcon },
      { name: 'Activity', href: '/activity', icon: ClockIcon },
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

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const userMenuItems = [
    {
      label: 'Profile',
      icon: <CogIcon className="h-4 w-4" />,
      onClick: () => console.log('Profile clicked'),
    },
    {
      label: 'Settings',
      icon: <CogIcon className="h-4 w-4" />,
      onClick: () => console.log('Settings clicked'),
    },
    {
      label: 'Sign out',
      icon: null,
      onClick: logout,
      variant: 'danger' as const,
    },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      <CommandPalette />
      {/* Mobile sidebar */}
      <Transition show={sidebarOpen}>
        <div className="relative z-40 md:hidden">
          <Transition.Child
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
          </Transition.Child>

          <Transition.Child
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full">
              <Transition.Child
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6 text-white" />
                  </button>
                </div>
              </Transition.Child>
              <Sidebar groups={navigationGroups} onItemClick={() => setSidebarOpen(false)} />
            </div>
          </Transition.Child>
        </div>
      </Transition>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar 
          groups={navigationGroups} 
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Toggle menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <button
                onClick={() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Search (⌘K)"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-600 shadow-sm">⌘K</kbd>
              </button>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <NotificationBell />
              
              <Dropdown
                triggerLabel="User menu"
                trigger={
                  <Avatar 
                    name={user?.name || 'User'} 
                    size="sm"
                    className="hover:opacity-80 transition-opacity"
                  />
                }
                items={userMenuItems}
                align="right"
              />
              
              {user?.household && (
                <div className="hidden md:flex flex-col items-end">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.household.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user.household.currency}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none" tabIndex={0} role="main">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
