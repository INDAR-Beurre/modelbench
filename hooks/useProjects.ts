// hooks/useProjects.ts
// =========================================================================
// Projects store + thin wrappers around the /api/judge and /api/deploy
// routes. API keys live exclusively on the server, so we never accept or
// forward per-request credentials from the client.
//
// All mutations use the functional form of setState so they always see the
// latest list, even when called immediately after another mutation.
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

  const addProject = useCallback(
    (data: Omit<Project, 'id' | 'createdAt' | 'status'>): Project => {
      const project: Project = {
        ...data,
        id: uid('proj'),
        createdAt: Date.now(),
        status: 'pending',
      };
      // Functional update — never read stale `projects` from a closure.
      setProjects((prev) => {
        const next = [project, ...prev];
        projectsStore.save(next);
        return next;
      });
      return project;
    },
    [],
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<Project>) => {
      setProjects((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
        projectsStore.save(next);
        return next;
      });
    },
    [],
  );

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      projectsStore.save(next);
      return next;
    });
  }, []);

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
