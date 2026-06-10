// lib/utils.ts
// =========================================================================
// Small utilities used across the app.
// `cn` is the standard shadcn helper for merging Tailwind classes.
// =========================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a short unique id (good enough for client-side project ids). */
export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** Format a unix timestamp as a human-readable date. */
export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Clamp a number between min and max. */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Best-effort truncation to keep prompts inside context windows. */
export function truncate(s: string, max = 12_000): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n\n/* ...truncated... */`;
}

/** Safe JSON parse with a fallback. */
export function safeJson<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
