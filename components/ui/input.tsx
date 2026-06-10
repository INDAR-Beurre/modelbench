import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-pill border border-ink/30 bg-paper/70 px-5 text-sm text-ink',
          'placeholder:text-muted placeholder:font-sans',
          'ring-offset-paper transition-colors duration-300',
          'focus-visible:outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-brand-lime/60',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
