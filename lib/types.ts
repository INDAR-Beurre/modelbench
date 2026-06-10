// lib/types.ts
// =========================================================================
// Core domain types for ModelBench.
// Keeping these in one place makes it easy to extend the schema when you
// add new evaluation criteria, models, or storage backends.
// =========================================================================

/** Identifier for an LLM provider we support. */
export type LLMProvider = 'groq' | 'grok' | 'custom';

/** A configured model entry. The "id" is what we send to the provider. */
export interface ModelSpec {
  id: string; // e.g. "llama-3.3-70b-versatile"
  label: string; // human-readable, e.g. "Llama 3.3 70B (Groq)"
  provider: LLMProvider;
  baseUrl?: string; // optional override
}

/** Structured scores returned by the judging engine. */
export interface JudgeScores {
  design: number; // 1-10
  codeQuality: number; // 1-10
  featureCompleteness: number; // 1-10
}

/** Full evaluation result for a single project. */
export interface JudgeResult {
  scores: JudgeScores;
  total: number; // sum of the three scores, 0-30
  average: number; // average, 0-10
  critique: string;
  highlights: string[];
  modelId: string; // model that produced the evaluation
  raw?: string; // raw LLM response (for debugging)
}

/** A user-submitted project, possibly tied to a prompt category. */
export interface Project {
  id: string;
  name: string;
  prompt: string;
  promptCategory: string; // groups projects that share the same prompt
  model: ModelSpec; // model that GENERATED the code
  judgeModelId: string; // model used to judge the code
  files: ProjectFile[]; // source files
  createdAt: number;
  repoUrl?: string;
  deployUrl?: string;
  judge?: JudgeResult;
  status: 'pending' | 'judging' | 'judged' | 'error';
  error?: string;
}

/** A single file inside a project. */
export interface ProjectFile {
  path: string; // relative path, e.g. "index.html" or "src/main.tsx"
  content: string;
  language?: string; // 'html' | 'css' | 'js' | 'ts' | etc.
}

/** App settings (stored in localStorage). */
export interface AppSettings {
  githubToken: string;
  groqApiKey: string;
  grokApiKey: string;
  defaultJudgeModelId: string;
  githubPagesBranch: string;
}

/** Per-provider API key resolution. */
export type ApiKeyResolver = (provider: LLMProvider) => string | undefined;

/** Catalog of models that ship with ModelBench. */
export const MODEL_CATALOG: ModelSpec[] = [
  {
    id: 'llama-3.3-70b-versatile',
    label: 'Llama 3.3 70B (Groq)',
    provider: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  {
    id: 'llama-3.1-8b-instant',
    label: 'Llama 3.1 8B Instant (Groq)',
    provider: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  {
    id: 'qwen-2.5-32b-instruct',
    label: 'Qwen 2.5 32B (Groq)',
    provider: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  {
    id: 'grok-3-mini',
    label: 'Grok 3 Mini (xAI)',
    provider: 'grok',
    baseUrl: 'https://api.x.ai/v1',
  },
  {
    id: 'grok-2-1212',
    label: 'Grok 2 (xAI)',
    provider: 'grok',
    baseUrl: 'https://api.x.ai/v1',
  },
  {
    id: 'custom',
    label: 'Custom (specify below)',
    provider: 'custom',
  },
];

/** Resolve a model spec by id (helper used in routes and UI). */
export function findModel(id: string): ModelSpec | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}

/** Default model to use when nothing is configured. */
export const DEFAULT_MODEL_ID = 'llama-3.3-70b-versatile';
