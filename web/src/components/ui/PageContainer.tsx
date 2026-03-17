import React from 'react';
import clsx from 'clsx';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';

interface PageContainerProps {
  children: React.ReactNode;
  /** Max width constraint. Defaults to 'full' (uses layout's max-w-7xl). */
  maxWidth?: MaxWidth;
  /** Additional className overrides */
  className?: string;
}

const maxWidthMap: Record<MaxWidth, string> = {
  sm: 'max-w-sm mx-auto',
  md: 'max-w-md mx-auto',
  lg: 'max-w-lg mx-auto',
  xl: 'max-w-xl mx-auto',
  '2xl': 'max-w-2xl mx-auto',
  '3xl': 'max-w-3xl mx-auto',
  '4xl': 'max-w-4xl mx-auto',
  '5xl': 'max-w-5xl mx-auto',
  '6xl': 'max-w-6xl mx-auto',
  '7xl': 'max-w-7xl mx-auto',
  full: '',
};

/**
 * Consistent page-level container. Provides standardized spacing
 * and optional max-width constraint within the AppLayout content area.
 *
 * Usage:
 *   <PageContainer maxWidth="4xl">
 *     <PageHeader title="Settings" />
 *     ...content...
 *   </PageContainer>
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'full',
  className,
}) => {
  return (
    <div className={clsx('space-y-6', maxWidthMap[maxWidth], className)}>
      {children}
    </div>
  );
};

export default PageContainer;
