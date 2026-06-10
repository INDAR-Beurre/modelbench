'use client';

import Link from 'next/link';
import { ExternalLink, Github, Loader2, Sparkles, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from '@/components/ScoreBar';
import type { Project } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { runDeploy, runJudge } from '@/hooks/useProjects';
import { useState } from 'react';
import { toast } from 'sonner';

export function ProjectCard({
  project,
  onUpdate,
  onDelete,
  defaultJudgeModelId,
  groqApiKey,
  grokApiKey,
  githubToken,
}: {
  project: Project;
  onUpdate: (p: Project) => void;
  onDelete: () => void;
  defaultJudgeModelId: string;
  groqApiKey: string;
  grokApiKey: string;
  githubToken: string;
}) {
  const [busy, setBusy] = useState<'judge' | 'deploy' | null>(null);

  async function handleJudge() {
    setBusy('judge');
    onUpdate({ ...project, status: 'judging' });
    try {
      const updated = await runJudge(project, defaultJudgeModelId, {
        groq: groqApiKey || undefined,
        grok: grokApiKey || undefined,
      });
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
      const updated = await runDeploy(project, githubToken || undefined);
      onUpdate(updated);
      if (updated.error) toast.error(updated.error);
      else toast.success('Pushed to GitHub');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="violet">{project.model.label}</Badge>
            {project.promptCategory && (
              <Badge variant="outline">{project.promptCategory}</Badge>
            )}
            <Badge variant={project.status === 'judged' ? 'success' : project.status === 'error' ? 'destructive' : 'secondary'}>
              {project.status}
            </Badge>
          </div>
          <CardTitle className="truncate">{project.name}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(project.createdAt)} · {project.files.length} files
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {project.prompt}
        </p>

        {project.judge ? (
          <div className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Judge Verdict
              </div>
              <div className="font-mono text-2xl font-bold gradient-text">
                {project.judge.average.toFixed(1)}
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <ScoreBar label="Design" value={project.judge.scores.design} />
              <ScoreBar label="Code" value={project.judge.scores.codeQuality} />
              <ScoreBar label="Features" value={project.judge.scores.featureCompleteness} />
            </div>
            {project.judge.critique && (
              <p className="mt-3 text-sm text-muted-foreground">
                {project.judge.critique}
              </p>
            )}
            {project.judge.highlights.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {project.judge.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {project.error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {project.error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={handleJudge} disabled={busy !== null}>
            {busy === 'judge' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {project.judge ? 'Re-judge' : 'Judge with AI'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDeploy} disabled={busy !== null}>
            {busy === 'deploy' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
            Push to GitHub
          </Button>
          {project.repoUrl && (
            <Link href={project.repoUrl} target="_blank">
              <Button size="sm" variant="ghost">
                <ExternalLink className="h-4 w-4" /> Repo
              </Button>
            </Link>
          )}
          {project.deployUrl && (
            <Link href={project.deployUrl} target="_blank">
              <Button size="sm" variant="ghost">
                <Zap className="h-4 w-4" /> Live
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
