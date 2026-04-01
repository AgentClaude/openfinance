import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  /** If true, items show without a collapsible header (e.g. top-level Dashboard) */
  flat?: boolean;
}

interface SidebarProps {
  groups: NavGroup[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
  className?: string;
}

const STORAGE_KEY = 'openfinance-sidebar-groups';

function loadCollapsedGroups(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveCollapsedGroups(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const Sidebar: React.FC<SidebarProps> = ({
  groups,
  isCollapsed = false,
  onToggle,
  onItemClick,
  className,
}) => {
  const location = useLocation();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(loadCollapsedGroups);

  useEffect(() => {
    saveCollapsedGroups(collapsedGroups);
  }, [collapsedGroups]);

  const toggleGroup = useCallback((label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  // Auto-expand group that contains the active route
  useEffect(() => {
    for (const group of groups) {
      if (group.flat) continue;
      const hasActive = group.items.some(item => location.pathname === item.href);
      if (hasActive && collapsedGroups[group.label]) {
        setCollapsedGroups(prev => ({ ...prev, [group.label]: false }));
      }
    }
    // Only run on pathname change, not on collapsedGroups change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, groups]);

  return (
    <div
      className={clsx(
        'flex flex-col bg-gray-900 transition-all duration-300 ease-in-out h-full',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-gray-800">
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
          {onToggle && !isCollapsed && (
            <button
              onClick={onToggle}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded"
              aria-label="Collapse sidebar"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          )}
          {onToggle && isCollapsed && (
            <button
              onClick={onToggle}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded absolute left-4"
              aria-label="Expand sidebar"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation groups */}
        <nav className="mt-3 flex-1 px-2 space-y-1 overflow-y-auto scrollbar-thin" data-testid="sidebar-nav">
          {groups.map((group) => {
            const isGroupCollapsed = !!collapsedGroups[group.label];
            const hasActiveItem = group.items.some(item => location.pathname === item.href);

            if (group.flat) {
              return (
                <div key={group.label}>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      isActive={location.pathname === item.href}
                      isCollapsed={isCollapsed}
                      onClick={onItemClick}
                    />
                  ))}
                </div>
              );
            }

            return (
              <div key={group.label} className="pt-2">
                {/* Group header */}
                {!isCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-colors',
                      hasActiveItem
                        ? 'text-brand-400'
                        : 'text-gray-500 hover:text-gray-300'
                    )}
                    aria-expanded={!isGroupCollapsed}
                    aria-label={`${isGroupCollapsed ? 'Expand' : 'Collapse'} ${group.label}`}
                  >
                    <span>{group.label}</span>
                    <ChevronDownIcon
                      className={clsx(
                        'h-3.5 w-3.5 transition-transform duration-200',
                        isGroupCollapsed && '-rotate-90'
                      )}
                    />
                  </button>
                )}

                {/* Group items */}
                {(!isGroupCollapsed || isCollapsed) && (
                  <div className={clsx('space-y-0.5', !isCollapsed && 'mt-1')}>
                    {group.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        isActive={location.pathname === item.href}
                        isCollapsed={isCollapsed}
                        onClick={onItemClick}
                      />
                    ))}
                  </div>
                )}

                {/* Collapsed indicator: show a dot if group is collapsed but has active item */}
                {isGroupCollapsed && !isCollapsed && hasActiveItem && (
                  <div className="flex justify-center py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ item, isActive, isCollapsed, onClick }) => {
  const IconComponent = item.icon;
  return (
    <Link
      to={item.href}
      onClick={onClick}
      title={isCollapsed ? item.name : undefined}
      className={clsx(
        isActive
          ? 'bg-brand-700/20 text-brand-400 border-r-2 border-brand-400'
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
        'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
        isCollapsed ? 'justify-center' : ''
      )}
    >
      <IconComponent
        className={clsx(
          isActive ? 'text-brand-400' : 'text-gray-500 group-hover:text-gray-300',
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
};

export default Sidebar;
