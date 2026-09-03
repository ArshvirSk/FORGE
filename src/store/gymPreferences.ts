import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GymPreferences } from './gymTypes';

export const DEFAULT_PREFERENCES: GymPreferences = {
  primaryGoal: 'hypertrophy',
  experienceLevel: 'intermediate',
  daysPerWeek: [1, 3, 5], // Mon, Wed, Fri
  sessionDuration: 60,
  equipment: ['dumbbells', 'barbell', 'bench'],
  splitPreference: 'Push/Pull/Legs',
  limitations: '',
  avoidExercises: [],
};

interface GymPreferencesState {
  preferences: GymPreferences | null;
  setPreferences: (prefs: GymPreferences) => void;
  clearPreferences: () => void;
}

export const useGymPreferencesStore = create<GymPreferencesState>()(
  persist(
    (set) => ({
      preferences: null,
      setPreferences: (prefs) => set({ preferences: prefs }),
      clearPreferences: () => set({ preferences: null }),
    }),
    {
      name: 'forge-gym-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
