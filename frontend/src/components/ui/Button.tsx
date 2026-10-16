import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-button text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-navy-900 text-ivory shadow-soft hover:bg-navy-800 dark:bg-gold-500 dark:text-navy-950 dark:hover:bg-gold-400 font-semibold',
        gold:
          'bg-gold-500 text-navy-950 shadow-soft hover:bg-gold-400 font-semibold shadow-gold-glow/40 hover:shadow-gold-glow/70',
        secondary:
          'bg-navy-100 text-navy-900 hover:bg-navy-200 dark:bg-charcoal-100 dark:text-ivory dark:hover:bg-charcoal-200',
        outline:
          'border border-navy-900/20 bg-transparent text-navy-900 hover:bg-navy-900/5 dark:border-gold-500/30 dark:text-gold-400 dark:hover:bg-gold-500/10',
        ghost:
          'hover:bg-navy-900/5 text-navy-900 dark:text-ivory dark:hover:bg-ivory/10',
        destructive:
          'bg-alleged text-white hover:bg-alleged-hover shadow-soft',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
        md: 'h-10 px-4 py-2 text-sm rounded-xl gap-2',
        lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
