'use client';

import { Loader2 } from 'lucide-react';
import { Leaderboard } from '@/components/Leaderboard';
import { useProjects } from '@/hooks/useProjects';

export default function LeaderboardPage() {
  const { projects, hydrated } = useProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="mt-1 text-muted-foreground">
          Aggregated rankings across every judged project. Group by prompt to compare
          models on the same task.
        </p>
      </div>

      {!hydrated ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <Leaderboard projects={projects} />
      )}
    </div>
  );
}
