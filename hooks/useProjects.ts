// hooks/useProjects.ts
// =========================================================================
// Projects store + thin wrappers around the /api/judge and /api/deploy
// routes. API keys live exclusively on the server, so we never accept or
// forward per-request credentials from the client.
// =========================================================================

import { useCallback, useEffect, useState } from 'react';
import { projectsStore, settingsStore } from '@/lib/store';
import type { AppSettings, Project } from '@/lib/types';
import { uid } from '@/lib/utils';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProjects(projectsStore.load());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: Project[]) => {
    setProjects(next);
    projectsStore.save(next);
  }, []);

  const addProject = useCallback(
    (data: Omit<Project, 'id' | 'createdAt' | 'status'>): Project => {
      const project: Project = {
        ...data,
        id: uid('proj'),
        createdAt: Date.now(),
        status: 'pending',
      };
      persist([project, ...projects]);
      return project;
    },
    [projects, persist],
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<Project>) => {
      const next = projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
      persist(next);
    },
    [projects, persist],
  );

  const removeProject = useCallback(
    (id: string) => {
      persist(projects.filter((p) => p.id !== id));
    },
    [projects, persist],
  );

  return { projects, hydrated, addProject, updateProject, removeProject };
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  useEffect(() => {
    setSettings(settingsStore.load());
  }, []);
  const update = useCallback((next: AppSettings) => {
    setSettings(next);
    settingsStore.save(next);
  }, []);
  return { settings, update };
}

/** Run the judging engine for a project. */
export async function runJudge(
  project: Project,
  judgeModelId: string,
): Promise<Project> {
  const res = await fetch('/api/judge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, judgeModelId }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ...project, status: 'error', error: data.error ?? 'Judge failed' };
  }
  return { ...project, status: 'judged', judge: data, judgeModelId };
}

/** Run the GitHub deploy for a project. */
export async function runDeploy(
  project: Project,
  pagesBranch?: string,
): Promise<Project> {
  const res = await fetch('/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: project.name,
      description: project.prompt.slice(0, 140),
      files: project.files,
      pagesBranch,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ...project, error: data.error ?? 'Deploy failed' };
  }
  return { ...project, repoUrl: data.repoUrl, deployUrl: data.pagesUrl };
}
