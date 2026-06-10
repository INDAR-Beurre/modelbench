'use client';

import Link from 'next/link';
import { ExternalLink, Github, Loader2, Sparkles, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from '@/components/ScoreBar';
import { Preview } from '@/components/Preview';
import type { Project } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { runDeploy, runJudge } from '@/hooks/useProjects';
import { useState } from 'react';
import { toast } from 'sonner';

export function ProjectCard({
  project,
  index = 0,
  onUpdate,
  onDelete,
  defaultJudgeModelId,
}: {
  project: Project;
  index?: number;
  onUpdate: (p: Project) => void;
  onDelete: () => void;
  defaultJudgeModelId: string;
}) {
  const [busy, setBusy] = useState<'judge' | 'deploy' | null>(null);

  // Pick a deterministic accent color per card.
  const accents = ['red', 'blue', 'violet', 'lime', 'ink'] as const;
  const accent = accents[index % accents.length];

  async function handleJudge() {
    setBusy('judge');
    onUpdate({ ...project, status: 'judging' });
    try {
      const updated = await runJudge(project, defaultJudgeModelId);
      onUpdate(updated);
      if (updated.status === 'error') {
        toast.error(updated.error ?? 'Judge failed');
      } else {
        toast.success(`Judged: ${updated.judge?.average}/10 avg`);
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleDeploy() {
    setBusy('deploy');
    try {
      const updated = await runDeploy(project);
      onUpdate(updated);
      if (updated.error) toast.error(updated.error);
      else toast.success('Pushed to GitHub');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card accent={accent} className="enter">
      <CardContent className="space-y-5 p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <Badge variant={accent === 'ink' ? 'default' : (accent as 'red' | 'blue' | 'violet' | 'lime')}>
                {project.model.label}
              </Badge>
              {project.promptCategory && (
                <Badge variant="cream">{project.promptCategory}</Badge>
              )}
              <Badge
                variant={
                  project.status === 'judged' ? 'lime' :
                  project.status === 'error' ? 'red' :
                  project.status === 'judging' ? 'violet' :
                  'outline'
                }
              >
                {project.status}
              </Badge>
            </div>
            <h3 className="font-serif text-2xl leading-tight tracking-tightest text-ink">
              {project.name}
            </h3>
            <p className="mt-1 text-[11px] uppercase tracking-eyebrow text-muted">
              {formatDate(project.createdAt)} · {project.files.length} files
            </p>
          </div>
          <div className="flex items-start gap-1">
            <span className="numeral text-3xl font-serif text-ink/15">
              {String(index + 1).padStart(2, '0')}
            </span>
            <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Delete" className="h-8 w-8 rounded-full p-0">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Live preview — top of the card, sandboxed iframe. */}
        <Preview files={project.files} deployUrl={project.deployUrl} compact />

        <p className="line-clamp-3 text-sm leading-relaxed text-muted">
          {project.prompt}
        </p>

        {project.judge ? (
          <div className="rounded-2xl border border-ink bg-ink p-5 text-paper shadow-bezel">
            <div className="mb-4 flex items-end justify-between">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-eyebrow text-paper/70">
                <Sparkles className="h-3 w-3" />
                <span>Verdict</span>
              </div>
              <div className="text-right">
                <div className="numeral font-serif text-5xl leading-none">
                  {project.judge.average.toFixed(1)}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-eyebrow text-paper/50">
                  average / 10
                </div>
              </div>
            </div>
            {project.judge.verdict && (
              <p className="mb-3 border-b border-paper/15 pb-3 text-sm font-medium text-paper/95">
                {project.judge.verdict}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <ScoreBar label="Design" value={project.judge.scores.design} tone="lime" className="[&_div]:!bg-paper" />
              <ScoreBar label="Code" value={project.judge.scores.codeQuality} tone="lime" className="[&_div]:!bg-paper" />
              <ScoreBar label="Features" value={project.judge.scores.featureCompleteness} tone="lime" className="[&_div]:!bg-paper" />
            </div>
            {project.judge.critique && (
              <p className="mt-4 border-t border-paper/15 pt-3 text-sm leading-relaxed text-paper/80">
                {project.judge.critique}
              </p>
            )}
            {project.judge.highlights.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-xs text-paper/70">
                {project.judge.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-lime" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {project.error && (
          <div className="rounded-pill border border-brand-red bg-brand-red/10 px-4 py-2 text-xs text-brand-red">
            {project.error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
          <Button variant="pill" size="sm" onClick={handleJudge} disabled={busy !== null}>
            {busy === 'judge' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {project.judge ? 'Re-judge' : 'Judge'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeploy} disabled={busy !== null}>
            {busy === 'deploy' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Github className="h-3.5 w-3.5" />}
            Push to GitHub
          </Button>
          {project.repoUrl && (
            <Link href={project.repoUrl} target="_blank">
              <Button size="sm" variant="ghost" className="sweep">
                <ExternalLink className="h-3.5 w-3.5" /> Repo
              </Button>
            </Link>
          )}
          {project.deployUrl && (
            <Link href={project.deployUrl} target="_blank">
              <Button size="sm" variant="ghost" className="sweep">
                <Zap className="h-3.5 w-3.5" /> Live
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
