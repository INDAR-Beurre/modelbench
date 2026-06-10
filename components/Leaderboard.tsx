'use client';

import { useMemo } from 'react';
import { Crown, Medal, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from '@/components/ScoreBar';
import type { JudgeResult, Project } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ModelAgg {
  modelId: string;
  label: string;
  provider: string;
  count: number;
  average: number;
  design: number;
  codeQuality: number;
  featureCompleteness: number;
}

function aggregate(projects: Project[]): ModelAgg[] {
  const byModel = new Map<string, Project[]>();
  for (const p of projects) {
    if (!p.judge) continue;
    const k = `${p.model.provider}:${p.model.id}`;
    if (!byModel.has(k)) byModel.set(k, []);
    byModel.get(k)!.push(p);
  }
  const rows: ModelAgg[] = [];
  for (const [k, ps] of byModel) {
    const avg = ps.reduce((s, p) => s + (p.judge?.average ?? 0), 0) / ps.length;
    const design = ps.reduce((s, p) => s + (p.judge?.scores.design ?? 0), 0) / ps.length;
    const code = ps.reduce((s, p) => s + (p.judge?.scores.codeQuality ?? 0), 0) / ps.length;
    const feat = ps.reduce((s, p) => s + (p.judge?.scores.featureCompleteness ?? 0), 0) / ps.length;
    const first = ps[0];
    rows.push({
      modelId: first.model.id,
      label: first.model.label,
      provider: first.model.provider,
      count: ps.length,
      average: Number(avg.toFixed(2)),
      design: Number(design.toFixed(2)),
      codeQuality: Number(code.toFixed(2)),
      featureCompleteness: Number(feat.toFixed(2)),
    });
  }
  return rows.sort((a, b) => b.average - a.average);
}

export function Leaderboard({ projects }: { projects: Project[] }) {
  const rows = useMemo(() => aggregate(projects), [projects]);
  const groups = useMemo(() => groupByCategory(projects), [projects]);

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No scores yet</CardTitle>
          <CardDescription>
            Upload a project and click <span className="text-foreground">Judge with AI</span> to start populating the leaderboard.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((r, i) => (
          <Card
            key={r.modelId}
            className={cn(
              'overflow-hidden',
              i === 0 && 'glow-ring',
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <RankBadge index={i} />
                <div>
                  <CardTitle className="text-base">{r.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {r.count} judged project{r.count === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-3xl font-bold gradient-text">
                  {r.average.toFixed(1)}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  avg / 10
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <ScoreBar label="Design" value={r.design} />
              <ScoreBar label="Code Quality" value={r.codeQuality} />
              <ScoreBar label="Features" value={r.featureCompleteness} />
            </CardContent>
          </Card>
        ))}
      </div>

      {Array.from(groups.entries()).map(([category, list]) => (
        <CategoryPanel key={category} category={category} projects={list} />
      ))}
    </div>
  );
}

function RankBadge({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/20 text-amber-300">
        <Crown className="h-5 w-5" />
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-300/15 text-zinc-200">
        <Medal className="h-5 w-5" />
      </div>
    );
  }
  if (index === 2) {
    return (
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-orange-500/15 text-orange-300">
        <Medal className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-sm font-mono text-muted-foreground">
      {index + 1}
    </div>
  );
}

function groupByCategory(projects: Project[]): Map<string, Project[]> {
  const map = new Map<string, Project[]>();
  for (const p of projects) {
    if (!p.judge) continue;
    const k = p.promptCategory || 'Uncategorized';
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(p);
  }
  return map;
}

function CategoryPanel({ category, projects }: { category: string; projects: Project[] }) {
  const sorted = [...projects].sort((a, b) => (b.judge?.average ?? 0) - (a.judge?.average ?? 0));
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              Prompt category
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {category}
            </p>
          </div>
          <Badge variant="violet">{sorted.length} models</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/60">
          {sorted.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-6 text-right font-mono text-muted-foreground">{i + 1}</span>
                <span className="truncate">{p.model.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <ScoreBar
                  value={p.judge?.average ?? 0}
                  className="hidden w-40 sm:block"
                />
                <span className="w-12 text-right font-mono text-foreground">
                  {p.judge?.average.toFixed(1)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
