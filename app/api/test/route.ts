// app/api/test/route.ts
// =========================================================================
// POST /api/test
//
// Lightweight "do my server-side API keys work?" check. Returns a small
// JSON describing which providers are configured and whether they respond.
// =========================================================================

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  const results: Record<string, { ok: boolean; detail?: string }> = {};

  // --- GitHub ---
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    results.github = { ok: false, detail: 'Token missing on server' };
  } else {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      if (res.ok) {
        const user = (await res.json()) as { login: string };
        results.github = { ok: true, detail: `Authenticated as ${user.login}` };
      } else {
        results.github = { ok: false, detail: `HTTP ${res.status}` };
      }
    } catch (err) {
      results.github = { ok: false, detail: (err as Error).message };
    }
  }

  // --- Groq ---
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    results.groq = { ok: false, detail: 'Key missing on server' };
  } else {
    try {
      const client = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
      await client.models.list();
      results.groq = { ok: true, detail: 'Groq reachable' };
    } catch (err) {
      const e = err as { status?: number; message?: string };
      results.groq = { ok: false, detail: e.message ?? 'Groq request failed' };
    }
  }

  return NextResponse.json({ results });
}
