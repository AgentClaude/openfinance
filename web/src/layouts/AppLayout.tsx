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
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/ui/Sidebar';
import Avatar from '@/components/ui/Avatar';
import Dropdown from '@/components/ui/Dropdown';
import { Transition } from '@headlessui/react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Transactions', href: '/transactions', icon: CreditCardIcon },
  { name: 'Accounts', href: '/accounts', icon: BanknotesIcon },
  { name: 'Goals', href: '/goals', icon: FlagIcon },
  { name: 'Budget', href: '/budget', icon: ChartBarIcon },
  { name: 'Recurring', href: '/recurring', icon: ArrowPathIcon },
  { name: 'Categories', href: '/categories', icon: TagIcon },
  { name: 'Investments', href: '/investments', icon: ChartBarIcon },
  { name: 'Goals', href: '/goals', icon: FlagIcon },
  { name: 'Reports', href: '/reports', icon: ChartPieIcon },
  { name: 'Import', href: '/import', icon: ArrowUpTrayIcon },
  { name: 'Rules', href: '/rules', icon: BoltIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
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
    <div className="h-screen flex overflow-hidden bg-gray-100">
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
              <Sidebar navigation={navigation} />
            </div>
          </Transition.Child>
        </div>
      </Transition>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar 
          navigation={navigation} 
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              {/* Search bar could go here */}
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications button could go here */}
              
              {/* Profile dropdown */}
              <Dropdown
                trigger={
                  <button className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <Avatar 
                      name={user?.name || 'User'} 
                      size="sm"
                      className="hover:opacity-80 transition-opacity"
                    />
                  </button>
                }
                items={userMenuItems}
                align="right"
              />
              
              {/* Household name */}
              {user?.household && (
                <div className="hidden md:flex flex-col items-end">
                  <div className="text-sm font-medium text-gray-900">
                    {user.household.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.household.currency}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
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