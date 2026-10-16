import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, Shield } from 'lucide-react';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none tracking-wide',
  {
    variants: {
      variant: {
        default:
          'bg-navy-900 text-ivory dark:bg-navy-800 dark:text-gold-300 shadow-sm',
        verified:
          'bg-verified-light text-verified-dark dark:bg-verified-dark/30 dark:text-teal-300 border border-verified/30',
        'needs-verification':
          'bg-unverified-light text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-unverified/30',
        alleged:
          'bg-alleged-light text-red-900 dark:bg-red-950/40 dark:text-red-300 border border-alleged/30',
        missing:
          'bg-slate-100 text-slate-700 dark:bg-charcoal-100 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-600',
        gold:
          'bg-gold-100 text-gold-900 dark:bg-gold-950/50 dark:text-gold-300 border border-gold-500/30',
        outline:
          'border border-navy-900/20 text-navy-900 dark:border-slate-700 dark:text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  withIcon?: boolean;
}

function Badge({ className, variant, withIcon = false, children, ...props }: BadgeProps) {
  const renderIcon = () => {
    if (!withIcon) return null;
    switch (variant) {
      case 'verified':
        return <CheckCircle2 className="w-3.5 h-3.5 text-verified" />;
      case 'needs-verification':
        return <HelpCircle className="w-3.5 h-3.5 text-unverified" />;
      case 'alleged':
        return <AlertCircle className="w-3.5 h-3.5 text-alleged" />;
      case 'missing':
        return <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-gold-500" />;
    }
  };

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {renderIcon()}
      <span>{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };
