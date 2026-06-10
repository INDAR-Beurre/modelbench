'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, BarChart3, Sparkles, UploadCloud, Github, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectCard } from '@/components/ProjectCard';
import { useProjects, useSettings } from '@/hooks/useProjects';
import { formatDate } from '@/lib/utils';

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
    <div className="space-y-10">
      <Hero />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Projects"
          value={stats.total.toString()}
          icon={<UploadCloud className="h-4 w-4" />}
        />
        <StatCard
          label="Judged"
          value={stats.judged.toString()}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatCard
          label="Avg score"
          value={stats.judged ? stats.average.toFixed(1) : '—'}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          label="Prompt groups"
          value={stats.categories.toString()}
          icon={<Github className="h-4 w-4" />}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent projects</h2>
          <Link href="/upload">
            <Button variant="outline" size="sm">
              New upload <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {!hydrated ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onUpdate={(next) => updateProject(p.id, next)}
                onDelete={() => removeProject(p.id)}
                defaultJudgeModelId={settings?.defaultJudgeModelId ?? 'llama-3.3-70b-versatile'}
                groqApiKey={settings?.groqApiKey ?? ''}
                grokApiKey={settings?.grokApiKey ?? ''}
                githubToken={settings?.githubToken ?? ''}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/50 to-card/30 p-8 md:p-12">
      <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="relative max-w-3xl space-y-5">
        <Badge variant="violet" className="w-fit">AI Judging & Hosting Hub</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Rank <span className="gradient-text">every model</span> on the same prompt.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Upload generated web projects, push them to GitHub, and let a blind LLM judge
          score them on design, code quality, and feature completeness. Aggregate the
          results on a live leaderboard.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/upload">
            <Button variant="glow" size="lg">
              <UploadCloud className="h-4 w-4" /> Upload a project
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="outline" size="lg">
              <BarChart3 className="h-4 w-4" /> View leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-xs uppercase tracking-widest">{label}</CardDescription>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">No projects yet</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Drop a folder of HTML/CSS/JS files, give it the original prompt, and let ModelBench judge it.
        </p>
        <Link href="/upload" className="mt-2">
          <Button>
            <UploadCloud className="h-4 w-4" /> Upload your first project
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
