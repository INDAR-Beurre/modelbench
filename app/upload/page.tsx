'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Wand2, FlaskConical, Plus, X } from 'lucide-react';
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
import type { ModelSpec, ProjectFile } from '@/lib/types';
import { DEFAULT_MODEL_ID, MODEL_CATALOG, findModel } from '@/lib/types';

const SAMPLE_PROJECT: ProjectFile[] = [
  {
    path: 'index.html',
    language: 'html',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sample Landing</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="wrap">
      <header>
        <span class="eyebrow">— Sample Project</span>
        <h1>A calm landing page.</h1>
        <p>Hero, features grid, and a clear CTA — built with vanilla HTML &amp; CSS.</p>
        <a class="cta" href="#start">Get started</a>
      </header>
      <section class="features">
        <article><h3>Fast</h3><p>Zero dependencies, instant load.</p></article>
        <article><h3>Honest</h3><p>No tracking, no cookies, no fluff.</p></article>
        <article><h3>Quiet</h3><p>Designed to disappear into the background.</p></article>
      </section>
    </main>
  </body>
</html>`,
  },
  {
    path: 'styles.css',
    language: 'css',
    content: `:root {
  --ink: #120f0a;
  --paper: #fff7e6;
  --muted: #5e5548;
  --radius: 16px;
  font-family: system-ui, -apple-system, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); }
.wrap { max-width: 960px; margin: 0 auto; padding: 4rem 1.5rem; }
.eyebrow { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); }
h1 { font-size: clamp(2.25rem, 5vw, 4rem); line-height: 1; margin: 0.5rem 0 1rem; }
p { color: var(--muted); line-height: 1.6; max-width: 52ch; }
.cta { display: inline-block; margin-top: 1.5rem; padding: 0.85rem 1.5rem; background: var(--ink); color: var(--paper); border-radius: 999px; text-decoration: none; font-weight: 600; }
.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-top: 3rem; }
.features article { padding: 1.5rem; border: 1px solid rgba(18,15,10,0.15); border-radius: var(--radius); background: white; }
.features h3 { margin: 0 0 0.5rem; }
`,
  },
];

const SAMPLE_PROMPT =
  'Build a calm, minimal landing page for a meditation app with a serif hero, three feature cards, and a single primary CTA.';

export default function UploadPage() {
  const { addProject, updateProject } = useProjects();
  const { settings } = useSettings();

  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [customModelName, setCustomModelName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quick-paste state
  const [pasteName, setPasteName] = useState('index.html');
  const [pasteLang, setPasteLang] = useState<'html' | 'css' | 'js' | 'ts' | 'json' | 'md'>('html');
  const [pasteContent, setPasteContent] = useState('');

  const isCustom = modelId === 'custom';
  const model: ModelSpec = isCustom
    ? {
        id: 'custom',
        label: customModelName.trim() || 'Custom model',
        provider: 'groq',
      }
    : (findModel(modelId) ?? MODEL_CATALOG[0]);

  function loadSample() {
    setName('calm-meditation-landing');
    setPrompt(SAMPLE_PROMPT);
    setCategory('landing-page');
    setFiles(SAMPLE_PROJECT);
    toast.success('Sample project loaded — click Save & judge');
  }

  function handleAddPaste() {
    const trimmed = pasteContent.trim();
    if (!trimmed) {
      toast.error('Paste or type some code first');
      return;
    }
    const filename = (pasteName.trim() || 'index.html').replace(/^\/+/, '');
    const newFile: ProjectFile = {
      path: filename,
      content: pasteContent,
      language: pasteLang,
    };
    const idx = files.findIndex((f) => f.path === filename);
    if (idx >= 0) {
      const next = [...files];
      next[idx] = newFile;
      setFiles(next);
      toast.success(`Replaced ${filename}`);
    } else {
      setFiles([...files, newFile]);
      toast.success(`Added ${filename}`);
    }
    setPasteContent('');
  }

  function handleRemoveFile(path: string) {
    setFiles(files.filter((f) => f.path !== path));
  }

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
        body: JSON.stringify({ prompt, modelId }),
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
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Original prompt is required');
      return;
    }
    if (files.length === 0) {
      toast.error('Add at least one source file (paste, upload, or click Try sample)');
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
        }),
      });
      const data = await judgeRes.json();
      if (!judgeRes.ok) {
        updateProject(project.id, { status: 'error', error: data.error });
        toast.error(data.error ?? 'Judge failed');
      } else {
        updateProject(project.id, { status: 'judged', judge: data });
        toast.success(`Scored ${data.average}/10 — view it on the dashboard`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      updateProject(project.id, { status: 'error', error: message });
      toast.error(message);
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
            Paste an HTML page, drop a folder, or have a model generate one — then add it to
            your bench and the judge will score it.
          </p>
        </div>
        <div className="flex flex-col items-end justify-end gap-2 md:col-span-4">
          <Button variant="lime" size="sm" onClick={loadSample}>
            <FlaskConical className="h-3.5 w-3.5" /> Try sample
          </Button>
          <Badge variant="red" className="text-xs">Beta</Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7 enter">
          <CardHeader className="p-7">
            <span className="eyebrow text-muted">— A. Source files</span>
            <CardTitle className="mt-2 font-serif text-3xl">The code</CardTitle>
            <CardDescription>
              Paste an HTML page right here, drop a folder of files, or hit{' '}
              <span className="text-ink">Generate with AI</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-7 pt-0">
            {/* Quick-paste box */}
            <div className="rounded-2xl border border-ink/15 bg-cream/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Label className="!text-ink">Quick paste</Label>
                <span className="eyebrow text-muted">— Type or paste</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1.2fr_0.8fr_auto]">
                <Input
                  placeholder="index.html"
                  value={pasteName}
                  onChange={(e) => setPasteName(e.target.value)}
                  className="font-mono text-xs"
                />
                <select
                  value={pasteLang}
                  onChange={(e) => setPasteLang(e.target.value as typeof pasteLang)}
                  className="h-12 rounded-pill border border-ink/30 bg-paper/70 px-4 text-sm text-ink focus:outline-none focus:border-ink"
                >
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="js">JavaScript</option>
                  <option value="ts">TypeScript</option>
                  <option value="json">JSON</option>
                  <option value="md">Markdown</option>
                </select>
                <Button
                  type="button"
                  variant="lime"
                  onClick={handleAddPaste}
                  disabled={!pasteContent.trim()}
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              <Textarea
                className="mt-2 font-mono text-xs"
                placeholder={pasteLang === 'html' ? '<!doctype html>\n<html>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>' : '/* paste your code here */'}
                rows={8}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 text-[10px] uppercase tracking-eyebrow text-muted">
              <div className="h-px flex-1 bg-ink/15" />
              <span>or drop / upload a folder</span>
              <div className="h-px flex-1 bg-ink/15" />
            </div>

            <FileUpload files={files} onChange={setFiles} />

            {files.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-ink/20 bg-paper/80">
                <div className="flex items-center justify-between border-b border-ink/10 px-4 py-2.5">
                  <span className="eyebrow text-muted">
                    {files.length} file{files.length === 1 ? '' : 's'} in project
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setFiles([])}
                  >
                    Clear all
                  </Button>
                </div>
                <ul className="max-h-48 divide-y divide-ink/10 overflow-y-auto code-scroll">
                  {files.map((f) => (
                    <li
                      key={f.path}
                      className="flex items-center justify-between gap-2 px-4 py-2 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-mono text-xs text-ink">{f.path}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-eyebrow text-muted">
                          {f.language ?? 'text'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted">
                          {f.content.length.toLocaleString()} chars
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(f.path)}
                          className="rounded-full p-1 text-muted hover:bg-ink/10 hover:text-ink"
                          aria-label={`Remove ${f.path}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-4">
              <Button
                type="button"
                variant="violet"
                size="lg"
                onClick={handleGenerate}
                disabled={generating || !prompt.trim() || isCustom}
                title={isCustom ? 'In-app generation is only available for catalog models. Paste or upload files manually for custom entries.' : undefined}
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
              <Label>Model that generated the code</Label>
              <div className="mt-1.5">
                <ModelSelect value={modelId} onValueChange={setModelId} />
              </div>
              {isCustom && (
                <Input
                  className="mt-2"
                  placeholder="e.g. Llama 3.3 70B (Groq)"
                  value={customModelName}
                  onChange={(e) => setCustomModelName(e.target.value)}
                />
              )}
            </div>
            <div>
              <Label>Name</Label>
              <Input
                className="mt-1.5"
                placeholder="calm-productivity-timer"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
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
            <div>
              <Label>Original prompt</Label>
              <Textarea
                className="mt-1.5"
                placeholder="Build a calm productivity timer with a dark theme, ambient sounds, and stats."
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
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
