import React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-navy-900/10 dark:bg-charcoal-100',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
