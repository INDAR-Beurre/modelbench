// lib/github.ts
// =========================================================================
// Minimal GitHub REST API client. We use it to:
//   1. Create a new repository for the user (or reuse one).
//   2. Push files into it via the Contents API.
//   3. (Optionally) trigger a GitHub Pages build and return the live URL.
//
// This module is SERVER-ONLY. The GITHUB_TOKEN is never sent to the browser.
// =========================================================================

import type { ProjectFile } from './types';

const GH_API = 'https://api.github.com';

export interface GitHubRepoInfo {
  owner: string;
  name: string;
  fullName: string; // "owner/name"
  htmlUrl: string;
  defaultBranch: string;
  pagesUrl?: string;
}

export interface CreateRepoOptions {
  name: string;
  description?: string;
  isPrivate?: boolean;
  autoInit?: boolean;
}

export class GitHubError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.body = body;
  }
}

function authHeaders(token: string, extra: Record<string, string> = {}) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ModelBench',
    ...extra,
  };
}

async function gh<T = unknown>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, {
    ...init,
    headers: { ...authHeaders(token), ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // leave body as text
  }
  if (!res.ok) {
    const msg =
      (body as { message?: string })?.message ??
      `GitHub API ${res.status} ${res.statusText}`;
    throw new GitHubError(msg, res.status, body);
  }
  return body as T;
}

/** Get the authenticated user (used to derive the owner for new repos). */
export async function getAuthenticatedUser(token: string) {
  const user = await gh<{ login: string; avatar_url: string }>(
    token,
    '/user',
  );
  return user;
}

/**
 * Create a new repository. If a repo with the same name already exists for
 * the user, we treat that as success and return the existing repo.
 */
export async function createOrGetRepo(
  token: string,
  opts: CreateRepoOptions,
): Promise<GitHubRepoInfo> {
  try {
    const repo = await gh<{
      full_name: string;
      html_url: string;
      name: string;
      owner: { login: string };
      default_branch: string;
    }>(token, '/user/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: opts.name,
        description: opts.description ?? 'Hosted by ModelBench',
        private: opts.isPrivate ?? false,
        auto_init: opts.autoInit ?? true,
      }),
    });
    return {
      fullName: repo.full_name,
      htmlUrl: repo.html_url,
      name: repo.name,
      owner: repo.owner.login,
      defaultBranch: repo.default_branch,
    };
  } catch (err) {
    if (err instanceof GitHubError && err.status === 422) {
      // Likely "name already exists" — fetch it instead.
      const user = await getAuthenticatedUser(token);
      const existing = await gh<{
        full_name: string;
        html_url: string;
        name: string;
        owner: { login: string };
        default_branch: string;
      }>(token, `/repos/${user.login}/${encodeURIComponent(opts.name)}`);
      return {
        fullName: existing.full_name,
        htmlUrl: existing.html_url,
        name: existing.name,
        owner: existing.owner.login,
        defaultBranch: existing.default_branch,
      };
    }
    throw err;
  }
}

/** Enable GitHub Pages on a repo, served from the given branch. */
export async function enablePages(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<string | undefined> {
  try {
    const res = await gh<{ html_url?: string }>(
      token,
      `/repos/${owner}/${repo}/pages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: { branch, path: '/' },
        }),
      },
    );
    return res.html_url;
  } catch {
    // Pages may not be available for all repos; ignore.
    return undefined;
  }
}

/** Upload (or overwrite) a single file in a repo. */
export async function putFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
): Promise<void> {
  const encodedPath = path
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  // For updates, we need the blob's sha. For new files, sha is omitted.
  let sha: string | undefined;
  try {
    const existing = await gh<{ sha: string }>(
      token,
      `/repos/${owner}/${repo}/contents/${encodedPath}`,
    );
    sha = existing.sha;
  } catch (err) {
    if (!(err instanceof GitHubError) || err.status !== 404) throw err;
  }

  await gh(token, `/repos/${owner}/${repo}/contents/${encodedPath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: toBase64(content),
      ...(sha ? { sha } : {}),
    }),
  });
}

function toBase64(s: string): string {
  // Use Buffer in node, btoa in the edge. Both produce base64 from a UTF-8 string.
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(s, 'utf-8').toString('base64');
  }
  // Browser fallback (shouldn't be used here, but safe)
  const btoaFn: (s: string) => string = (globalThis as { btoa?: (s: string) => string }).btoa ?? ((s: string) => s);
  return btoaFn(unescape(encodeURIComponent(s)));
}

/**
 * Push an entire project (set of files) into a repository.
 * Returns the repo info plus the (eventual) GitHub Pages URL.
 */
export async function pushProject(
  token: string,
  projectName: string,
  description: string,
  files: ProjectFile[],
  pagesBranch: string = 'gh-pages',
): Promise<{ repo: GitHubRepoInfo; pagesUrl?: string }> {
  const repo = await createOrGetRepo(token, {
    name: projectName,
    description,
    autoInit: true,
  });

  // Add a homepage-style index.html at the root if the project doesn't ship one.
  const hasIndex = files.some(
    (f) => f.path === 'index.html' || f.path.endsWith('/index.html'),
  );
  const filesToPush: ProjectFile[] = hasIndex
    ? files
    : [
        ...files,
        {
          path: 'index.html',
          content: defaultIndexHtml(projectName, description),
        },
      ];

  for (const file of filesToPush) {
    await putFile(
      token,
      repo.owner,
      repo.name,
      file.path,
      file.content,
      `Add ${file.path} via ModelBench`,
    );
  }

  const pagesUrl = await enablePages(
    token,
    repo.owner,
    repo.name,
    repo.defaultBranch,
  );

  return { repo, pagesUrl };
}

function defaultIndexHtml(name: string, description: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(name)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <style>
      html,body { margin:0; padding:0; font-family: system-ui, -apple-system, sans-serif; background:#0b0b0d; color:#fff; }
      .wrap { min-height: 100vh; display:flex; align-items:center; justify-content:center; padding: 2rem; }
      .card { max-width: 640px; padding: 2.5rem; border-radius: 16px; background: linear-gradient(180deg,#16161a,#0f0f12); border: 1px solid #232328; }
      h1 { margin: 0 0 0.5rem 0; font-size: 1.75rem; }
      p { color: #a1a1aa; line-height: 1.6; }
      a { color: #8b5cf6; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>${escapeHtml(name)}</h1>
        <p>${escapeHtml(description)}</p>
        <p>Hosted on GitHub Pages via <a href="https://github.com/codebuff-dev/modelbench">ModelBench</a>.</p>
      </div>
    </div>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
