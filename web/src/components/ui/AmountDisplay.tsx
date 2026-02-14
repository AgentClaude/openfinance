import React from 'react';
import clsx from 'clsx';

interface AmountDisplayProps {
  amount: number;
  currency?: string;
  showSign?: boolean;
  colorize?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  currency = 'USD',
  showSign = false,
  colorize = true,
  size = 'md',
  className,
}) => {
  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
    if (value < 0) return `-${formatted}`;
    return formatted;
  };

  const getSignPrefix = () => {
    if (!showSign) return '';
    return amount >= 0 ? '+' : '';
  };

  const getColorClass = () => {
    if (!colorize) return 'text-gray-900 dark:text-gray-100';
    if (amount > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (amount < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-900 dark:text-gray-100';
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl font-semibold',
  };

  return (
    <span
      className={clsx(
        'tabular-nums font-semibold',
        getColorClass(),
        sizeClasses[size],
        className
      )}
    >
      {getSignPrefix()}{formatCurrency(amount)}
    </span>
  );
};

export default AmountDisplay;