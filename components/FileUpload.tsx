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

      // Use the relativePath property to preserve folder structure (Chromium).
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
          'group relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/40 p-6 text-center transition-colors',
          'hover:border-primary/50 hover:bg-card/70',
          dragOver && 'border-primary bg-primary/10',
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
        <UploadCloud className="mb-3 h-8 w-8 text-muted-foreground transition-transform group-hover:-translate-y-1" />
        <p className="text-sm font-medium">
          Drop files or a folder here, or <span className="text-primary">click to browse</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          HTML, CSS, JS/TS, JSON, MD, SVG. Folder upload supported.
        </p>
      </label>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="rounded-lg border border-border bg-card/40">
          <div className="flex items-center justify-between border-b border-border/60 p-3 text-xs text-muted-foreground">
            <span>{files.length} file{files.length === 1 ? '' : 's'} ready</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange([])}
            >
              Clear all
            </Button>
          </div>
          <ul className="max-h-64 divide-y divide-border/60 overflow-y-auto">
            {files.map((f, i) => (
              <li
                key={`${f.path}-${i}`}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono text-xs">{f.path}</span>
                  <span className="shrink-0 text-[10px] uppercase text-muted-foreground">
                    {f.language}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {f.content.length.toLocaleString()} chars
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                    className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
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
