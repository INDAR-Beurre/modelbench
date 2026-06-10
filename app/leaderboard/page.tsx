'use client';

import { Loader2 } from 'lucide-react';
import { Leaderboard } from '@/components/Leaderboard';
import { useProjects } from '@/hooks/useProjects';

export default function LeaderboardPage() {
  const { projects, hydrated } = useProjects();

  return (
    <div className="space-y-12">
      <header className="grid gap-6 border-b border-ink/15 pb-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <span className="eyebrow text-muted">— 03 / The Standings</span>
          <h1 className="display-2 mt-3 font-serif text-ink">The leaderboard.</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Aggregated rankings across every judged project. Group by prompt to compare
            models on the same task — blind, deterministic, and explainable.
          </p>
        </div>
        <div className="hidden items-end justify-end md:col-span-4 md:flex">
          <div className="rounded-full border border-ink bg-paper px-3 py-1.5 text-[10px] uppercase tracking-eyebrow text-ink">
            Updated live
          </div>
        </div>
      </header>

      {!hydrated ? (
        <div className="flex h-40 items-center justify-center text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <Leaderboard projects={projects} />
      )}
    </div>
  );
}
