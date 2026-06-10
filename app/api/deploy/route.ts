// app/api/deploy/route.ts
// =========================================================================
// POST /api/deploy
//
// Pushes a project's files to a GitHub repository using the user's token
// (read from process.env.GITHUB_TOKEN or the per-request override) and
// returns the repo URL + optional GitHub Pages URL.
//
// Request body:
//   {
//     name: string,
//     description?: string,
//     files: ProjectFile[],
//     githubTokenOverride?: string,
//     pagesBranch?: string
//   }
// =========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { pushProject } from '@/lib/github';
import type { ProjectFile } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DeployRequestBody {
  name: string;
  description?: string;
  files: ProjectFile[];
  githubTokenOverride?: string;
  pagesBranch?: string;
}

export async function POST(req: NextRequest) {
  let body: DeployRequestBody;
  try {
    body = (await req.json()) as DeployRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, description, files, githubTokenOverride, pagesBranch } = body;

  if (!name || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json(
      { error: 'name and files[] are required' },
      { status: 400 },
    );
  }

  // Prefer server-side env var; allow per-request override for testing.
  const token = githubTokenOverride?.trim() || process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error:
          'GitHub token is not configured. Set GITHUB_TOKEN in .env or pass githubTokenOverride.',
      },
      { status: 400 },
    );
  }

  const branch = pagesBranch ?? process.env.GITHUB_PAGES_BRANCH ?? 'gh-pages';

  try {
    const { repo, pagesUrl } = await pushProject(
      token,
      sanitizeRepoName(name),
      description ?? 'Hosted by ModelBench',
      files,
      branch,
    );

    return NextResponse.json({
      repoUrl: repo.htmlUrl,
      repoFullName: repo.fullName,
      defaultBranch: repo.defaultBranch,
      pagesUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[api/deploy] failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function sanitizeRepoName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'modelbench-project'
  );
}
