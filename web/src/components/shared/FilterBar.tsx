import React from 'react';
import clsx from 'clsx';
import Button from '@/components/ui/Button';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  categories?: FilterOption[];
  selectedCategory?: string;
  onCategoryChange?: (value: string) => void;
  accounts?: FilterOption[];
  selectedAccount?: string;
  onAccountChange?: (value: string) => void;
  onReset?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  categories,
  selectedCategory,
  onCategoryChange,
  accounts,
  selectedAccount,
  onAccountChange,
  onReset,
  children,
  className,
}) => {
  return (
    <div className={clsx('flex flex-wrap items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg', className)}>
      {onDateFromChange && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom || ''}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={dateTo || ''}
            onChange={(e) => onDateToChange?.(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
          />
        </div>
      )}

      {categories && onCategoryChange && (
        <select
          value={selectedCategory || ''}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-md border-gray-300 dark:border-gray-600 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      )}

      {accounts && onAccountChange && (
        <select
          value={selectedAccount || ''}
          onChange={(e) => onAccountChange(e.target.value)}
          className="rounded-md border-gray-300 dark:border-gray-600 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
        >
          <option value="">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.value} value={acc.value}>{acc.label}</option>
          ))}
        </select>
      )}

      {children}

      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
};

export default FilterBar;
