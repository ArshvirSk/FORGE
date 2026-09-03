/**
 * FORGE Notification Settings — Zustand Store
 * Persists notification preferences to AsyncStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';
import type {
  NotificationSettings,
  NotificationType,
  DailyReminderSettings,
  StreakRiskSettings,
  GymReminderSettings,
} from './notificationTypes';
import { DEFAULT_NOTIFICATION_SETTINGS } from './notificationTypes';

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface NotificationStore {
  settings: NotificationSettings;
  permissionStatus: PermissionStatus;

  /** Toggle a notification type on/off */
  toggleType: (type: NotificationType) => void;

  /** Update daily reminder settings */
  updateDailyReminder: (updates: Partial<DailyReminderSettings>) => void;

  /** Update streak risk settings */
  updateStreakRisk: (updates: Partial<StreakRiskSettings>) => void;

  /** Update gym reminder settings */
  updateGymReminder: (updates: Partial<GymReminderSettings>) => void;

  /** Cache the OS permission status */
  setPermissionStatus: (status: PermissionStatus) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_NOTIFICATION_SETTINGS,
      permissionStatus: 'undetermined',

      toggleType: (type) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [type]: {
              ...state.settings[type],
              enabled: !state.settings[type].enabled,
            },
          },
        }));
      },

      updateDailyReminder: (updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            dailyReminder: { ...state.settings.dailyReminder, ...updates },
          },
        }));
      },

      updateStreakRisk: (updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            streakRisk: { ...state.settings.streakRisk, ...updates },
          },
        }));
      },

      updateGymReminder: (updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            gymReminder: { ...state.settings.gymReminder, ...updates },
          },
        }));
      },

      setPermissionStatus: (status) => {
        set({ permissionStatus: status });
      },
    }),
    {
      name: 'forge-notifications',
      storage: createJSONStorage(() => asyncStorageAdapter),
    }
  )
);
