'use client';

import { cn } from '@/lib/utils';

export function ScoreBar({
  value,
  label,
  max = 10,
  className,
}: {
  value: number;
  label?: string;
  max?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tone =
    pct >= 80 ? 'from-emerald-500 to-cyan-400' :
    pct >= 60 ? 'from-sky-500 to-violet-500' :
    pct >= 40 ? 'from-amber-500 to-rose-500' :
                'from-rose-500 to-rose-600';

  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">{label}</span>
          <span className="font-mono text-foreground">{value}/{max}</span>
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/60">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
