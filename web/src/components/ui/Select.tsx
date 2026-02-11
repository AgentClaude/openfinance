import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  placeholder,
  className,
  containerClassName,
  ...props
}, ref) => {
  const selectId = React.useId();

  return (
    <div className={clsx('space-y-1', containerClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          'block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
          error && 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p id={`${selectId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;