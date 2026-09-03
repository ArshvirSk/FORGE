/**
 * FORGE Gym Tracker — PR Detection Utilities
 * Epley formula for estimated 1RM and automatic PR detection.
 */

import type { WorkoutSet, WorkoutSession, PersonalRecord } from '@/store/gymTypes';

/**
 * Epley formula: estimated 1-rep max = weight × (1 + reps / 30)
 * Returns 0 for invalid inputs (0 weight, 0 reps).
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight; // 1RM is just the weight itself
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Detect new personal records from a completed session.
 * Checks both raw weight and calculated estimated 1RM against existing PRs.
 *
 * @returns Array of new PersonalRecord objects (empty if none)
 */
export function detectNewPRs(
  session: WorkoutSession,
  existingPRs: PersonalRecord[]
): PersonalRecord[] {
  const newPRs: PersonalRecord[] = [];

  for (const exerciseLog of session.exercises) {
    const currentPR = existingPRs.find(
      (pr) => pr.exerciseId === exerciseLog.exerciseId
    );

    for (const set of exerciseLog.sets) {
      if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;

      const estimated1RM = calculateEstimated1RM(set.weight, set.reps);

      const isNewPR =
        !currentPR || estimated1RM > currentPR.calculatedOneRepMax;

      if (isNewPR) {
        // Check if we already have a better PR from this same session
        const alreadyFoundBetter = newPRs.find(
          (pr) =>
            pr.exerciseId === exerciseLog.exerciseId &&
            pr.calculatedOneRepMax >= estimated1RM
        );

        if (!alreadyFoundBetter) {
          // Remove any weaker PR for this exercise from this session
          const existingIdx = newPRs.findIndex(
            (pr) => pr.exerciseId === exerciseLog.exerciseId
          );
          if (existingIdx !== -1) {
            newPRs.splice(existingIdx, 1);
          }

          newPRs.push({
            exerciseId: exerciseLog.exerciseId,
            weight: set.weight,
            reps: set.reps,
            date: session.date,
            calculatedOneRepMax: estimated1RM,
          });
        }
      }
    }
  }

  return newPRs;
}

/**
 * Check if a specific set is a personal record for its exercise.
 */
export function isSetPR(
  exerciseId: string,
  set: WorkoutSet,
  personalRecords: PersonalRecord[]
): boolean {
  if (!set.completed || set.weight <= 0 || set.reps <= 0) return false;

  const pr = personalRecords.find((p) => p.exerciseId === exerciseId);
  if (!pr) return false;

  const estimated1RM = calculateEstimated1RM(set.weight, set.reps);
  return (
    set.weight === pr.weight &&
    set.reps === pr.reps &&
    estimated1RM >= pr.calculatedOneRepMax
  );
}
