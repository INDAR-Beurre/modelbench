'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Loader2, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ModelSelect } from '@/components/ModelSelect';
import { useSettings } from '@/hooks/useProjects';
import { settingsStore } from '@/lib/store';
import type { AppSettings } from '@/lib/types';

interface PingResults {
  github?: { ok: boolean; detail?: string };
  groq?: { ok: boolean; detail?: string };
  grok?: { ok: boolean; detail?: string };
}

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const [form, setForm] = useState<AppSettings | null>(null);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<PingResults | null>(null);

  useEffect(() => {
    if (settings && !form) setForm(settings);
  }, [settings, form]);

  if (!form) {
    return (
      <div className="flex h-40 items-center justify-center text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  async function handleTest() {
    if (!form) return;
    setTesting(true);
    setResults(null);
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubTokenOverride: form.githubToken || undefined,
          groqApiKeyOverride: form.groqApiKey || undefined,
          grokApiKeyOverride: form.grokApiKey || undefined,
        }),
      });
      const data = await res.json();
      setResults(data.results ?? {});
      toast.success('Connection test complete');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    if (!form) return;
    update(form);
    settingsStore.save(form);
    toast.success('Settings saved locally');
  }

  return (
    <div className="space-y-12">
      <header className="grid gap-6 border-b border-ink/15 pb-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <span className="eyebrow text-muted">— 04 / The Vault</span>
          <h1 className="display-2 mt-3 font-serif text-ink">Settings.</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Keys live in your browser. The server also reads{' '}
            <code className="rounded bg-cream px-1.5 py-0.5 text-xs text-ink">process.env</code>{' '}
            as a fallback.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7 enter">
          <CardHeader className="p-7">
            <span className="eyebrow text-muted">— A. Credentials</span>
            <CardTitle className="mt-2 flex items-center gap-2 font-serif text-3xl">
              <KeyRound className="h-5 w-5" /> API keys
            </CardTitle>
            <CardDescription>
              Optional — leave blank to use the server environment defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-7 pt-0">
            <div>
              <Label>Groq API key</Label>
              <Input
                className="mt-1.5"
                type="password"
                placeholder="gsk_..."
                value={form.groqApiKey}
                onChange={(e) => setForm({ ...form, groqApiKey: e.target.value })}
              />
            </div>
            <div>
              <Label>xAI (Grok) API key</Label>
              <Input
                className="mt-1.5"
                type="password"
                placeholder="xai-..."
                value={form.grokApiKey}
                onChange={(e) => setForm({ ...form, grokApiKey: e.target.value })}
              />
            </div>
            <div>
              <Label>GitHub token</Label>
              <Input
                className="mt-1.5"
                type="password"
                placeholder="ghp_..."
                value={form.githubToken}
                onChange={(e) => setForm({ ...form, githubToken: e.target.value })}
              />
              <p className="mt-1 text-[11px] uppercase tracking-eyebrow text-muted">
                Needs <code>repo</code> scope · never sent to the browser
              </p>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Default judge model</Label>
                <div className="mt-1.5">
                  <ModelSelect
                    value={form.defaultJudgeModelId}
                    onValueChange={(v) => setForm({ ...form, defaultJudgeModelId: v })}
                  />
                </div>
              </div>
              <div>
                <Label>GitHub Pages branch</Label>
                <Input
                  className="mt-1.5"
                  value={form.githubPagesBranch}
                  onChange={(e) => setForm({ ...form, githubPagesBranch: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button variant="pill" onClick={handleSave}>
                <Save className="h-4 w-4" /> Save
              </Button>
              <Button variant="violet" onClick={handleTest} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Test connections
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 enter-2">
          <CardHeader className="p-7">
            <span className="eyebrow text-muted">— B. Diagnostics</span>
            <CardTitle className="mt-2 font-serif text-3xl">Connection test</CardTitle>
            <CardDescription>
              Pings GitHub, Groq, and xAI with the configured keys.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-7 pt-0">
            {!results ? (
              <p className="text-sm text-muted">
                Click <span className="text-ink">Test connections</span> to see results.
              </p>
            ) : (
              <div className="space-y-2">
                <ResultRow name="GitHub" result={results.github} />
                <ResultRow name="Groq" result={results.groq} />
                <ResultRow name="xAI Grok" result={results.grok} />
              </div>
            )}
            <div className="rounded-2xl border border-ink/15 bg-cream/60 p-4 text-xs leading-relaxed text-ink/80">
              <p className="font-serif text-base tracking-tightest text-ink">Security note</p>
              <p className="mt-1">
                Keys live in <code>localStorage</code> so each user can have their own.
                The server still validates them via <code>/api/test</code>, so keys never
                appear in network responses to the browser.
              </p>
              <p className="mt-2">
                For production, prefer the server-side{' '}
                <code>process.env</code> approach and remove the localStorage fallback.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="lime">Server-side</Badge>
              <Badge variant="outline">No leaks</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultRow({ name, result }: { name: string; result?: { ok: boolean; detail?: string } }) {
  if (!result) {
    return (
      <div className="flex items-center justify-between rounded-pill border border-ink/15 bg-paper/60 px-4 py-2.5 text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-[10px] uppercase tracking-eyebrow text-muted">Not tested</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-pill border border-ink/15 bg-paper/60 px-4 py-2.5 text-sm">
      <span className="font-medium">{name}</span>
      <div className="flex items-center gap-2">
        {result.ok ? (
          <Badge variant="lime">OK</Badge>
        ) : (
          <Badge variant="red">Failed</Badge>
        )}
        <span className="text-[10px] uppercase tracking-eyebrow text-muted">{result.detail}</span>
      </div>
    </div>
  );
}
