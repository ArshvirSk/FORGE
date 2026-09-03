import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';
import { DefaultProjects } from '@/constants/theme';
import { generateId } from '@/utils/helpers';
import type { Project } from './types';

interface ProjectsState {
  projects: Project[];
  initialized: boolean;
  addProject: (name: string, color: string, icon: string, weeklyTargetHours?: number) => void;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
  initDefaults: () => void;
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      initialized: false,

      initDefaults: () => {
        if (get().initialized) return;
        const defaults: Project[] = DefaultProjects.map((p) => ({
          id: generateId(),
          name: p.name,
          color: p.color,
          icon: p.icon,
          weeklyTargetHours: 10,
          createdAt: new Date().toISOString(),
        }));
        set({ projects: defaults, initialized: true });
      },

      addProject: (name, color, icon, weeklyTargetHours = 10) => {
        const project: Project = {
          id: generateId(),
          name,
          color,
          icon,
          weeklyTargetHours,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ projects: [...state.projects, project] }));
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      },

      getProjectById: (id) => {
        return get().projects.find((p) => p.id === id);
      },
    }),
    {
      name: 'forge-projects',
      storage: createJSONStorage(() => asyncStorageAdapter),
    }
  )
);
