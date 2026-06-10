// components/Preview.tsx
// =========================================================================
// Live preview of a project's HTML output.
//
// We bundle the project files into a single HTML document (inlining CSS and
// JS that the index.html references) and render it in a sandboxed iframe
// via `srcdoc`. This avoids CORS issues, works offline, and stays inside
// the same origin so the styles don't bleed.
//
// We always hide the <iframe>'s scrollbar and clip to a fixed height so
// the preview looks like a window on a website rather than a full page.
// =========================================================================

'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Eye, EyeOff, RefreshCw, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/lib/types';

interface Props {
  files: ProjectFile[];
  /** When provided, a "Open" link to the deploy URL is shown. */
  deployUrl?: string;
  className?: string;
  /** Compact = tighter header, smaller height. */
  compact?: boolean;
}

const SANDBOX =
  'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin';

function findIndexHtml(files: ProjectFile[]): ProjectFile | undefined {
  // Prefer index.html at the root, then the first .html file.
  const root = files.find(
    (f) => /^index\.html?$/i.test(f.path.split('/').pop() ?? ''),
  );
  if (root) return root;
  return files.find((f) => /\.html?$/i.test(f.path));
}

function findFile(files: ProjectFile[], relPath: string): ProjectFile | undefined {
  // Strip leading slashes, find by exact match, then by basename.
  const clean = relPath.replace(/^\.?\//, '').replace(/^\/+/, '');
  const exact = files.find((f) => f.path === clean);
  if (exact) return exact;
  const base = clean.split('/').pop() ?? clean;
  return files.find((f) => f.path.split('/').pop() === base);
}

function readAttr(tag: string, attr: string): string | null {
  const re = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i');
  const m = tag.match(re);
  return m ? m[1] : null;
}

/**
 * Build a single self-contained HTML document from the project files.
 * - Inlines `<link rel="stylesheet" href="...">` → <style>...</style>
 * - Inlines `<script src="...">` (no module/defer-only restrictions) → <script>...</script>
 * - Leaves external links alone (CDNs etc).
 */
function bundleHtml(files: ProjectFile[]): string {
  const index = findIndexHtml(files);
  if (!index) {
    return `<!doctype html><html><body style="font-family:ui-monospace,monospace;padding:2rem;color:#120f0a;background:#fff7e6"><h1>No HTML file</h1><p>This project has no <code>index.html</code> or other <code>.html</code> file to preview. The judge can still score the source code, but the live preview is empty.</p></body></html>`;
  }
  let html = index.content;

  // Inline <link rel="stylesheet" href="..."> → <style>...</style>
  html = html.replace(
    /<link\b[^>]*rel\s*=\s*["']stylesheet["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*\/?>/gi,
    (full, href) => {
      const f = findFile(files, href);
      return f
        ? `<style data-bundled="${href}">\n${f.content}\n</style>`
        : full; // leave external CDNs alone
    },
  );

  // Inline <script src="..."> that point to project files (skip absolute, cdn, etc).
  html = html.replace(
    /<script\b([^>]*)src\s*=\s*["']([^"']+)["']([^>]*)><\/script>/gi,
    (full, pre, src, post) => {
      // Skip type=module and external URLs.
      const typeMatch = (pre + post).match(/type\s*=\s*["']([^"']+)["']/i);
      const isModule = typeMatch && /module/i.test(typeMatch[1]);
      if (isModule) return full;
      if (/^(https?:|data:|blob:|\/\/)/i.test(src)) return full;
      const f = findFile(files, src);
      return f
        ? `<script data-bundled="${src}">\n${f.content}\n</script>`
        : full;
    },
  );

  // Make sure the document is a complete one (some <html> fragments are valid
  // for `<iframe srcdoc>` but a full doc renders more reliably).
  if (!/<html[\s>]/i.test(html)) {
    html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}</body></html>`;
  }
  return html;
}

export function Preview({ files, deployUrl, className, compact }: Props) {
  const [show, setShow] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const html = useMemo(() => bundleHtml(files), [files]);
  const hasHtml = useMemo(() => files.some((f) => /\.html?$/i.test(f.path)), [files]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-ink bg-paper shadow-paper-2',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-ink/15 bg-cream/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-paper">
            <Eye className="h-3 w-3" strokeWidth={2} />
          </span>
          <span className="eyebrow text-ink">Live preview</span>
          {!hasHtml && (
            <span className="eyebrow text-muted">— no .html file</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-full p-1.5 text-ink/60 transition hover:bg-ink/10 hover:text-ink"
            aria-label="Reload preview"
            title="Reload"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="rounded-full p-1.5 text-ink/60 transition hover:bg-ink/10 hover:text-ink"
            aria-label={show ? 'Hide preview' : 'Show preview'}
            title={show ? 'Hide' : 'Show'}
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full p-1.5 text-ink/60 transition hover:bg-ink/10 hover:text-ink"
              aria-label="Open live site"
              title="Open live site"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
      {show && (
        <div className="relative">
          {hasHtml ? (
            <iframe
              key={reloadKey}
              title="Project preview"
              srcDoc={html}
              sandbox={SANDBOX}
              className={cn(
                'block w-full border-0 bg-white',
                compact ? 'h-[260px]' : 'h-[420px]',
              )}
            />
          ) : (
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-2 bg-cream/40 px-4 text-center text-muted',
                compact ? 'h-[180px]' : 'h-[220px]',
              )}
            >
              <Maximize2 className="h-5 w-5" />
              <p className="text-sm">No HTML file in this project to preview.</p>
              <p className="text-xs">The judge will still grade the source code.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
