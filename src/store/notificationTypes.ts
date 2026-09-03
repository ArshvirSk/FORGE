/**
 * FORGE Notification System — Types & Defaults
 * Local-only scheduled notifications via expo-notifications.
 */

export type NotificationType =
  | 'dailyReminder'
  | 'streakRisk'
  | 'focusComplete'
  | 'inactivityNudge'
  | 'gymReminder';

export interface TimeConfig {
  hour: number;
  minute: number;
}

export interface DailyReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface StreakRiskSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface FocusCompleteSettings {
  enabled: boolean;
}

export interface InactivityNudgeSettings {
  enabled: boolean;
}

export interface GymReminderSettings {
  enabled: boolean;
  days: number[]; // 1=Mon, 2=Tue, ..., 7=Sun (ISO weekday)
  hour: number;
  minute: number;
}

export interface NotificationSettings {
  dailyReminder: DailyReminderSettings;
  streakRisk: StreakRiskSettings;
  focusComplete: FocusCompleteSettings;
  inactivityNudge: InactivityNudgeSettings;
  gymReminder: GymReminderSettings;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  dailyReminder: { enabled: true, hour: 8, minute: 0 },
  streakRisk: { enabled: true, hour: 20, minute: 0 },
  focusComplete: { enabled: true },
  inactivityNudge: { enabled: true },
  gymReminder: { enabled: true, days: [1, 3, 5], hour: 6, minute: 0 }, // Mon/Wed/Fri 6 AM
};

/** Identifier prefix per type — used for scheduling/cancelling */
export const NOTIFICATION_ID_PREFIX: Record<NotificationType, string> = {
  dailyReminder: 'forge-daily',
  streakRisk: 'forge-streak',
  focusComplete: 'forge-focus',
  inactivityNudge: 'forge-inactivity',
  gymReminder: 'forge-gym',
};

/** Human-readable notification content per type */
export const NOTIFICATION_CONTENT: Record<NotificationType, { title: string; body: string }> = {
  dailyReminder: {
    title: '🔥 Time to forge',
    body: 'Open Today View and crush your tasks.',
  },
  streakRisk: {
    title: '⚠️ Streak at risk!',
    body: "You haven't completed any tasks today. Don't break the chain!",
  },
  focusComplete: {
    title: '✅ Focus session complete',
    body: 'Great work! Your focus session has finished.',
  },
  inactivityNudge: {
    title: '👋 Miss you at the forge',
    body: "It's been a while. Open up and get back on track.",
  },
  gymReminder: {
    title: '💪 Gym time!',
    body: "Today's a training day. Let's get those gains.",
  },
};

/** Deep-link routes per notification type */
export const NOTIFICATION_DEEP_LINKS: Record<NotificationType, string> = {
  dailyReminder: '/(tabs)',
  streakRisk: '/(tabs)',
  focusComplete: '/(tabs)',
  inactivityNudge: '/(tabs)',
  gymReminder: '/(tabs)/gym',
};
