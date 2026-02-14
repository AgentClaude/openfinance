import React from 'react';
import clsx from 'clsx';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={clsx('text-center py-12', className)}>
      {icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
