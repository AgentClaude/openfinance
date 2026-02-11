import React from 'react';
import clsx from 'clsx';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
}) => {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium';

  if (src) {
    return (
      <img
        className={clsx(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
        src={src}
        alt={name}
      />
    );
  }

  return (
    <div
      className={clsx(
        baseClasses,
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;