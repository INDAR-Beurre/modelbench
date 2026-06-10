// lib/judge.ts
// =========================================================================
// The "Automated AI Judging Engine" — the heart of ModelBench.
//
// We bundle the original user prompt with the generated source code and
// ask the configured LLM to act as a strict, expert Frontend QA reviewer.
// The model MUST return a strict JSON object so we can parse it safely.
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

export const JUDGE_SYSTEM_PROMPT = `You are a strict, world-class Senior Frontend QA Engineer with 20+ years of experience. You have reviewed thousands of production websites. You are honest, specific, and you DO NOT inflate scores. You have a reputation for brutal but fair feedback.

YOUR TASK
Review a generated web project against the user's original prompt and return a strict JSON evaluation. You will be scored by humans on whether your critique is specific and accurate.

YOU WILL SCORE THREE AXES, each an integer from 1 to 10.

1. "design" — visual design and UX
   - 9-10: Magazine-grade. Distinctive typography, intentional color palette, clear hierarchy, generous spacing, no obvious flaws.
   - 7-8: Solid. Looks professional, coherent, minor polish issues.
   - 5-6: Functional. Layout works but feels generic, unbalanced, or dated.
   - 3-4: Weak. Confusing layout, harsh typography, poor spacing, no hierarchy.
   - 1-2: Broken or off-topic. No visual identity, broken layout, or missing UI.
   Look at: typography choices, color usage, spacing rhythm, hierarchy, responsiveness, consistency.

2. "codeQuality" — engineering quality of the source
   - 9-10: Production-ready. Clean structure, modern patterns, accessible, no smells.
   - 7-8: Solid. Good structure, few minor issues, mostly modern.
   - 5-6: Workable. Works but has notable smells, outdated patterns, or missing accessibility.
   - 3-4: Sloppy. Repetition, dead code, broken patterns, no separation of concerns.
   - 1-2: Broken or empty. Syntax errors, missing files, no structure.
   Look at: HTML semantics, CSS architecture, JS/TS patterns, accessibility (alt, aria, labels), error handling, no inline styles, responsive design.

3. "featureCompleteness" — how thoroughly it follows the original prompt
   - 9-10: Every requested feature is implemented and working.
   - 7-8: Most features are present, minor gaps.
   - 5-6: Core idea is there, several features missing or stubbed.
   - 3-4: Only a fragment of the prompt is implemented.
   - 1-2: Off-topic, broken, or empty.
   Read the prompt carefully. List every feature it asks for. Verify each one in the code.

CRITICAL RULES
- You are evaluating a small bundle of source files. You CANNOT see it rendered. Infer visual quality from code choices (semantic HTML, design tokens, CSS variables, custom typography, color systems, layout primitives).
- A hello-world with a button is design 4-5, codeQuality 4-6, featureCompleteness 1-2 unless the prompt asked for "a button".
- Do NOT give 9-10 to a generic Bootstrap-looking page. Do NOT give 7+ to broken or stub code.
- If the project only has 1-2 short files, be honest: design ≤5, codeQuality ≤6 unless they are genuinely exceptional.
- Be specific in your critique. Name files, point to lines (approximate), call out real issues.
- "highlights" should be 2-4 specific things the model did RIGHT, not generic praise.
- You MUST return ONLY the JSON object. No prose, no markdown, no commentary before or after.

OUTPUT FORMAT (return ONLY this JSON object):
{
  "design": <integer 1-10>,
  "codeQuality": <integer 1-10>,
  "featureCompleteness": <integer 1-10>,
  "critique": "<2-4 sentence specific critique. Name what works and what is missing/broken.>",
  "highlights": ["<specific thing done well>", "<specific thing done well>", "<specific thing done well>"],
  "verdict": "<one short sentence summary, like 'Solid landing page, missing mobile menu.'>"
}`;

export function buildJudgeUserMessage(project: Project): string {
  const fileList = project.files
    .map((f) => `- ${f.path} (${f.language ?? 'text'}, ${f.content.length} chars)`)
    .join('\n');

  // Truncate each file to keep token usage sane but preserve full content
  // for small projects.
  const bundled = project.files
    .map((f) => {
      const isLarge = f.content.length > 6000;
      const body = isLarge
        ? `${truncate(f.content, 4000)}\n\n... [truncated, file is ${f.content.length} chars]`
        : f.content;
      return `\n----- FILE: ${f.path} -----\n${body}`;
    })
    .join('\n');

  return `ORIGINAL USER PROMPT (the assignment the model was given):
"""
${project.prompt}
"""

PROJECT FILES (${project.files.length} files, ${bundled.length.toLocaleString()} chars total):
${fileList}

${bundled}

INSTRUCTIONS
1. Read the prompt carefully. Enumerate the features it asks for.
2. For each file, scan the code. Note specific patterns: semantic HTML, design tokens (CSS variables, custom properties), typography, color systems, accessibility (alt text, aria-*, labels, focus states), responsive utilities, error handling.
3. Score strictly using the rubric in your system prompt.
4. Return ONLY the JSON object. No markdown fences, no preamble.`;
}

function extractJsonObject(raw: string): string {
  let s = raw.trim();
  // Strip markdown code fences.
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // Find the first { and last }.
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
    verdict?: string;
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
    verdict: String(parsed.verdict ?? '').trim() || undefined,
    highlights: Array.isArray(parsed.highlights)
      ? parsed.highlights.map((h) => String(h).trim()).filter(Boolean).slice(0, 4)
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
    // jsonMode first (Groq supports it).
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
