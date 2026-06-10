'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Wand2, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { ModelSelect } from '@/components/ModelSelect';
import { useProjects, useSettings } from '@/hooks/useProjects';
import type { ProjectFile } from '@/lib/types';
import { DEFAULT_MODEL_ID, MODEL_CATALOG, findModel } from '@/lib/types';

export default function UploadPage() {
  const { addProject, updateProject } = useProjects();
  const { settings } = useSettings();

  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const model = findModel(modelId) ?? MODEL_CATALOG[0];

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Enter a prompt first');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          modelId,
          apiKeyOverride: {
            groq: settings?.groqApiKey || undefined,
            grok: settings?.grokApiKey || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      const generated: ProjectFile[] = data.files ?? [];
      if (generated.length === 0) throw new Error('Model returned no files');
      setFiles(generated);
      if (!name) {
        setName(slugify(prompt).slice(0, 40) || model.id);
      }
      toast.success(`Generated ${generated.length} file(s) with ${model.label}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !prompt.trim() || files.length === 0) {
      toast.error('Project name, prompt, and at least one file are required');
      return;
    }
    setSubmitting(true);
    const project = addProject({
      name: name.trim(),
      prompt: prompt.trim(),
      promptCategory: category.trim() || prompt.trim().slice(0, 60),
      files,
      model,
      judgeModelId: settings?.defaultJudgeModelId ?? DEFAULT_MODEL_ID,
    });

    try {
      const judgeRes = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: { ...project, status: 'judging' },
          judgeModelId: project.judgeModelId,
          apiKeyOverride: {
            groq: settings?.groqApiKey || undefined,
            grok: settings?.grokApiKey || undefined,
          },
        }),
      });
      const data = await judgeRes.json();
      if (!judgeRes.ok) {
        updateProject(project.id, { status: 'error', error: data.error });
        toast.error(data.error ?? 'Judge failed');
      } else {
        updateProject(project.id, { status: 'judged', judge: data });
        toast.success(`Scored ${data.average}/10`);
      }
    } catch (err) {
      updateProject(project.id, { status: 'error', error: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-12">
      <header className="grid gap-6 border-b border-ink/15 pb-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <span className="eyebrow text-muted">— 02 / The Desk</span>
          <h1 className="display-2 mt-3 font-serif text-ink">Submit a project.</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Drop files, or have a model generate them, then add the project to your bench.
            The judge will score it on three axes and slot it into the leaderboard.
          </p>
        </div>
        <div className="flex items-end justify-end md:col-span-4">
          <Badge variant="red" className="text-xs">Beta</Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7 enter">
          <CardHeader className="p-7">
            <span className="eyebrow text-muted">— A. Source files</span>
            <CardTitle className="mt-2 font-serif text-3xl">The code</CardTitle>
            <CardDescription>
              Drop a folder, pick files, or click <span className="text-ink">Generate with AI</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-7 pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Model that generated the code</Label>
                <div className="mt-1.5">
                  <ModelSelect value={modelId} onValueChange={setModelId} />
                </div>
              </div>
              <div>
                <Label>Prompt category (optional)</Label>
                <Input
                  className="mt-1.5"
                  placeholder="e.g. landing-page"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Original prompt</Label>
              <Textarea
                className="mt-1.5"
                placeholder="Build a calm productivity timer with a dark theme, ambient sounds, and stats."
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <FileUpload files={files} onChange={setFiles} />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-4">
              <Button
                type="button"
                variant="violet"
                size="lg"
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Generate with {model.label.split(' ')[0]}
              </Button>
              <Badge variant="outline">
                {files.length} file{files.length === 1 ? '' : 's'} ready
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 enter-2" accent="red">
          <CardHeader className="p-7">
            <span className="eyebrow text-muted">— B. Metadata</span>
            <CardTitle className="mt-2 font-serif text-3xl">The label</CardTitle>
            <CardDescription>
              Short and memorable. You can edit anything later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-7 pt-0">
            <div>
              <Label>Name</Label>
              <Input
                className="mt-1.5"
                placeholder="calm-productivity-timer"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="rounded-2xl border border-ink/15 bg-cream/60 p-4 text-xs leading-relaxed text-ink/80">
              <p className="font-serif text-base tracking-tightest text-ink">What happens next?</p>
              <ul className="mt-2 list-decimal space-y-1 pl-4">
                <li>The project is saved to your local bench.</li>
                <li>The judge scores it on three axes (1-10 each).</li>
                <li>Push to GitHub or re-judge from the dashboard.</li>
              </ul>
            </div>
            <Button
              variant="pill"
              size="xl"
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Save &amp; judge
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
