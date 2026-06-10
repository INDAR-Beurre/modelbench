'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, BarChart3, Sparkles, UploadCloud, Github, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectCard } from '@/components/ProjectCard';
import { useProjects, useSettings } from '@/hooks/useProjects';

export default function DashboardPage() {
  const { projects, hydrated, updateProject, removeProject } = useProjects();
  const { settings } = useSettings();

  const stats = useMemo(() => {
    const judged = projects.filter((p) => p.judge);
    const avg = judged.length
      ? judged.reduce((s, p) => s + (p.judge?.average ?? 0), 0) / judged.length
      : 0;
    return {
      total: projects.length,
      judged: judged.length,
      average: avg,
      categories: new Set(projects.map((p) => p.promptCategory || 'Uncategorized')).size,
    };
  }, [projects]);

  return (
    <div className="space-y-20">
      <Hero
        total={stats.total}
        judged={stats.judged}
        average={stats.judged ? stats.average : 0}
        categories={stats.categories}
      />

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/15 pb-3">
          <div>
            <span className="eyebrow text-muted">— 01 / The Bench</span>
            <h2 className="mt-2 font-serif text-3xl tracking-tightest text-ink md:text-4xl">
              Recent submissions
            </h2>
          </div>
          <Link href="/upload">
            <Button variant="ghost" size="sm" className="sweep">
              New submission <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {!hydrated ? (
          <div className="flex h-40 items-center justify-center text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                onUpdate={(next) => updateProject(p.id, next)}
                onDelete={() => removeProject(p.id)}
                defaultJudgeModelId={settings?.defaultJudgeModelId ?? 'llama-3.3-70b-versatile'}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Hero({
  total,
  judged,
  average,
  categories,
}: {
  total: number;
  judged: number;
  average: number;
  categories: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-4xl border border-ink bg-paper/70 shadow-paper-2">
      {/* Bold accent blocks */}
      <div className="absolute right-0 top-0 hidden h-40 w-40 rounded-bl-[6rem] bg-brand-red md:block" aria-hidden />
      <div className="absolute -bottom-12 left-1/3 hidden h-32 w-32 rounded-full bg-brand-lime md:block" aria-hidden />
      <div className="absolute bottom-0 right-12 hidden h-24 w-24 rounded-t-3xl bg-brand-blue md:block" aria-hidden />
      <div className="absolute right-1/3 top-10 hidden h-3 w-32 bg-brand-violet md:block" aria-hidden />

      <div className="relative grid gap-10 p-8 md:grid-cols-12 md:p-12 lg:p-16">
        <div className="md:col-span-7 lg:col-span-8">
          <div className="mb-5 flex items-center gap-2">
            <Badge variant="red">AI Judging</Badge>
            <Badge variant="outline">v0.1</Badge>
            <Badge variant="muted">Groq · xAI</Badge>
          </div>
          <h1 className="display enter font-serif text-ink">
            Rank <em className="not-italic text-brand-red">every</em> model
            <br />
            on the <em className="not-italic text-brand-blue">same</em> prompt.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
            Upload generated web projects, push them to GitHub, and let a blind LLM judge
            score each one on design, code quality, and feature completeness — then
            aggregate the results on a live leaderboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/upload">
              <Button variant="pill" size="xl">
                <UploadCloud className="h-4 w-4" /> Submit a project
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline" size="xl">
                <BarChart3 className="h-4 w-4" /> See the leaderboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="md:col-span-5 lg:col-span-4">
          <div className="space-y-3">
            <StatRow label="Projects" value={total} hint="submissions" tone="ink" />
            <StatRow label="Judged" value={judged} hint="evaluations" tone="red" />
            <StatRow
              label="Avg score"
              value={judged ? average.toFixed(1) : '—'}
              hint="out of 10"
              tone="blue"
            />
            <StatRow label="Prompt groups" value={categories} hint="comparisons" tone="violet" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatRow({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint: string;
  tone: 'ink' | 'red' | 'blue' | 'violet';
}) {
  const chip =
    tone === 'red' ? 'bg-brand-red text-paper' :
    tone === 'blue' ? 'bg-brand-blue text-paper' :
    tone === 'violet' ? 'bg-brand-violet text-paper' :
    'bg-ink text-paper';
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink bg-paper p-4">
      <div>
        <div className="eyebrow text-muted">{label}</div>
        <div className="numeral mt-1 font-serif text-3xl tracking-tightest text-ink">
          {value}
        </div>
        <div className="text-[10px] uppercase tracking-eyebrow text-muted">{hint}</div>
      </div>
      <span className={chip + ' numeral rounded-full px-2.5 py-1 text-xs font-semibold'}>
        ↗
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full border border-ink bg-brand-lime text-ink">
          <Sparkles className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif text-3xl tracking-tightest">No submissions yet.</h3>
        <p className="max-w-md text-sm text-muted">
          Drop a folder of HTML/CSS/JS files, give it the original prompt, and let ModelBench judge it.
        </p>
        <Link href="/upload" className="mt-2">
          <Button variant="pill">
            <UploadCloud className="h-4 w-4" /> Submit your first project
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
