import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';
import { generateId, isSameDay, startOfWeek, getWeekDays } from '@/utils/helpers';
import type { FocusSession } from './types';

interface FocusState {
  sessions: FocusSession[];
  activeSession: FocusSession | null;

  startSession: (taskId: string, projectId: string, durationMinutes: number) => string;
  endSession: (sessionId: string, completed: boolean) => void;
  getSessionsForDate: (date: Date) => FocusSession[];
  getTotalMinutesForDate: (date: Date) => number;
  getSessionsForWeek: (weekStart: Date) => FocusSession[];
  getTotalMinutesByProject: (projectId: string, weekStart: Date) => number;
  getCompletedDates: () => string[];
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,

      startSession: (taskId, projectId, durationMinutes) => {
        const id = generateId();
        const session: FocusSession = {
          id,
          taskId,
          projectId,
          startTime: new Date().toISOString(),
          endTime: null,
          durationMinutes,
          completed: false,
        };
        set({ activeSession: session });
        return id;
      },

      endSession: (sessionId, completed) => {
        const active = get().activeSession;
        if (!active || active.id !== sessionId) return;

        const endTime = new Date();
        const startTime = new Date(active.startTime);
        const actualMinutes = Math.round(
          (endTime.getTime() - startTime.getTime()) / 60000
        );

        const finishedSession: FocusSession = {
          ...active,
          endTime: endTime.toISOString(),
          durationMinutes: actualMinutes,
          completed,
        };

        set((state) => ({
          sessions: [...state.sessions, finishedSession],
          activeSession: null,
        }));
      },

      getSessionsForDate: (date) => {
        return get().sessions.filter((s) => {
          const sessionDate = new Date(s.startTime);
          return isSameDay(sessionDate, date) && s.completed;
        });
      },

      getTotalMinutesForDate: (date) => {
        return get()
          .getSessionsForDate(date)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },

      getSessionsForWeek: (weekStart) => {
        const days = getWeekDays(weekStart);
        const weekEnd = new Date(days[6]);
        weekEnd.setHours(23, 59, 59, 999);

        return get().sessions.filter((s) => {
          const d = new Date(s.startTime);
          return d >= weekStart && d <= weekEnd && s.completed;
        });
      },

      getTotalMinutesByProject: (projectId, weekStart) => {
        return get()
          .getSessionsForWeek(weekStart)
          .filter((s) => s.projectId === projectId)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },

      getCompletedDates: () => {
        const dates = new Set<string>();
        get().sessions.forEach((s) => {
          if (s.completed) {
            dates.add(new Date(s.startTime).toISOString().split('T')[0]);
          }
        });
        return Array.from(dates).sort();
      },
    }),
    {
      name: 'forge-focus',
      storage: createJSONStorage(() => asyncStorageAdapter),
      partialize: (state) => ({
        sessions: state.sessions,
        // Don't persist activeSession — if app crashes mid-focus, don't restore a stale timer
      }),
    }
  )
);

/**
 * Calculate current streak: consecutive days with at least one completed session,
 * counting backwards from today.
 */
export function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  // Check if today has any completions — if not, start from yesterday
  const todayStr = today.toISOString().split('T')[0];
  if (!completedDates.includes(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (completedDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
