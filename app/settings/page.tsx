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
      <div className="flex h-40 items-center justify-center text-muted-foreground">
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          All keys are stored in your browser's localStorage. Server routes also
          read <code className="text-foreground">process.env</code> as a fallback.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> API keys
            </CardTitle>
            <CardDescription>
              Optional — leave blank to use the server environment defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Groq API key</Label>
              <Input
                className="mt-1.5 font-mono"
                type="password"
                placeholder="gsk_..."
                value={form.groqApiKey}
                onChange={(e) => setForm({ ...form, groqApiKey: e.target.value })}
              />
            </div>
            <div>
              <Label>xAI (Grok) API key</Label>
              <Input
                className="mt-1.5 font-mono"
                type="password"
                placeholder="xai-..."
                value={form.grokApiKey}
                onChange={(e) => setForm({ ...form, grokApiKey: e.target.value })}
              />
            </div>
            <div>
              <Label>GitHub token</Label>
              <Input
                className="mt-1.5 font-mono"
                type="password"
                placeholder="ghp_..."
                value={form.githubToken}
                onChange={(e) => setForm({ ...form, githubToken: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Needs <code>repo</code> scope. Never sent to the browser.
              </p>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
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
                  className="mt-1.5 font-mono"
                  value={form.githubPagesBranch}
                  onChange={(e) => setForm({ ...form, githubPagesBranch: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4" /> Save
              </Button>
              <Button variant="outline" onClick={handleTest} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Test connections
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection test</CardTitle>
            <CardDescription>
              Pings GitHub, Groq, and xAI with the configured keys.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!results ? (
              <p className="text-sm text-muted-foreground">
                Click <span className="text-foreground">Test connections</span> to see results.
              </p>
            ) : (
              <div className="space-y-2">
                <ResultRow name="GitHub" result={results.github} />
                <ResultRow name="Groq" result={results.groq} />
                <ResultRow name="xAI Grok" result={results.grok} />
              </div>
            )}
            <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">Security note</p>
              <p>
                This UI stores keys in <code>localStorage</code> so each user can have
                their own. The server still validates them by calling
                <code> /api/test</code>, so keys never appear in network responses
                to the browser.
              </p>
              <p className="mt-2">
                For production, prefer the server-side{' '}
                <code>process.env</code> approach and remove the localStorage fallback.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Server: keys hidden from browser</Badge>
              <Badge variant="info">Next.js App Router</Badge>
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
      <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/30 p-3 text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">Not tested</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/30 p-3 text-sm">
      <span className="font-medium">{name}</span>
      <div className="flex items-center gap-2">
        {result.ok ? (
          <Badge variant="success">OK</Badge>
        ) : (
          <Badge variant="destructive">Failed</Badge>
        )}
        <span className="text-xs text-muted-foreground">{result.detail}</span>
      </div>
    </div>
  );
}
