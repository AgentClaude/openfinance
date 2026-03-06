import React from 'react';
import clsx from 'clsx';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  valueClassName?: string;
  icon?: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  trend,
  valueClassName,
  icon,
  className,
}) => {
  const TrendIcon = trend?.direction === 'up' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const trendColor =
    trend?.direction === 'up'
      ? 'text-green-600'
      : trend?.direction === 'down'
        ? 'text-red-600'
        : 'text-gray-500';

  return (
    <Card className={clsx('p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className={clsx('text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1', valueClassName)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
          {trend && trend.direction !== 'neutral' && (
            <div className={clsx('flex items-center mt-1', trendColor)}>
              <TrendIcon className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{trend.value}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-gray-400 dark:text-gray-500">{icon}</div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
