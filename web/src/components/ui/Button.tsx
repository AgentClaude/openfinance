import { forwardRef } from 'react';
import clsx from 'clsx';
import { ButtonProps } from '@/types';
import LoadingSpinner from './LoadingSpinner';

const variantClasses = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 focus:ring-brand-500 active:bg-brand-900',
  secondary: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-brand-500',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
  ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 focus:ring-brand-500',
  link: 'text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 underline-offset-4 hover:underline focus:ring-brand-500 p-0',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      type = 'button',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isLink = variant === 'link';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          !isLink && sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <LoadingSpinner size="sm" className="mr-2" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
