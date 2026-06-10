// lib/judge.ts
// =========================================================================
// The "Automated AI Judging Engine" — the heart of ModelBench.
//
// We bundle the original user prompt with the generated source code and
// ask the configured LLM to act as a Senior Frontend QA Engineer. The
// model MUST return a strict JSON object so we can parse it safely.
//
// To MODIFY the rubric (add/remove criteria, change scoring, rewrite the
// persona) edit:
//   1. JUDGE_SYSTEM_PROMPT below
//   2. The JudgeScores / JudgeResult interfaces in lib/types.ts
//   3. The parseJudgeResponse() function if the JSON shape changes
// =========================================================================

import type { ChatMessage, CompletionResult } from './llm';
import { chatCompletion } from './llm';
import type { JudgeResult, JudgeScores, ModelSpec, Project } from './types';
import { clamp, safeJson, truncate } from './utils';
import { findModel } from './types';

export const JUDGE_SYSTEM_PROMPT = `You are a Senior Frontend QA Engineer with 15+ years of experience evaluating production web interfaces. You are precise, fair, and NEVER inflate scores.

Your job: review a generated web project (the source code is provided) against the original user prompt and return a strict, structured JSON evaluation.

SCORING RUBRIC (each 1-10, integers only):
- "design": Aesthetic appeal, layout balance, typography, color usage, visual hierarchy, spacing, and overall polish.
- "codeQuality": Efficiency, modern practices, clean structure, naming, accessibility considerations, and absence of obvious smells.
- "featureCompleteness": How thoroughly the implementation follows the original user prompt and delivers the requested features.

GUIDELINES:
- Score 9-10 only for genuinely excellent work with no obvious flaws.
- Score 7-8 for solid work with minor issues.
- Score 5-6 for average work that works but has notable gaps.
- Score 3-4 for incomplete or buggy work.
- Score 1-2 for broken, missing, or off-topic submissions.
- If the project is just a fragment or stub, score featureCompleteness harshly (1-3).

OUTPUT FORMAT (return ONLY this JSON object, no markdown, no commentary):
{
  "design": <integer 1-10>,
  "codeQuality": <integer 1-10>,
  "featureCompleteness": <integer 1-10>,
  "critique": "<2-4 sentence summary of what the model did well and what it missed>",
  "highlights": ["<short bullet>", "<short bullet>", "<short bullet>"]
}`;

export function buildJudgeUserMessage(project: Project): string {
  const fileList = project.files
    .map((f) => `- ${f.path} (${f.language ?? 'text'}, ${f.content.length} chars)`)
    .join('\n');

  const bundled = project.files
    .map((f) => `\n----- FILE: ${f.path} -----\n${truncate(f.content, 4000)}`)
    .join('\n');

  return `ORIGINAL USER PROMPT (the "assignment"):
"""
${project.prompt}
"""

PROJECT FILES:
${fileList}

GENERATED MODEL: ${project.model.label} (${project.model.provider}:${project.model.id})

SOURCE CODE (bundled):
${bundled}

Now evaluate strictly. Return ONLY the JSON object described in your instructions.`;
}

function extractJsonObject(raw: string): string {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return s;
}

export function parseJudgeResponse(raw: string, judgeModel: ModelSpec): JudgeResult {
  const cleaned = extractJsonObject(raw);
  const parsed = safeJson<Partial<JudgeScores> & {
    critique?: string;
    highlights?: string[];
  }>(cleaned, {});

  const design = clamp(Math.round(Number(parsed.design) || 0), 1, 10);
  const codeQuality = clamp(Math.round(Number(parsed.codeQuality) || 0), 1, 10);
  const featureCompleteness = clamp(
    Math.round(Number(parsed.featureCompleteness) || 0),
    1,
    10,
  );

  const scores: JudgeScores = { design, codeQuality, featureCompleteness };
  const total = design + codeQuality + featureCompleteness;
  const average = Number((total / 3).toFixed(2));

  return {
    scores,
    total,
    average,
    critique: String(parsed.critique ?? '').trim() || 'No critique provided.',
    highlights: Array.isArray(parsed.highlights)
      ? parsed.highlights.map((h) => String(h).trim()).filter(Boolean).slice(0, 5)
      : [],
    modelId: judgeModel.id,
    raw,
  };
}

/**
 * Run the judging engine for a project. The judge model defaults to the
 * configured default; override with `judgeModelId`.
 */
export async function judgeProject(
  project: Project,
  judgeModelId: string,
): Promise<JudgeResult> {
  const judgeModel = findModel(judgeModelId);
  if (!judgeModel) {
    throw new Error(`Unknown judge model: ${judgeModelId}`);
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: JUDGE_SYSTEM_PROMPT },
    { role: 'user', content: buildJudgeUserMessage(project) },
  ];

  let result: CompletionResult;
  try {
    result = await chatCompletion(judgeModel, messages, {
      temperature: 0.1,
      maxTokens: 1024,
      jsonMode: true,
    });
  } catch {
    // Fallback for models that don't support response_format=json_object.
    result = await chatCompletion(judgeModel, messages, {
      temperature: 0.1,
      maxTokens: 1024,
    });
  }

  return parseJudgeResponse(result.content, judgeModel);
}
