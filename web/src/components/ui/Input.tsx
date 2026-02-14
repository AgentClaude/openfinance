import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  className,
  containerClassName,
  ...props
}, ref) => {
  const inputId = React.useId();

  return (
    <div className={clsx('space-y-1', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
            'placeholder-gray-400 dark:placeholder-gray-500',
            icon && 'pl-10',
            error && 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" id={`${inputId}-error`}>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400" id={`${inputId}-helper`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
