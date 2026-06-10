import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Render a solid accent strip down the left edge. */
    accent?: 'red' | 'blue' | 'violet' | 'lime' | 'ink';
  }
>(({ className, accent, children, ...props }, ref) => {
  const accentColor =
    accent === 'red' ? 'before:bg-brand-red' :
    accent === 'blue' ? 'before:bg-brand-blue' :
    accent === 'violet' ? 'before:bg-brand-violet' :
    accent === 'lime' ? 'before:bg-brand-lime' :
    accent === 'ink' ? 'before:bg-ink' :
    '';

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-ink/15 bg-paper/80 backdrop-blur-sm',
        'shadow-paper',
        accent && `before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 ${accentColor}`,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('font-serif text-2xl leading-tight tracking-tightest text-ink', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm leading-relaxed text-muted', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-3 p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
