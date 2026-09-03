/**
 * FORGE — Notification Settings Screen
 * Toggle each notification type on/off with configurable time/day pickers.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useNotificationStore } from '@/store/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationType } from '@/store/notificationTypes';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7];

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

function cycleHour(current: number, direction: 1 | -1): number {
  return (current + direction + 24) % 24;
}

function cycleMinute(current: number, direction: 1 | -1): number {
  return (current + direction * 15 + 60) % 60;
}

interface SettingRowProps {
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

function SettingRow({ icon, iconColor, title, subtitle, enabled, onToggle, children }: SettingRowProps) {
  return (
    <View style={styles.settingCard}>
      <View style={styles.settingHeader}>
        <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
          <Feather name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: Colors.bgElevated, true: Colors.accent + '60' }}
          thumbColor={enabled ? Colors.accent : Colors.textMuted}
        />
      </View>
      {enabled && children && <View style={styles.settingBody}>{children}</View>}
    </View>
  );
}

interface TimePickerProps {
  hour: number;
  minute: number;
  onChangeHour: (h: number) => void;
  onChangeMinute: (m: number) => void;
}

function TimePicker({ hour, minute, onChangeHour, onChangeMinute }: TimePickerProps) {
  return (
    <View style={styles.timePicker}>
      <Text style={styles.timeLabel}>Time:</Text>
      <View style={styles.timeControls}>
        <Pressable onPress={() => onChangeHour(cycleHour(hour, -1))} hitSlop={8}>
          <Feather name="chevron-left" size={18} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.timeValue}>{formatTime(hour, minute)}</Text>
        <Pressable onPress={() => onChangeHour(cycleHour(hour, 1))} hitSlop={8}>
          <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.timeControls}>
        <Pressable onPress={() => onChangeMinute(cycleMinute(minute, -1))} hitSlop={8}>
          <Feather name="minus" size={14} color={Colors.textMuted} />
        </Pressable>
        <Text style={styles.minuteLabel}>±15m</Text>
        <Pressable onPress={() => onChangeMinute(cycleMinute(minute, 1))} hitSlop={8}>
          <Feather name="plus" size={14} color={Colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const settings = useNotificationStore((s) => s.settings);
  const toggleType = useNotificationStore((s) => s.toggleType);
  const updateDailyReminder = useNotificationStore((s) => s.updateDailyReminder);
  const updateStreakRisk = useNotificationStore((s) => s.updateStreakRisk);
  const updateGymReminder = useNotificationStore((s) => s.updateGymReminder);
  const { permissionStatus, requestPermissions, rescheduleAll } = useNotifications();

  const handleToggle = useCallback(
    async (type: NotificationType) => {
      if (permissionStatus !== 'granted') {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            'Notifications Disabled',
            'Enable notifications in your device settings to use this feature.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      toggleType(type);
      // Reschedule after state updates (next tick)
      setTimeout(() => rescheduleAll(), 100);
    },
    [permissionStatus, requestPermissions, toggleType, rescheduleAll]
  );

  const handleDayToggle = (day: number) => {
    const days = settings.gymReminder.days.includes(day)
      ? settings.gymReminder.days.filter((d) => d !== day)
      : [...settings.gymReminder.days, day].sort();
    updateGymReminder({ days });
    setTimeout(() => rescheduleAll(), 100);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Feather name="x" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {permissionStatus === 'denied' && (
        <View style={styles.permissionBanner}>
          <Feather name="alert-triangle" size={16} color={Colors.warning} />
          <Text style={styles.permissionText}>
            Notifications are disabled. Enable them in device settings.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingRow
          icon="sun"
          iconColor={Colors.accent}
          title="Daily Morning Reminder"
          subtitle="Open Today View to start your day"
          enabled={settings.dailyReminder.enabled}
          onToggle={() => handleToggle('dailyReminder')}
        >
          <TimePicker
            hour={settings.dailyReminder.hour}
            minute={settings.dailyReminder.minute}
            onChangeHour={(h) => { updateDailyReminder({ hour: h }); setTimeout(() => rescheduleAll(), 100); }}
            onChangeMinute={(m) => { updateDailyReminder({ minute: m }); setTimeout(() => rescheduleAll(), 100); }}
          />
        </SettingRow>

        <SettingRow
          icon="alert-triangle"
          iconColor={Colors.error}
          title="Streak Risk Warning"
          subtitle="Fires if no task completed by evening"
          enabled={settings.streakRisk.enabled}
          onToggle={() => handleToggle('streakRisk')}
        >
          <TimePicker
            hour={settings.streakRisk.hour}
            minute={settings.streakRisk.minute}
            onChangeHour={(h) => { updateStreakRisk({ hour: h }); setTimeout(() => rescheduleAll(), 100); }}
            onChangeMinute={(m) => { updateStreakRisk({ minute: m }); setTimeout(() => rescheduleAll(), 100); }}
          />
        </SettingRow>

        <SettingRow
          icon="check-circle"
          iconColor={Colors.success}
          title="Focus Session Complete"
          subtitle="Notifies when a focus timer finishes"
          enabled={settings.focusComplete.enabled}
          onToggle={() => handleToggle('focusComplete')}
        />

        <SettingRow
          icon="bell"
          iconColor={Colors.info}
          title="Inactivity Nudge"
          subtitle="Reminds you after 24h of inactivity"
          enabled={settings.inactivityNudge.enabled}
          onToggle={() => handleToggle('inactivityNudge')}
        />

        <SettingRow
          icon="award"
          iconColor="#8B5CF6"
          title="Gym Reminder"
          subtitle="Scheduled training day reminders"
          enabled={settings.gymReminder.enabled}
          onToggle={() => handleToggle('gymReminder')}
        >
          <View style={styles.dayPicker}>
            <Text style={styles.timeLabel}>Days:</Text>
            <View style={styles.dayPills}>
              {ISO_DAYS.map((day, idx) => {
                const active = settings.gymReminder.days.includes(day);
                return (
                  <Pressable
                    key={day}
                    style={[
                      styles.dayPill,
                      active && styles.dayPillActive,
                    ]}
                    onPress={() => handleDayToggle(day)}
                  >
                    <Text
                      style={[
                        styles.dayPillText,
                        active && styles.dayPillTextActive,
                      ]}
                    >
                      {DAY_LABELS[idx]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <TimePicker
            hour={settings.gymReminder.hour}
            minute={settings.gymReminder.minute}
            onChangeHour={(h) => { updateGymReminder({ hour: h }); setTimeout(() => rescheduleAll(), 100); }}
            onChangeMinute={(m) => { updateGymReminder({ minute: m }); setTimeout(() => rescheduleAll(), 100); }}
          />
        </SettingRow>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  permissionText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.warning,
    fontWeight: Typography.medium,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: 100,
  },
  settingCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  settingBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    width: 42,
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  timeValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    minWidth: 72,
    textAlign: 'center',
  },
  minuteLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  dayPicker: {
    gap: Spacing.sm,
  },
  dayPills: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dayPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  dayPillText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.semibold,
  },
  dayPillTextActive: {
    color: '#8B5CF6',
  },
});
