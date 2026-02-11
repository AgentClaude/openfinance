import React from 'react';
import clsx from 'clsx';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  actions,
  className,
  bodyClassName,
}) => {
  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-sm border border-gray-200',
      className
    )}>
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={clsx('px-6 py-4', bodyClassName)}>
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;