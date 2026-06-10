import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-pill font-sans text-sm font-medium tracking-tight',
    'transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        // Solid ink CTA — sits on cream/paper
        default:
          'bg-ink text-paper border border-ink hover:bg-ink-2',
        // Hairline outline
        outline:
          'border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper',
        // Cream secondary
        secondary:
          'bg-cream text-ink border border-ink hover:bg-ink hover:text-paper',
        // Bold red structural CTA
        red:
          'bg-brand-red text-paper border border-brand-red hover:brightness-95',
        blue:
          'bg-brand-blue text-paper border border-brand-blue hover:brightness-95',
        violet:
          'bg-brand-violet text-paper border border-brand-violet hover:brightness-95',
        lime:
          'bg-brand-lime text-ink border border-brand-lime hover:brightness-95',
        ghost: 'text-ink hover:bg-ink/5',
        link: 'text-ink underline underline-offset-4 hover:no-underline',
        // Pill with inner trailing icon
        pill: 'bg-ink text-paper border border-ink pr-1.5',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs',
        default: 'h-11 px-5',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const isPill = variant === 'pill';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {isPill ? (
          <>
            <span className="pl-4">{children}</span>
            <span
              aria-hidden
              className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-paper text-ink transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
