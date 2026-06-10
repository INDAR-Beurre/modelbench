// lib/store.ts
// =========================================================================
// Browser-side persistence helpers. We keep project data in localStorage so
// the app works without any backend database. API keys are NOT stored here —
// they live exclusively on the server in environment variables.
// =========================================================================

import type { AppSettings, Project } from './types';

const NAMESPACE = 'modelbench';

const KEYS = {
  projects: `${NAMESPACE}:projects`,
  settings: `${NAMESPACE}:settings`,
} as const;

function safeGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled — silently ignore.
  }
}

export const projectsStore = {
  load(): Project[] {
    return safeGet<Project[]>(KEYS.projects) ?? [];
  },
  save(projects: Project[]): void {
    safeSet(KEYS.projects, projects);
  },
  upsert(project: Project): Project[] {
    const all = projectsStore.load();
    const idx = all.findIndex((p) => p.id === project.id);
    if (idx === -1) all.unshift(project);
    else all[idx] = project;
    projectsStore.save(all);
    return all;
  },
  remove(id: string): Project[] {
    const all = projectsStore.load().filter((p) => p.id !== id);
    projectsStore.save(all);
    return all;
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(KEYS.projects);
  },
};

export const settingsStore = {
  load(): AppSettings {
    return (
      safeGet<AppSettings>(KEYS.settings) ?? {
        defaultJudgeModelId: 'llama-3.3-70b-versatile',
        githubPagesBranch: 'gh-pages',
      }
    );
  },
  save(settings: AppSettings): void {
    safeSet(KEYS.settings, settings);
  },
};
