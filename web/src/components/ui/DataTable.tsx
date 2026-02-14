import React from 'react';
import clsx from 'clsx';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { ColumnConfig } from '@/types';

interface DataTableProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (item: T) => void;
  selectedIds?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
  getRowId?: (item: T) => string;
  className?: string;
}

function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No data',
  emptyDescription,
  emptyIcon,
  onSort,
  sortKey,
  sortDirection,
  onRowClick,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  getRowId,
  className,
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;
    
    const newDirection = 
      sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const isAllSelected = selectedIds.length > 0 && selectedIds.length === data.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < data.length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        className="py-8"
      />
    );
  }

  return (
    <div className={clsx('overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-slate-800/50">
          <tr>
            {(onSelectRow || onSelectAll) && (
              <th scope="col" className="relative w-12 px-6 py-3">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-700"
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={clsx(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                  column.sortable && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-700',
                  column.width && `w-${column.width}`
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <span className="ml-2 flex-none rounded text-gray-400">
                      {sortKey === column.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronUpIcon className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-slate-800">
          {data.map((item, index) => {
            const rowId = getRowId?.(item) || index.toString();
            const isSelected = selectedIds.includes(rowId);
            
            return (
              <tr
                key={rowId}
                className={clsx(
                  'hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors',
                  onRowClick && 'cursor-pointer',
                  isSelected && 'bg-brand-50'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {onSelectRow && (
                  <td className="relative w-12 px-6 py-4">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-700"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectRow(rowId);
                      }}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                  >
                    {column.render
                      ? column.render(item)
                      : (item as any)[column.key]
                    }
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;