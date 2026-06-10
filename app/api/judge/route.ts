// app/api/judge/route.ts
// =========================================================================
// POST /api/judge
//
// Accepts a project payload, calls the judging engine, and returns the
// structured JudgeResult. All API keys are read from the SERVER environment
// (process.env) so they are never exposed to the browser.
//
// Request body:
//   {
//     project: Project,
//     judgeModelId?: string,
//     apiKeyOverride?: { groq?: string, grok?: string }
//   }
//
// Response: JudgeResult (or { error: string } on failure).
// =========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { judgeProject } from '@/lib/judge';
import type { LLMProvider, Project } from '@/lib/types';
import { findModel } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JudgeRequestBody {
  project: Project;
  judgeModelId?: string;
  apiKeyOverride?: Partial<Record<LLMProvider, string>>;
}

export async function POST(req: NextRequest) {
  let body: JudgeRequestBody;
  try {
    body = (await req.json()) as JudgeRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { project, judgeModelId, apiKeyOverride } = body;

  if (!project || !Array.isArray(project.files) || !project.prompt) {
    return NextResponse.json(
      { error: 'project.prompt and project.files are required' },
      { status: 400 },
    );
  }

  const modelId = judgeModelId ?? process.env.DEFAULT_MODEL ?? undefined;
  const model = modelId ? findModel(modelId) : undefined;
  if (!model) {
    return NextResponse.json(
      {
        error:
          'No judge model configured. Set DEFAULT_MODEL in .env or pass judgeModelId.',
      },
      { status: 400 },
    );
  }

  // Prefer the server-side env var, fall back to the per-request override
  // (handy when a user provides their own key in the Settings panel and the
  // server hasn't been configured with one).
  const apiKeyOverrideForProvider = apiKeyOverride?.[model.provider];

  try {
    const result = await judgeProject(project, model.id, apiKeyOverrideForProvider);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[api/judge] failed:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
