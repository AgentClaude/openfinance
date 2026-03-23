import React, { useState, useMemo, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { ColumnConfig } from '@/types';

export interface PaginationConfig {
  pageSize: number;
  pageSizeOptions?: number[];
}

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
  /** Enable client-side pagination */
  pagination?: PaginationConfig;
  /** Enable search bar — filters rows using filterFn or default text match */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Custom filter function for search */
  filterFn?: (item: T, query: string) => boolean;
  /** Render an expandable detail row beneath a data row */
  renderExpandedRow?: (item: T) => React.ReactNode;
  /** Title shown above the table */
  title?: string;
  /** Subtitle text next to the title */
  subtitle?: string;
  /** Actions rendered in the header bar (right side) */
  headerActions?: React.ReactNode;
  /** Footer content (e.g. totals row) */
  footer?: React.ReactNode;
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
  pagination,
  searchable = false,
  searchPlaceholder = 'Search...',
  filterFn,
  renderExpandedRow,
  title,
  subtitle,
  headerActions,
  footer,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize ?? 25);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    if (filterFn) return data.filter((item) => filterFn(item, query));

    // Default: search all string values in the item
    return data.filter((item) => {
      return Object.values(item as Record<string, unknown>).some(
        (val) => typeof val === 'string' && val.toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery, searchable, filterFn]);

  // Pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(filteredData.length / pageSize)) : 1;
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pagination, currentPage, pageSize]);

  // Reset page when data or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleSort = (key: string) => {
    if (!onSort) return;
    const newDirection =
      sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const showHeader = title || searchable || headerActions;
  const colCount = columns.length + (onSelectRow || onSelectAll ? 1 : 0) + (renderExpandedRow ? 1 : 0);

  return (
    <div className={clsx('overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      {/* Table header bar */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            {title && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                  {subtitle && (
                    <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                      {subtitle}
                    </span>
                  )}
                </h2>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {searchable && (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  aria-label="Search table"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-48 sm:w-64"
                />
              </div>
            )}
            {headerActions}
          </div>
        </div>
      )}

      {filteredData.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={searchQuery ? 'No results found' : emptyTitle}
          description={searchQuery ? `No items match "${searchQuery}"` : emptyDescription}
          className="py-8"
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {(onSelectRow || onSelectAll) && (
                    <th scope="col" className="relative w-12 px-6 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all rows"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-700"
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        checked={isAllSelected}
                        onChange={(e) => onSelectAll?.(e.target.checked)}
                      />
                    </th>
                  )}
                  {renderExpandedRow && (
                    <th scope="col" className="w-10 px-2 py-3" />
                  )}
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={clsx(
                        'px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
                        column.sortable && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700',
                        column.width && `w-${column.width}`
                      )}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className={clsx(
                        'flex items-center space-x-1',
                        column.align === 'right' && 'justify-end',
                        column.align === 'center' && 'justify-center'
                      )}>
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
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {paginatedData.map((item, index) => {
                  const rowId = getRowId?.(item) || ((pagination ? (currentPage - 1) * pageSize : 0) + index).toString();
                  const isSelected = selectedIds.includes(rowId);
                  const isExpanded = expandedIds.has(rowId);

                  return (
                    <React.Fragment key={rowId}>
                      <tr
                        className={clsx(
                          'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                          (onRowClick || renderExpandedRow) && 'cursor-pointer',
                          isSelected && 'bg-brand-50'
                        )}
                        onClick={() => {
                          if (renderExpandedRow) toggleExpanded(rowId);
                          else onRowClick?.(item);
                        }}
                      >
                        {onSelectRow && (
                          <td className="relative w-12 px-6 py-4">
                            <input
                              type="checkbox"
                              aria-label={`Select row ${index + 1}`}
                              className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-700"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                onSelectRow(rowId);
                              }}
                            />
                          </td>
                        )}
                        {renderExpandedRow && (
                          <td className="w-10 px-2 py-4 text-gray-400">
                            {isExpanded ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </td>
                        )}
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={clsx(
                              'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                              column.align === 'right' && 'text-right',
                              column.align === 'center' && 'text-center',
                              column.cellClassName
                            )}
                          >
                            {column.render
                              ? column.render(item)
                              : (item as Record<string, unknown>)[column.key] as React.ReactNode
                            }
                          </td>
                        ))}
                      </tr>
                      {renderExpandedRow && isExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan={colCount} className="px-8 py-4">
                            {renderExpandedRow(item)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              {footer && (
                <tfoot className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                  {footer}
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination */}
          {pagination && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
                </span>
                {pagination.pageSizeOptions && (
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="ml-2 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {pagination.pageSizeOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt} per page</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                {generatePageNumbers(currentPage, totalPages).map((page, i) =>
                  page === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={clsx(
                        'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                        currentPage === page
                          ? 'bg-brand-600 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Next page"
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Generate smart page number array with ellipsis */
function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

export default DataTable;
