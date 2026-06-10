// lib/llm.ts
// =========================================================================
// OpenAI-compatible LLM client wrapper for Groq and xAI Grok.
//
// Both Groq (https://console.groq.com) and xAI (https://console.x.ai) expose
// OpenAI-compatible REST APIs. We use the official `openai` SDK and just
// point the base URL at whichever provider we want to talk to.
//
// ⚠️ This module is SERVER-ONLY. It reads API keys from process.env and
// must never be imported by a client component.
// =========================================================================

import OpenAI from 'openai';
import type { LLMProvider, ModelSpec } from './types';

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

/** Resolve the API key for a provider. Throws a clear error if missing. */
export function getApiKey(provider: LLMProvider): string {
  const env =
    provider === 'groq' ? process.env.GROQ_API_KEY : process.env.GROK_API_KEY;
  if (!env || env.trim().length === 0) {
    throw new Error(
      `Missing API key for ${provider}. Set ${
        provider === 'groq' ? 'GROQ_API_KEY' : 'GROK_API_KEY'
      } in your server environment.`,
    );
  }
  return env;
}

/** Create an OpenAI-compatible client for the given provider. */
export function getClient(
  provider: LLMProvider,
  baseUrlOverride?: string,
  apiKeyOverride?: string,
): OpenAI {
  const apiKey = apiKeyOverride ?? getApiKey(provider);
  const baseURL =
    baseUrlOverride ??
    (provider === 'groq'
      ? 'https://api.groq.com/openai/v1'
      : 'https://api.x.ai/v1');
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
  apiKeyOverride?: string,
): Promise<CompletionResult> {
  const client = getClient(model.provider, model.baseUrl, apiKeyOverride);
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
