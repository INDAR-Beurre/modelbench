'use client';

import { useCallback, useState } from 'react';
import { UploadCloud, FileCode, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ProjectFile } from '@/lib/types';

interface Props {
  files: ProjectFile[];
  onChange: (files: ProjectFile[]) => void;
}

const ACCEPT = '.html,.css,.js,.jsx,.ts,.tsx,.json,.md,.svg,.txt,.vue,.svelte';

export function FileUpload({ files, onChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (rawList: FileList | null) => {
      if (!rawList || rawList.length === 0) return;
      setError(null);

      const items = Array.from(rawList);
      const next: ProjectFile[] = [];
      for (const f of items) {
        const rel =
          (f as unknown as { webkitRelativePath?: string }).webkitRelativePath ||
          (f as unknown as { relativePath?: string }).relativePath ||
          f.name;
        if (!rel) continue;
        const text = await f.text();
        next.push({
          path: rel.replace(/^\/+/, ''),
          content: text,
          language: guessLanguage(rel),
        });
      }
      onChange([...files, ...next]);
    },
    [files, onChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'group relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-ink/30 bg-paper/60 p-8 text-center transition-all duration-500',
          'hover:border-ink hover:bg-paper',
          dragOver && 'border-ink bg-brand-lime/30',
        )}
      >
        <input
          type="file"
          multiple
          // @ts-expect-error - non-standard but supported for folder pickers
          webkitdirectory=""
          directory=""
          accept={ACCEPT}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="grid h-14 w-14 place-items-center rounded-full border border-ink bg-paper text-ink transition-transform duration-500 group-hover:-translate-y-1">
          <UploadCloud className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-serif text-xl tracking-tightest text-ink">
            Drop files, drop a folder.
          </p>
          <p className="mt-1 text-xs text-muted">
            Or <span className="sweep text-ink">click to browse</span> · HTML, CSS, JS/TS, JSON, MD, SVG
          </p>
        </div>
      </label>

      {error && (
        <div className="rounded-pill border border-brand-red bg-brand-red/10 px-4 py-2 text-xs text-brand-red">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-ink/20 bg-paper/80">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-2.5">
            <span className="eyebrow text-muted">
              {files.length} file{files.length === 1 ? '' : 's'} ready
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange([])}
            >
              Clear
            </Button>
          </div>
          <ul className="max-h-64 divide-y divide-ink/10 overflow-y-auto code-scroll">
            {files.map((f, i) => (
              <li
                key={`${f.path}-${i}`}
                className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileCode className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.5} />
                  <span className="truncate font-mono text-xs text-ink">{f.path}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-eyebrow text-muted">
                    {f.language}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted">
                    {f.content.length.toLocaleString()} chars
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(files.filter((_, idx) => idx !== i))}
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
    </div>
  );
}

function guessLanguage(path: string): string {
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'ts';
  if (path.endsWith('.jsx') || path.endsWith('.js')) return 'js';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.md')) return 'md';
  if (path.endsWith('.svg')) return 'svg';
  if (path.endsWith('.vue')) return 'vue';
  if (path.endsWith('.svelte')) return 'svelte';
  return 'text';
}
