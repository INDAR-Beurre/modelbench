'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileCode, Folder, X, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ProjectFile } from '@/lib/types';

interface Props {
  files: ProjectFile[];
  onChange: (files: ProjectFile[]) => void;
}

const ACCEPT = '.html,.css,.js,.jsx,.ts,.tsx,.json,.md,.svg,.txt,.vue,.svelte,.astro,.mjs,.cjs';

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', '.cache', 'coverage', '.vercel', '.netlify', '__pycache__']);

/** Recursively walk dropped items so we preserve the relative paths
 *  (the input element's `webkitdirectory` only gives paths on Chromium,
 *  and it's clunky for mixed file+folder drops). */
async function walkItems(items: DataTransferItemList): Promise<File[]> {
  const out: File[] = [];
  const seen = new Set<string>();
  const visit = async (item: DataTransferItem, prefix: string) => {
    // Modern API (Chromium, Firefox, Safari)
    const entry = (item as unknown as { webkitGetAsEntry?: () => FileSystemEntry | null }).webkitGetAsEntry?.();
    if (entry) {
      await walkEntry(entry, prefix, out, seen);
      return;
    }
    // Fallback: just use getAsFile()
    const f = item.getAsFile();
    if (f) out.push(f);
  };
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind !== 'file') continue;
    await visit(it, '');
  }
  return out;
}

async function walkEntry(
  entry: FileSystemEntry,
  prefix: string,
  out: File[],
  seen: Set<string>,
): Promise<void> {
  const path = prefix ? `${prefix}/${entry.name}` : entry.name;
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    // Build a fake File with a webkitRelativePath field
    Object.defineProperty(file, 'webkitRelativePath', { value: path, configurable: true });
    out.push(file);
  } else if (entry.isDirectory) {
    const dirName = entry.name;
    if (SKIP_DIRS.has(dirName)) return;
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    for (const c of children) {
      await walkEntry(c, path, out, seen);
    }
  }
}

function readAll(files: File[]): Promise<ProjectFile[]> {
  return Promise.all(
    files.map(async (f) => {
      const rel = (f as unknown as { webkitRelativePath?: string }).webkitRelativePath || f.name;
      const text = await f.text();
      return {
        path: rel.replace(/^\/+/, ''),
        content: text,
        language: guessLanguage(rel),
      };
    }),
  );
}

export function FileUpload({ files, onChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (incoming: ProjectFile[]) => {
      // Merge by path — replacing any existing files with the same name
      // and adding new ones.
      const map = new Map(files.map((f) => [f.path, f]));
      for (const f of incoming) map.set(f.path, f);
      onChange(Array.from(map.values()));
    },
    [files, onChange],
  );

  const handleFiles = useCallback(
    async (rawList: FileList | null) => {
      if (!rawList || rawList.length === 0) return;
      setError(null);
      setBusy(true);
      try {
        const items = Array.from(rawList);
        const next = await readAll(items);
        if (next.length === 0) {
          setError('No supported files found.');
          return;
        }
        await addFiles(next);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [addFiles],
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      setBusy(true);
      setError(null);
      try {
        const walked = await walkItems(e.dataTransfer.items);
        if (walked.length === 0) {
          // Fallback to e.dataTransfer.files
          const list = e.dataTransfer.files;
          const next = await readAll(Array.from(list));
          if (next.length === 0) {
            setError('No supported files found.');
            return;
          }
          await addFiles(next);
        } else {
          const next = await readAll(walked);
          if (next.length === 0) {
            setError('No supported files found.');
            return;
          }
          await addFiles(next);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [addFiles],
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
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="grid h-14 w-14 place-items-center rounded-full border border-ink bg-paper text-ink transition-transform duration-500 group-hover:-translate-y-1">
          {busy ? (
            <span className="h-3 w-3 animate-pulse rounded-full bg-ink" />
          ) : (
            <UploadCloud className="h-6 w-6" strokeWidth={1.5} />
          )}
        </div>
        <div>
          <p className="font-serif text-xl tracking-tightest text-ink">
            Drop an HTML file, a folder, or an entire Next.js project.
          </p>
          <p className="mt-1 text-xs text-muted">
            Or <span className="sweep text-ink">click to browse</span> · HTML, CSS, JS/TS, JSON, MD, SVG, Vue, Svelte
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            <FileCode className="h-3.5 w-3.5" /> Pick files
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              folderInputRef.current?.click();
            }}
          >
            <Folder className="h-3.5 w-3.5" /> Pick a folder
          </Button>
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error - non-standard but supported for folder pickers
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </label>

      {error && (
        <div className="flex items-center gap-2 rounded-pill border border-brand-red bg-brand-red/10 px-4 py-2 text-xs text-brand-red">
          <FileWarning className="h-3.5 w-3.5" />
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
  if (path.endsWith('.html') || path.endsWith('.htm')) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.ts')) return 'ts';
  if (path.endsWith('.jsx')) return 'jsx';
  if (path.endsWith('.mjs') || path.endsWith('.cjs')) return 'js';
  if (path.endsWith('.js')) return 'js';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.md') || path.endsWith('.mdx')) return 'md';
  if (path.endsWith('.svg')) return 'svg';
  if (path.endsWith('.vue')) return 'vue';
  if (path.endsWith('.svelte')) return 'svelte';
  if (path.endsWith('.astro')) return 'astro';
  return 'text';
}
