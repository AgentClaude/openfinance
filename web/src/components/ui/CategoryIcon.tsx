import React from 'react';
import clsx from 'clsx';

interface CategoryIconProps {
  icon: string;
  className?: string;
}

/**
 * Renders a category icon. Supports Font Awesome class names (e.g. "fa-shopping-cart")
 * and emoji strings.
 */
const CategoryIcon: React.FC<CategoryIconProps> = ({ icon, className }) => {
  if (!icon) return null;

  // Font Awesome icon names start with "fa-"
  if (icon.startsWith('fa-')) {
    return <i className={clsx('fa-solid', icon, className)} />;
  }

  // Otherwise treat as emoji or text
  return <span className={className}>{icon}</span>;
};

export default CategoryIcon;
