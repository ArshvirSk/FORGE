/**
 * FORGE Gym Tracker — Zustand Store
 * Manages exercises, templates, workout sessions, PRs, streaks, and rest days.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';
import { generateId, isSameDay, startOfWeek, getWeekDays } from '@/utils/helpers';
import { detectNewPRs } from '@/utils/prDetection';
import { DEFAULT_EXERCISES } from '@/constants/exerciseLibrary';
import type {
  Exercise,
  ExerciseCategory,
  WorkoutTemplate,
  WorkoutSession,
  WorkoutExerciseLog,
  WorkoutSet,
  PersonalRecord,
  ActiveWorkout,
} from './gymTypes';

interface GymState {
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
  restDays: number[]; // ISO weekday: 1=Mon … 7=Sun
  activeWorkout: ActiveWorkout | null;
  initialized: boolean;
  defaultRestSeconds: number;

  // Init
  initDefaults: () => void;

  // Exercises
  addCustomExercise: (name: string, category: ExerciseCategory, equipment: string) => string;
  deleteExercise: (id: string) => void;
  getExerciseById: (id: string) => Exercise | undefined;

  // Templates
  addTemplate: (name: string, exerciseIds: string[]) => string;
  updateTemplate: (id: string, updates: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => WorkoutTemplate | undefined;

  // Active Workout
  startWorkout: (templateId?: string) => string;
  addExerciseToWorkout: (exerciseId: string) => void;
  removeExerciseFromWorkout: (exerciseId: string) => void;
  addSetToExercise: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setIndex: number, updates: Partial<WorkoutSet>) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  toggleSetCompleted: (exerciseId: string, setIndex: number) => void;
  setRestTimerSeconds: (seconds: number) => void;
  cancelWorkout: () => void;
  finishWorkout: (notes: string) => { session: WorkoutSession; newPRs: PersonalRecord[] };

  // History / Queries
  getSessionsForDate: (date: Date) => WorkoutSession[];
  getSessionsForWeek: (weekStart: Date) => WorkoutSession[];
  getExerciseHistory: (exerciseId: string) => { date: string; sets: WorkoutSet[] }[];
  getWeeklyVolume: (weekStart: Date) => Record<ExerciseCategory, { sets: number; reps: number; weight: number }>;
  getLastSessionForTemplate: (templateId: string) => WorkoutSession | undefined;

  // Streaks
  calculateGymStreak: () => number;

  // Rest days
  toggleRestDay: (day: number) => void;
}

export const useGymStore = create<GymState>()(
  persist(
    (set, get) => ({
      exercises: [],
      templates: [],
      sessions: [],
      personalRecords: [],
      restDays: [],
      activeWorkout: null,
      initialized: false,
      defaultRestSeconds: 90,

      // ── Init ────────────────────────────────────────────────
      initDefaults: () => {
        if (get().initialized) return;
        const exercises: Exercise[] = DEFAULT_EXERCISES.map((e) => ({
          ...e,
          isCustom: false,
        }));
        set({ exercises, initialized: true });
      },

      // ── Exercises ───────────────────────────────────────────
      addCustomExercise: (name, category, equipment) => {
        const id = `custom-${generateId()}`;
        const exercise: Exercise = { id, name, category, equipment, isCustom: true };
        set((state) => ({ exercises: [...state.exercises, exercise] }));
        return id;
      },

      deleteExercise: (id) => {
        set((state) => ({
          exercises: state.exercises.filter((e) => e.id !== id),
        }));
      },

      getExerciseById: (id) => {
        return get().exercises.find((e) => e.id === id);
      },

      // ── Templates ──────────────────────────────────────────
      addTemplate: (name, exerciseIds) => {
        const id = generateId();
        const template: WorkoutTemplate = {
          id,
          name,
          exerciseIds,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ templates: [...state.templates, template] }));
        return id;
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      getTemplateById: (id) => {
        return get().templates.find((t) => t.id === id);
      },

      // ── Active Workout ─────────────────────────────────────
      startWorkout: (templateId) => {
        const id = generateId();
        const template = templateId ? get().getTemplateById(templateId) : undefined;
        const exercises: WorkoutExerciseLog[] = template
          ? template.exerciseIds.map((eid) => ({ exerciseId: eid, sets: [{ reps: 0, weight: 0, completed: false }] }))
          : [];

        const activeWorkout: ActiveWorkout = {
          id,
          templateId: templateId ?? null,
          templateName: template?.name ?? null,
          startTime: new Date().toISOString(),
          exercises,
          restTimerSeconds: get().defaultRestSeconds,
        };
        set({ activeWorkout });
        return id;
      },

      addExerciseToWorkout: (exerciseId) => {
        const active = get().activeWorkout;
        if (!active) return;
        // Don't add if already present
        if (active.exercises.some((e) => e.exerciseId === exerciseId)) return;
        set({
          activeWorkout: {
            ...active,
            exercises: [
              ...active.exercises,
              { exerciseId, sets: [{ reps: 0, weight: 0, completed: false }] },
            ],
          },
        });
      },

      removeExerciseFromWorkout: (exerciseId) => {
        const active = get().activeWorkout;
        if (!active) return;
        set({
          activeWorkout: {
            ...active,
            exercises: active.exercises.filter((e) => e.exerciseId !== exerciseId),
          },
        });
      },

      addSetToExercise: (exerciseId) => {
        const active = get().activeWorkout;
        if (!active) return;

        // Pre-fill with previous set's values if available
        const exerciseLog = active.exercises.find((e) => e.exerciseId === exerciseId);
        const lastSet = exerciseLog?.sets[exerciseLog.sets.length - 1];
        const newSet: WorkoutSet = {
          reps: lastSet?.reps ?? 0,
          weight: lastSet?.weight ?? 0,
          completed: false,
        };

        set({
          activeWorkout: {
            ...active,
            exercises: active.exercises.map((e) =>
              e.exerciseId === exerciseId
                ? { ...e, sets: [...e.sets, newSet] }
                : e
            ),
          },
        });
      },

      updateSet: (exerciseId, setIndex, updates) => {
        const active = get().activeWorkout;
        if (!active) return;
        set({
          activeWorkout: {
            ...active,
            exercises: active.exercises.map((e) =>
              e.exerciseId === exerciseId
                ? {
                    ...e,
                    sets: e.sets.map((s, i) =>
                      i === setIndex ? { ...s, ...updates } : s
                    ),
                  }
                : e
            ),
          },
        });
      },

      removeSet: (exerciseId, setIndex) => {
        const active = get().activeWorkout;
        if (!active) return;
        set({
          activeWorkout: {
            ...active,
            exercises: active.exercises.map((e) =>
              e.exerciseId === exerciseId
                ? { ...e, sets: e.sets.filter((_, i) => i !== setIndex) }
                : e
            ),
          },
        });
      },

      toggleSetCompleted: (exerciseId, setIndex) => {
        const active = get().activeWorkout;
        if (!active) return;
        set({
          activeWorkout: {
            ...active,
            exercises: active.exercises.map((e) =>
              e.exerciseId === exerciseId
                ? {
                    ...e,
                    sets: e.sets.map((s, i) =>
                      i === setIndex ? { ...s, completed: !s.completed } : s
                    ),
                  }
                : e
            ),
          },
        });
      },

      setRestTimerSeconds: (seconds) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            defaultRestSeconds: seconds,
            activeWorkout: { ...state.activeWorkout, restTimerSeconds: seconds },
          };
        });
      },

      cancelWorkout: () => {
        set({ activeWorkout: null });
      },

      finishWorkout: (notes) => {
        const active = get().activeWorkout;
        if (!active) {
          throw new Error('No active workout to finish');
        }

        const endTime = new Date();
        const startTime = new Date(active.startTime);
        const durationMinutes = Math.round(
          (endTime.getTime() - startTime.getTime()) / 60000
        );

        // Filter out exercises with no completed sets
        const completedExercises = active.exercises
          .map((e) => ({
            ...e,
            sets: e.sets.filter((s) => s.completed),
          }))
          .filter((e) => e.sets.length > 0);

        const session: WorkoutSession = {
          id: active.id,
          templateId: active.templateId,
          date: startTime.toISOString().split('T')[0],
          startTime: active.startTime,
          exercises: completedExercises,
          durationMinutes,
          notes,
        };

        // Detect PRs
        const newPRs = detectNewPRs(session, get().personalRecords);

        // Merge new PRs (replace existing if same exerciseId)
        const updatedPRs = [...get().personalRecords];
        for (const pr of newPRs) {
          const existingIdx = updatedPRs.findIndex(
            (p) => p.exerciseId === pr.exerciseId
          );
          if (existingIdx !== -1) {
            updatedPRs[existingIdx] = pr;
          } else {
            updatedPRs.push(pr);
          }
        }

        set((state) => ({
          sessions: [...state.sessions, session],
          personalRecords: updatedPRs,
          activeWorkout: null,
        }));

        return { session, newPRs };
      },

      // ── History / Queries ──────────────────────────────────
      getSessionsForDate: (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return get().sessions.filter((s) => s.date === dateStr);
      },

      getSessionsForWeek: (weekStart) => {
        const days = getWeekDays(weekStart);
        const startStr = days[0].toISOString().split('T')[0];
        const endStr = days[6].toISOString().split('T')[0];
        return get().sessions.filter(
          (s) => s.date >= startStr && s.date <= endStr
        );
      },

      getExerciseHistory: (exerciseId) => {
        return get()
          .sessions.filter((s) =>
            s.exercises.some((e) => e.exerciseId === exerciseId)
          )
          .map((s) => ({
            date: s.date,
            sets: s.exercises.find((e) => e.exerciseId === exerciseId)!.sets,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      getWeeklyVolume: (weekStart) => {
        const weekSessions = get().getSessionsForWeek(weekStart);
        const exercises = get().exercises;
        const volume: Record<ExerciseCategory, { sets: number; reps: number; weight: number }> = {
          push: { sets: 0, reps: 0, weight: 0 },
          pull: { sets: 0, reps: 0, weight: 0 },
          legs: { sets: 0, reps: 0, weight: 0 },
          core: { sets: 0, reps: 0, weight: 0 },
          cardio: { sets: 0, reps: 0, weight: 0 },
        };

        for (const session of weekSessions) {
          for (const exerciseLog of session.exercises) {
            const exercise = exercises.find((e) => e.id === exerciseLog.exerciseId);
            if (!exercise) continue;
            const cat = exercise.category;

            for (const s of exerciseLog.sets) {
              if (s.completed) {
                volume[cat].sets += 1;
                volume[cat].reps += s.reps;
                volume[cat].weight += s.weight * s.reps;
              }
            }
          }
        }

        return volume;
      },

      getLastSessionForTemplate: (templateId) => {
        const matching = get()
          .sessions.filter((s) => s.templateId === templateId)
          .sort((a, b) => b.date.localeCompare(a.date));
        return matching[0];
      },

      // ── Streaks ────────────────────────────────────────────
      calculateGymStreak: () => {
        const sessions = get().sessions;
        const restDays = get().restDays;
        if (sessions.length === 0) return 0;

        const sessionDates = new Set(sessions.map((s) => s.date));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        let streak = 0;
        let checkDate = new Date(today);

        // If today has no session and isn't a rest day, start from yesterday
        const todayWeekday = today.getDay(); // 0=Sun
        const todayIso = todayWeekday === 0 ? 7 : todayWeekday; // Convert to ISO 1=Mon
        if (!sessionDates.has(todayStr) && !restDays.includes(todayIso)) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          const dayOfWeek = checkDate.getDay();
          const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

          if (sessionDates.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (restDays.includes(isoDayOfWeek)) {
            // Rest day — don't break streak, don't count it
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        return streak;
      },

      // ── Rest Days ──────────────────────────────────────────
      toggleRestDay: (day) => {
        set((state) => ({
          restDays: state.restDays.includes(day)
            ? state.restDays.filter((d) => d !== day)
            : [...state.restDays, day],
        }));
      },
    }),
    {
      name: 'forge-gym',
      storage: createJSONStorage(() => asyncStorageAdapter),
      partialize: (state) => ({
        exercises: state.exercises,
        templates: state.templates,
        sessions: state.sessions,
        personalRecords: state.personalRecords,
        restDays: state.restDays,
        initialized: state.initialized,
        defaultRestSeconds: state.defaultRestSeconds,
        // Don't persist activeWorkout — same pattern as focus store
      }),
    }
  )
);
