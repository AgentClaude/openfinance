import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

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
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  navigation,
  isCollapsed = false,
  className,
}) => {
  const location = useLocation();

  const navigationWithCurrent = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href,
  }));

  return (
    <div
      className={clsx(
        'flex flex-col bg-slate-800 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-slate-900">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">OF</span>
              </div>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <h1 className="text-white text-lg font-semibold">
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
                className={clsx(
                  item.current
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isCollapsed ? 'justify-center' : ''
                )}
              >
                <IconComponent
                  className={clsx(
                    item.current ? 'text-white' : 'text-slate-400 group-hover:text-white',
                    'flex-shrink-0 h-6 w-6 transition-colors',
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
      </div>
    </div>
  );
};

export default Sidebar;