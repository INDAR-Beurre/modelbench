import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-2xl border border-ink/30 bg-paper/70 px-5 py-4 text-sm text-ink',
          'placeholder:text-muted',
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
Textarea.displayName = 'Textarea';

export { Textarea };
