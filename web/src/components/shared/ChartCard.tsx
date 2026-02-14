import React from 'react';
import clsx from 'clsx';
import Card from '@/components/ui/Card';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  height?: number;
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  actions,
  children,
  className,
}) => {
  return (
    <Card className={clsx('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
};

export default ChartCard;
