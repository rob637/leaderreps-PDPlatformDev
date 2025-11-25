// src/components/ui/LoadingState.jsx
// Standardized Loading State Components
// Use these for all loading states instead of inline implementations

import React from 'react';
import { cn } from '../../lib/utils';
import { Loader } from 'lucide-react';

/**
 * LoadingState - Full container loading state with spinner and optional message
 * 
 * @example Basic usage
 * {isLoading && <LoadingState />}
 * 
 * @example With message
 * <LoadingState message="Loading your dashboard..." />
 * 
 * @example Full page
 * <LoadingState fullPage message="Initializing app..." />
 * 
 * @example In a card/container
 * <Card>
 *   {isLoading ? <LoadingState size="sm" /> : <Content />}
 * </Card>
 */
const LoadingState = React.forwardRef(({
  message,
  size = 'md',
  fullPage = false,
  className,
  ...props
}, ref) => {
  
  const sizeClasses = {
    sm: { spinner: 'w-5 h-5', text: 'text-xs', padding: 'py-4' },
    md: { spinner: 'w-8 h-8', text: 'text-sm', padding: 'py-8' },
    lg: { spinner: 'w-12 h-12', text: 'text-base', padding: 'py-12' },
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  if (fullPage) {
    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 flex flex-col items-center justify-center bg-white z-50',
          className
        )}
        {...props}
      >
        <Loader className={cn('text-corporate-teal animate-spin', sizes.spinner)} />
        {message && (
          <p className={cn('text-slate-500 mt-4', sizes.text)}>{message}</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center',
        sizes.padding,
        className
      )}
      {...props}
    >
      <Loader className={cn('text-corporate-teal animate-spin', sizes.spinner)} />
      {message && (
        <p className={cn('text-slate-500 mt-3', sizes.text)}>{message}</p>
      )}
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

/**
 * Skeleton - Placeholder for loading content (shimmer effect)
 * 
 * @example Text line
 * <Skeleton className="h-4 w-3/4" />
 * 
 * @example Avatar
 * <Skeleton className="h-12 w-12 rounded-full" />
 * 
 * @example Card
 * <Skeleton className="h-32 w-full rounded-xl" />
 */
const Skeleton = React.forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'animate-pulse bg-slate-200 rounded',
        className
      )}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

/**
 * SkeletonCard - Pre-built skeleton for card loading state
 * 
 * @example
 * {isLoading ? <SkeletonCard /> : <ActualCard />}
 */
const SkeletonCard = React.forwardRef(({
  hasHeader = true,
  hasImage = false,
  lines = 3,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 space-y-4',
        className
      )}
      {...props}
    >
      {hasImage && (
        <Skeleton className="h-40 w-full rounded-xl" />
      )}
      {hasHeader && (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} 
          />
        ))}
      </div>
    </div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

/**
 * SkeletonStat - Pre-built skeleton for stat widget loading state
 * 
 * @example
 * {isLoading ? <SkeletonStat /> : <StatWidget />}
 */
const SkeletonStat = React.forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 border-t-4 border-t-slate-200',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
});

SkeletonStat.displayName = 'SkeletonStat';

/**
 * SkeletonList - Pre-built skeleton for list loading state
 * 
 * @example
 * {isLoading ? <SkeletonList items={5} /> : <ActualList />}
 */
const SkeletonList = React.forwardRef(({
  items = 3,
  hasAvatar = false,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-3', className)}
      {...props}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
          {hasAvatar && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
});

SkeletonList.displayName = 'SkeletonList';

export { 
  LoadingState, 
  Skeleton, 
  SkeletonCard, 
  SkeletonStat, 
  SkeletonList 
};
