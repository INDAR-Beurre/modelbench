// app/api/generate/route.ts
// =========================================================================
// POST /api/generate
//
// Convenience endpoint used by the "Generate with AI" flow. Takes a natural
// language prompt, asks the configured model to produce a complete
// self-contained web project, and returns the parsed files back to the
// client. The client then feeds those files into the upload/judge pipeline.
// =========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/llm';
import { findModel, type ProjectFile } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GenerateRequestBody {
  prompt: string;
  modelId: string;
}

const SYSTEM_PROMPT = `You are an expert frontend engineer. Generate a complete, self-contained web project for the user's prompt.

Return ONLY a JSON object in this exact shape (no markdown, no commentary):
{
  "files": [
    { "path": "index.html", "language": "html", "content": "<!doctype html>..." },
    { "path": "styles.css",  "language": "css",  "content": "/* ... */" },
    { "path": "script.js",  "language": "js",   "content": "// ..." }
  ]
}

Rules:
- Always include an "index.html" at the root.
- Use only vanilla HTML/CSS/JS unless the user explicitly requests a framework.
- Make the design modern, responsive, and accessible.
- Keep the code under ~600 lines total.
- If the project needs multiple files, split logically (html / css / js).`;

export async function POST(req: NextRequest) {
  let body: GenerateRequestBody;
  try {
    body = (await req.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.prompt?.trim() || !body.modelId) {
    return NextResponse.json(
      { error: 'prompt and modelId are required' },
      { status: 400 },
    );
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is not configured on the server.' },
      { status: 500 },
    );
  }

  const model = findModel(body.modelId);
  if (!model) {
    return NextResponse.json(
      { error: `Unknown modelId: ${body.modelId}` },
      { status: 400 },
    );
  }

  try {
    const result = await chatCompletion(
      model,
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: body.prompt },
      ],
      { temperature: 0.7, maxTokens: 4096, jsonMode: true },
    );

    const parsed = safeParseFiles(result.content);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Model did not return valid JSON. Raw output included.', raw: result.content },
        { status: 502 },
      );
    }

    return NextResponse.json({ files: parsed, model: model.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[api/generate] failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function safeParseFiles(raw: string): ProjectFile[] | null {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);
  try {
    const obj = JSON.parse(s) as { files?: ProjectFile[] };
    if (!Array.isArray(obj.files)) return null;
    return obj.files
      .filter((f) => f && typeof f.path === 'string' && typeof f.content === 'string')
      .map((f) => ({
        path: f.path,
        content: f.content,
        language: f.language ?? guessLanguage(f.path),
      }));
  } catch {
    return null;
  }
}

function guessLanguage(path: string): string {
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'ts';
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'js';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.md')) return 'md';
  return 'text';
}
