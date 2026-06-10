// lib/llm.ts
// =========================================================================
// OpenAI-compatible LLM client wrapper for Groq.
//
// Groq (https://console.groq.com) exposes an OpenAI-compatible REST API.
// We use the official `openai` SDK and point the base URL at it.
//
// ⚠️ This module is SERVER-ONLY. It reads API keys from process.env and
// must never be imported by a client component.
// =========================================================================

import OpenAI from 'openai';
import type { ModelSpec } from './types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface CompletionResult {
  content: string;
  model: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

/** Resolve the Groq API key. Throws a clear error if missing. */
export function getApiKey(): string {
  const env = process.env.GROQ_API_KEY;
  if (!env || env.trim().length === 0) {
    throw new Error(
      'Missing GROQ_API_KEY in the server environment. Set it via your hosting provider (e.g. Netlify env vars).',
    );
  }
  return env;
}

/** Create an OpenAI-compatible client pointed at Groq. */
export function getClient(model: ModelSpec): OpenAI {
  const apiKey = getApiKey();
  const baseURL = model.baseUrl ?? 'https://api.groq.com/openai/v1';
  return new OpenAI({ apiKey, baseURL });
}

/**
 * Send a chat completion to the configured model.
 * Use `jsonMode: true` to force structured JSON output (recommended for judging).
 */
export async function chatCompletion(
  model: ModelSpec,
  messages: ChatMessage[],
  opts: CompletionOptions = {},
): Promise<CompletionResult> {
  const client = getClient(model);
  const response = await client.chat.completions.create({
    model: model.id,
    messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 2048,
    ...(opts.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
  });

  const choice = response.choices[0];
  return {
    content: choice?.message?.content ?? '',
    model: response.model,
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined,
  };
}
