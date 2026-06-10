'use client';

import { cn } from '@/lib/utils';

export function ScoreBar({
  value,
  label,
  max = 10,
  className,
  tone = 'ink',
}: {
  value: number;
  label?: string;
  max?: number;
  className?: string;
  tone?: 'ink' | 'red' | 'blue' | 'violet' | 'lime';
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill =
    tone === 'red' ? 'bg-brand-red' :
    tone === 'blue' ? 'bg-brand-blue' :
    tone === 'violet' ? 'bg-brand-violet' :
    tone === 'lime' ? 'bg-brand-lime' :
    'bg-ink';

  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-eyebrow text-muted">
          <span className="font-semibold">{label}</span>
          <span className="numeral text-ink">{value.toFixed(value % 1 === 0 ? 0 : 1)} / {max}</span>
        </div>
      ) : null}
      <div className="relative h-2 w-full overflow-hidden rounded-pill bg-ink/10">
        <div
          className={cn('h-full rounded-pill transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]', fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
