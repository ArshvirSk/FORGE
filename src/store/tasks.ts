import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';
import { generateId, isSameDay } from '@/utils/helpers';
import type { Task, TaskStatus } from './types';

interface TasksState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'status'>) => string;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  getTodayTasks: () => Task[];
  getTasksByProject: (projectId: string) => Task[];
  getTaskById: (id: string) => Task | undefined;
  getIncompleteTasks: () => Task[];
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (taskData) => {
        const id = generateId();
        const task: Task = {
          ...taskData,
          id,
          status: 'todo',
          createdAt: new Date().toISOString(),
          completedAt: null,
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        return id;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      completeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'done' as TaskStatus, completedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      getTodayTasks: () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        return get().tasks.filter(
          (t) => t.dueDate === todayStr && t.status !== 'done'
        );
      },

      getTasksByProject: (projectId) => {
        return get().tasks.filter((t) => t.projectId === projectId);
      },

      getTaskById: (id) => {
        return get().tasks.find((t) => t.id === id);
      },

      getIncompleteTasks: () => {
        return get().tasks.filter((t) => t.status !== 'done');
      },
    }),
    {
      name: 'forge-tasks',
      storage: createJSONStorage(() => asyncStorageAdapter),
    }
  )
);
