// app/api/test/route.ts
// =========================================================================
// POST /api/test
//
// Lightweight "do my API keys work?" check. Returns a small JSON describing
// which providers are configured and whether the keys are valid.
//
// Request body (optional):
//   { githubTokenOverride?: string, groqApiKeyOverride?: string, grokApiKeyOverride?: string }
// =========================================================================

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TestRequestBody {
  githubTokenOverride?: string;
  groqApiKeyOverride?: string;
  grokApiKeyOverride?: string;
}

export async function POST(req: NextRequest) {
  let body: TestRequestBody = {};
  try {
    body = (await req.json()) as TestRequestBody;
  } catch {
    // empty body is fine
  }

  const githubToken = body.githubTokenOverride?.trim() || process.env.GITHUB_TOKEN;
  const groqKey = body.groqApiKeyOverride?.trim() || process.env.GROQ_API_KEY;
  const grokKey = body.grokApiKeyOverride?.trim() || process.env.GROK_API_KEY;

  const results: Record<string, { ok: boolean; detail?: string }> = {};

  // --- GitHub ---
  if (!githubToken) {
    results.github = { ok: false, detail: 'Token missing' };
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
  if (!groqKey) {
    results.groq = { ok: false, detail: 'Key missing' };
  } else {
    results.groq = await pingOpenAICompatible('groq', groqKey);
  }

  // --- Grok ---
  if (!grokKey) {
    results.grok = { ok: false, detail: 'Key missing' };
  } else {
    results.grok = await pingOpenAICompatible('grok', grokKey);
  }

  return NextResponse.json({ results });
}

async function pingOpenAICompatible(
  provider: 'groq' | 'grok',
  apiKey: string,
): Promise<{ ok: boolean; detail?: string }> {
  const baseURL =
    provider === 'groq'
      ? 'https://api.groq.com/openai/v1'
      : 'https://api.x.ai/v1';
  try {
    const client = new OpenAI({ apiKey, baseURL });
    await client.models.list();
    return { ok: true, detail: `${provider} reachable` };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return {
      ok: false,
      detail: e.message ?? `${provider} request failed`,
    };
  }
}
