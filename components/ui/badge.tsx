import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-eyebrow',
  {
    variants: {
      variant: {
        default: 'border-ink bg-ink text-paper',
        outline: 'border-ink/30 bg-paper/40 text-ink',
        red: 'border-brand-red bg-brand-red text-paper',
        blue: 'border-brand-blue bg-brand-blue text-paper',
        violet: 'border-brand-violet bg-brand-violet text-paper',
        lime: 'border-brand-lime bg-brand-lime text-ink',
        rose: 'border-brand-rose bg-brand-rose text-ink',
        cream: 'border-ink/15 bg-cream text-ink',
        muted: 'border-transparent bg-ink/10 text-ink',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
