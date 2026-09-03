/**
 * FORGE Gym Tracker — Types
 * All data models for exercises, templates, sessions, and PRs.
 */

export type ExerciseCategory = 'push' | 'pull' | 'legs' | 'core' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipment: string;
  isCustom: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
  isAIGenerated?: boolean;
  aiPlanName?: string;
  aiDay?: number; // ISO weekday (1=Mon ... 7=Sun)
}

export interface GymPreferences {
  primaryGoal: string;
  experienceLevel: string;
  daysPerWeek: number[]; // 1=Mon ... 7=Sun
  sessionDuration: number;
  equipment: string[];
  splitPreference: string;
  limitations: string;
  avoidExercises: string[]; // exercise IDs
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutExerciseLog {
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  templateId: string | null;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // ISO datetime — when workout started
  exercises: WorkoutExerciseLog[];
  durationMinutes: number;
  notes: string;
}

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string; // ISO date string
  calculatedOneRepMax: number; // Epley formula
}

/**
 * In-progress workout state — not persisted across app restarts
 * (mirrors focus.ts pattern: don't restore stale active sessions).
 */
export interface ActiveWorkout {
  id: string;
  templateId: string | null;
  templateName: string | null;
  startTime: string; // ISO datetime
  exercises: WorkoutExerciseLog[];
  restTimerSeconds: number; // configurable rest duration, default 90
}

/**
 * Category colors for the gym UI — distinct from project colors.
 */
export const CategoryColors: Record<ExerciseCategory, string> = {
  push: '#EF4444',   // Red
  pull: '#3B82F6',   // Blue
  legs: '#10B981',   // Emerald
  core: '#F59E0B',   // Amber
  cardio: '#EC4899', // Pink
};

export const CategoryLabels: Record<ExerciseCategory, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
  cardio: 'Cardio',
};
