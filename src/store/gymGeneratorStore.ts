import { create } from 'zustand';
import type { GeneratedPlan } from '@/hooks/useWorkoutGenerator';

interface GymGeneratorState {
  pendingPlan: GeneratedPlan | null;
  setPendingPlan: (plan: GeneratedPlan | null) => void;
}

export const useGymGeneratorStore = create<GymGeneratorState>((set) => ({
  pendingPlan: null,
  setPendingPlan: (plan) => set({ pendingPlan: plan }),
}));
