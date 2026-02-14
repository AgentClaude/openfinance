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
    if (!colorize) return 'text-gray-900';
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-900';
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
        'font-mono',
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