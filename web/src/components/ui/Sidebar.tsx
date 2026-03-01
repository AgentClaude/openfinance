import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useThemeContext } from '@/components/ThemeProvider';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current?: boolean;
}

interface SidebarProps {
  navigation: NavItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  navigation,
  isCollapsed = false,
  onItemClick,
  className,
}) => {
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeContext();

  const navigationWithCurrent = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href,
  }));

  return (
    <div
      className={clsx(
        'flex flex-col bg-slate-900 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-slate-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">O</span>
              </div>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <h1 className="text-white text-lg font-semibold tracking-tight">
                  OpenFinance
                </h1>
              </div>
            )}
          </div>
        </div>
        
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigationWithCurrent.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onItemClick}
                className={clsx(
                  item.current
                    ? 'bg-brand-700/20 text-brand-400 border-r-2 border-brand-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                  isCollapsed ? 'justify-center' : ''
                )}
              >
                <IconComponent
                  className={clsx(
                    item.current ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300',
                    'flex-shrink-0 h-5 w-5 transition-colors',
                    !isCollapsed && 'mr-3'
                  )}
                  aria-hidden="true"
                />
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="flex-shrink-0 px-2 pb-4">
          <button
            onClick={toggleTheme}
            className={clsx(
              'group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
              'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
              isCollapsed ? 'justify-center' : ''
            )}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <SunIcon className={clsx('flex-shrink-0 h-5 w-5 text-amber-400', !isCollapsed && 'mr-3')} />
            ) : (
              <MoonIcon className={clsx('flex-shrink-0 h-5 w-5 text-slate-500 group-hover:text-slate-300', !isCollapsed && 'mr-3')} />
            )}
            {!isCollapsed && (
              <span className="truncate">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;