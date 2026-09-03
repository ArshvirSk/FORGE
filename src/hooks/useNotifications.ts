/**
 * FORGE Notification System — Core Hook
 * Exposes scheduleNotification, cancelNotification, cancelAllOfType,
 * and current permission status. Uses expo-notifications for local-only scheduling.
 */

import { useCallback, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useNotificationStore } from '@/store/notifications';
import {
  NOTIFICATION_ID_PREFIX,
  NOTIFICATION_CONTENT,
  NOTIFICATION_DEEP_LINKS,
} from '@/store/notificationTypes';
import type { NotificationType, NotificationSettings } from '@/store/notificationTypes';

// Configure notification handler (foreground display)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** ISO weekday (1=Mon … 7=Sun) → expo Weekday (1=Sun … 7=Sat) */
function isoWeekdayToExpo(isoDay: number): number {
  // ISO: 1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat,7=Sun
  // Expo: 1=Sun,2=Mon,3=Tue,4=Wed,5=Thu,6=Fri,7=Sat
  return isoDay === 7 ? 1 : isoDay + 1;
}

export function useNotifications() {
  const settings = useNotificationStore((s) => s.settings);
  const permissionStatus = useNotificationStore((s) => s.permissionStatus);
  const setPermissionStatus = useNotificationStore((s) => s.setPermissionStatus);

  /** Request notification permissions with graceful fallback */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Android 13+ requires explicit channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('forge-default', {
          name: 'FORGE Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#F59E0B',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      setPermissionStatus(granted ? 'granted' : 'denied');
      return granted;
    } catch {
      setPermissionStatus('denied');
      return false;
    }
  }, [setPermissionStatus]);

  /** Schedule a single notification by type and identifier */
  const scheduleNotification = useCallback(
    async (
      type: NotificationType,
      options?: { identifier?: string; delaySeconds?: number }
    ) => {
      if (permissionStatus !== 'granted') return;

      const content = NOTIFICATION_CONTENT[type];
      const deepLink = NOTIFICATION_DEEP_LINKS[type];
      const identifier = options?.identifier ?? NOTIFICATION_ID_PREFIX[type];

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: content.title,
          body: content.body,
          data: { type, deepLink },
          sound: true,
        },
        trigger: options?.delaySeconds
          ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: options.delaySeconds, repeats: false }
          : null, // Fire immediately if no delay
      });
    },
    [permissionStatus]
  );

  /** Cancel a specific notification by identifier */
  const cancelNotification = useCallback(async (identifier: string) => {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }, []);

  /** Cancel all notifications matching a type prefix */
  const cancelAllOfType = useCallback(async (type: NotificationType) => {
    const prefix = NOTIFICATION_ID_PREFIX[type];
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const matching = scheduled.filter((n) => n.identifier.startsWith(prefix));
    await Promise.all(
      matching.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  }, []);

  /** Cancel all FORGE notifications and reschedule based on current settings */
  const rescheduleAll = useCallback(
    async (currentSettings?: NotificationSettings) => {
      const s = currentSettings ?? settings;
      if (permissionStatus !== 'granted') return;

      // Cancel all existing FORGE notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const forgeNotifications = scheduled.filter((n) =>
        n.identifier.startsWith('forge-')
      );
      await Promise.all(
        forgeNotifications.map((n) =>
          Notifications.cancelScheduledNotificationAsync(n.identifier)
        )
      );

      // Daily reminder
      if (s.dailyReminder.enabled) {
        await Notifications.scheduleNotificationAsync({
          identifier: NOTIFICATION_ID_PREFIX.dailyReminder,
          content: {
            title: NOTIFICATION_CONTENT.dailyReminder.title,
            body: NOTIFICATION_CONTENT.dailyReminder.body,
            data: { type: 'dailyReminder', deepLink: NOTIFICATION_DEEP_LINKS.dailyReminder },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: s.dailyReminder.hour,
            minute: s.dailyReminder.minute,
          },
        });
      }

      // Streak risk warning
      if (s.streakRisk.enabled) {
        await Notifications.scheduleNotificationAsync({
          identifier: NOTIFICATION_ID_PREFIX.streakRisk,
          content: {
            title: NOTIFICATION_CONTENT.streakRisk.title,
            body: NOTIFICATION_CONTENT.streakRisk.body,
            data: { type: 'streakRisk', deepLink: NOTIFICATION_DEEP_LINKS.streakRisk },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: s.streakRisk.hour,
            minute: s.streakRisk.minute,
          },
        });
      }

      // Gym reminders — one per selected day
      if (s.gymReminder.enabled && s.gymReminder.days.length > 0) {
        for (const isoDay of s.gymReminder.days) {
          const expoWeekday = isoWeekdayToExpo(isoDay);
          await Notifications.scheduleNotificationAsync({
            identifier: `${NOTIFICATION_ID_PREFIX.gymReminder}-${isoDay}`,
            content: {
              title: NOTIFICATION_CONTENT.gymReminder.title,
              body: NOTIFICATION_CONTENT.gymReminder.body,
              data: { type: 'gymReminder', deepLink: NOTIFICATION_DEEP_LINKS.gymReminder },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: expoWeekday,
              hour: s.gymReminder.hour,
              minute: s.gymReminder.minute,
            },
          });
        }
      }

      // Inactivity nudge — schedule 24h from now (reschedules on every app open)
      if (s.inactivityNudge.enabled) {
        await Notifications.scheduleNotificationAsync({
          identifier: NOTIFICATION_ID_PREFIX.inactivityNudge,
          content: {
            title: NOTIFICATION_CONTENT.inactivityNudge.title,
            body: NOTIFICATION_CONTENT.inactivityNudge.body,
            data: { type: 'inactivityNudge', deepLink: NOTIFICATION_DEEP_LINKS.inactivityNudge },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 24 * 60 * 60,
            repeats: false,
          },
        });
      }
    },
    [settings, permissionStatus]
  );

  return {
    permissionStatus,
    requestPermissions,
    scheduleNotification,
    cancelNotification,
    cancelAllOfType,
    rescheduleAll,
  };
}
