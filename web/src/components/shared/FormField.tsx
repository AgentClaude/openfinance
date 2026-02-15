import React from 'react';
import clsx from 'clsx';

interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required = false,
  children,
  className,
}) => {
  const fieldId = React.useId();

  // Clone child to inject id if it's a single input/select/textarea element
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const tagName = typeof child.type === 'string' ? child.type : '';
      if (['input', 'select', 'textarea'].includes(tagName)) {
        return React.cloneElement(child as React.ReactElement<any>, { id: fieldId });
      }
    }
    return child;
  });

  return (
    <div className={clsx('space-y-1', className)}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {enhancedChildren}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
};

export default FormField;
