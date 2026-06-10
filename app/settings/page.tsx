'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, ShieldCheck, ExternalLink } from 'lucide-react';
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
}

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const [form, setForm] = useState<AppSettings | null>(null);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<PingResults | null>(null);
  const [envStatus, setEnvStatus] = useState<{ groq: boolean; github: boolean } | null>(null);

  useEffect(() => {
    if (settings && !form) setForm(settings);
  }, [settings, form]);

  useEffect(() => {
    fetch('/api/test', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        setEnvStatus({
          groq: Boolean(data?.results?.groq?.ok),
          github: Boolean(data?.results?.github?.ok),
        });
      })
      .catch(() => setEnvStatus({ groq: false, github: false }));
  }, []);

  if (!form) {
    return (
      <div className="flex h-40 items-center justify-center text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  async function handleTest() {
    setTesting(true);
    setResults(null);
    try {
      const res = await fetch('/api/test', { method: 'POST' });
      const data = await res.json();
      setResults(data.results ?? {});
      setEnvStatus({
        groq: Boolean(data?.results?.groq?.ok),
        github: Boolean(data?.results?.github?.ok),
      });
      toast.success('Connection test complete');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    update(form);
    settingsStore.save(form);
    toast.success('Settings saved');
  }

  return (
    <div className="space-y-12">
      <header className="grid gap-6 border-b border-ink/15 pb-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <span className="eyebrow text-muted">— 04 / The Vault</span>
          <h1 className="display-2 mt-3 font-serif text-ink">Settings.</h1>
          <p className="mt-3 max-w-2xl text-muted">
            All API keys are managed on the server via environment variables.
            Nothing sensitive ever touches the browser.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7 enter">
          <CardHeader className="p-7">
            <span className="eyebrow text-muted">— A. Server keys</span>
            <CardTitle className="mt-2 flex items-center gap-2 font-serif text-3xl">
              <ShieldCheck className="h-5 w-5" /> Configured credentials
            </CardTitle>
            <CardDescription>
              Read directly from the hosting provider's environment. No inputs here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-7 pt-0">
            <EnvRow
              name="GROQ_API_KEY"
              provider="Groq"
              ok={envStatus?.groq}
              docsHint="Used by the judge and the in-app generator."
            />
            <EnvRow
              name="GITHUB_TOKEN"
              provider="GitHub"
              ok={envStatus?.github}
              docsHint="Used to push projects to repos and enable Pages."
            />

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
              Pings GitHub and Groq with the configured server keys.
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
              </div>
            )}
            <div className="rounded-2xl border border-ink/15 bg-cream/60 p-4 text-xs leading-relaxed text-ink/80">
              <p className="font-serif text-base tracking-tightest text-ink">Need to change a key?</p>
              <p className="mt-1">
                Open the Netlify dashboard, edit the env vars, and trigger a redeploy.
                Keys are never stored in the browser, the repo, or any response payload.
              </p>
              <a
                href="https://app.netlify.com/sites/modelbench-003cbaa2/configuration/env"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 font-medium text-ink underline underline-offset-4"
              >
                Open Netlify env vars <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="lime">Server-side only</Badge>
              <Badge variant="outline">No browser leaks</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EnvRow({
  name,
  provider,
  ok,
  docsHint,
}: {
  name: string;
  provider: string;
  ok?: boolean;
  docsHint?: string;
}) {
  const configured = ok !== undefined;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink/15 bg-paper/60 px-4 py-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink">{name}</span>
          <span className="eyebrow text-muted">— {provider}</span>
        </div>
        {docsHint && <p className="mt-1 text-[11px] text-muted">{docsHint}</p>}
      </div>
      {configured ? (
        ok ? <Badge variant="lime">Set</Badge> : <Badge variant="red">Missing</Badge>
      ) : (
        <Badge variant="outline">Checking…</Badge>
      )}
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
        {result.ok ? <Badge variant="lime">OK</Badge> : <Badge variant="red">Failed</Badge>}
        <span className="text-[10px] uppercase tracking-eyebrow text-muted">{result.detail}</span>
      </div>
    </div>
  );
}
