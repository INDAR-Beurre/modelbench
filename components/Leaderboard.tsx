'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from '@/components/ScoreBar';
import { ModelChart, type ChartRow } from '@/components/ModelChart';
import type { Project } from '@/lib/types';
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
  for (const [, ps] of byModel) {
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

function toChartRow(rows: ModelAgg[]): ChartRow[] {
  return rows.map((r) => ({
    modelId: r.modelId,
    label: r.label,
    design: r.design,
    codeQuality: r.codeQuality,
    featureCompleteness: r.featureCompleteness,
    average: r.average,
  }));
}

export function Leaderboard({ projects }: { projects: Project[] }) {
  const rows = useMemo(() => aggregate(projects), [projects]);
  const groups = useMemo(() => groupByCategory(projects), [projects]);
  const chartRows = useMemo(() => toChartRow(rows), [rows]);

  if (rows.length === 0) {
    return (
      <Card className="enter">
        <CardHeader className="p-8">
          <span className="eyebrow text-muted">— The Standings</span>
          <CardTitle className="font-serif text-4xl tracking-tightest">
            No scores yet.
          </CardTitle>
          <CardDescription className="max-w-prose">
            Upload a project and click <span className="text-ink">Judge with AI</span> to start
            populating the leaderboard. Results are aggregated per model across every prompt.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      <ModelChart rows={chartRows} />

      <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((r, i) => {
          const tones: ('red' | 'blue' | 'violet' | 'lime')[] = ['red', 'blue', 'violet', 'lime'];
          const tone = tones[i % 4];
          return (
            <Card
              key={r.modelId}
              className={cn('enter')}
              accent={i === 0 ? 'ink' : (tone === 'lime' ? 'lime' : tone)}
            >
              <CardHeader className="p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="eyebrow text-muted">№ {String(i + 1).padStart(2, '0')}</span>
                      <Badge variant="muted">{r.provider}</Badge>
                    </div>
                    <CardTitle className="font-serif text-3xl leading-none tracking-tightest">
                      {r.label}
                    </CardTitle>
                    <p className="mt-2 text-[11px] uppercase tracking-eyebrow text-muted">
                      {r.count} judged project{r.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="numeral font-serif text-6xl leading-none tracking-tightest text-ink">
                      {r.average.toFixed(1)}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-eyebrow text-muted">
                      avg / 10
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-7 pb-7">
                <ScoreBar label="Design" value={r.design} tone="violet" />
                <ScoreBar label="Code Quality" value={r.codeQuality} tone="blue" />
                <ScoreBar label="Features" value={r.featureCompleteness} tone="red" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {Array.from(groups.entries()).map(([category, list], gi) => (
        <CategoryPanel key={category} category={category} projects={list} index={gi} />
      ))}
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

function CategoryPanel({
  category,
  projects,
  index,
}: {
  category: string;
  projects: Project[];
  index: number;
}) {
  const sorted = [...projects].sort((a, b) => (b.judge?.average ?? 0) - (a.judge?.average ?? 0));
  return (
    <Card className="enter">
      <CardHeader className="p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="eyebrow text-muted">— Prompt № {String(index + 1).padStart(2, '0')}</span>
            <CardTitle className="mt-2 line-clamp-2 font-serif text-2xl tracking-tightest">
              {category}
            </CardTitle>
            <CardDescription className="mt-1">
              {sorted.length} model{sorted.length === 1 ? '' : 's'} scored on the same prompt.
            </CardDescription>
          </div>
          <Badge variant="violet">{sorted.length} entries</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-7 pb-7">
        <ul className="divide-y divide-ink/10">
          {sorted.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="numeral w-8 text-right font-serif text-xl text-ink">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="truncate text-sm font-medium text-ink">{p.model.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <ScoreBar
                  value={p.judge?.average ?? 0}
                  className="hidden w-40 md:block"
                  tone="ink"
                />
                <span className="numeral w-12 text-right font-serif text-lg text-ink">
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
