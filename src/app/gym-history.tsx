/**
 * FORGE Gym — Workout History Screen
 * Calendar view of past sessions with list below.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useGymStore } from '@/store/gym';
import { formatDuration, getWeekDays, startOfWeek, getDayShort } from '@/utils/helpers';

const GYM_ACCENT = '#8B5CF6';

export default function GymHistoryScreen() {
  const router = useRouter();
  const sessions = useGymStore((s) => s.sessions);
  const templates = useGymStore((s) => s.templates);
  const [monthOffset, setMonthOffset] = useState(0);

  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Session dates set for calendar dots
  const sessionDates = useMemo(() => {
    return new Set(sessions.map((s) => s.date));
  }, [sessions]);

  // Calendar grid
  const calendarWeeks = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start from Monday
    let startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diff);

    const weeks: Date[][] = [];
    let current = new Date(startDate);
    while (current <= lastDay || weeks.length < 6) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
      if (current > lastDay && weeks.length >= 4) break;
    }
    return weeks;
  }, [monthOffset]);

  // Sorted sessions for the list
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Feather name="arrow-left" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={() => setMonthOffset((o) => o - 1)} hitSlop={12}>
              <Feather name="chevron-left" size={20} color={Colors.textSecondary} />
            </Pressable>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable
              onPress={() => setMonthOffset((o) => o + 1)}
              hitSlop={12}
              disabled={monthOffset >= 0}
            >
              <Feather
                name="chevron-right"
                size={20}
                color={monthOffset >= 0 ? Colors.textMuted : Colors.textSecondary}
              />
            </Pressable>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <Text key={i} style={styles.dayHeaderText}>{d}</Text>
            ))}
          </View>

          {/* Weeks */}
          {calendarWeeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => {
                const dateStr = day.toISOString().split('T')[0];
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const hasSession = sessionDates.has(dateStr);
                const isToday =
                  day.getDate() === today.getDate() &&
                  day.getMonth() === today.getMonth() &&
                  day.getFullYear() === today.getFullYear();

                return (
                  <View key={di} style={styles.dayCell}>
                    <Text
                      style={[
                        styles.dayText,
                        !isCurrentMonth && styles.dayTextOutside,
                        isToday && styles.dayTextToday,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                    {hasSession && <View style={styles.dayDot} />}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Session List */}
        <Text style={styles.sectionTitle}>All Workouts</Text>
        {sortedSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No workouts logged yet</Text>
          </View>
        ) : (
          sortedSessions.map((session) => {
            const template = session.templateId
              ? templates.find((t) => t.id === session.templateId)
              : null;
            const totalSets = session.exercises.reduce(
              (sum, e) => sum + e.sets.length,
              0
            );
            const totalVolume = session.exercises.reduce(
              (sum, e) =>
                sum + e.sets.reduce((s, set) => s + set.weight * set.reps, 0),
              0
            );

            return (
              <Pressable
                key={session.id}
                style={styles.sessionCard}
                onPress={() =>
                  router.push({ pathname: '/gym-session-detail', params: { sessionId: session.id } })
                }
              >
                <View style={styles.sessionDate}>
                  <Text style={styles.sessionDay}>
                    {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={styles.sessionDateNum}>
                    {new Date(session.date).getDate()}
                  </Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>
                    {template?.name ?? 'Free Workout'}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {formatDuration(session.durationMinutes)} · {session.exercises.length} exercises · {totalSets} sets
                  </Text>
                  {totalVolume > 0 && (
                    <Text style={styles.sessionVolume}>
                      {totalVolume >= 1000
                        ? `${(totalVolume / 1000).toFixed(1)}k kg`
                        : `${totalVolume} kg`}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={16} color={Colors.textMuted} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 100 },
  calendarCard: {
    backgroundColor: Colors.bgSurface, borderRadius: 20,
    padding: Spacing.xl, marginBottom: Spacing['2xl'],
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  monthLabel: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  dayHeaders: { flexDirection: 'row', marginBottom: Spacing.sm },
  dayHeaderText: {
    flex: 1, textAlign: 'center', fontSize: Typography.xs,
    color: Colors.textMuted, fontWeight: Typography.semibold,
  },
  weekRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs },
  dayText: { fontSize: Typography.sm, color: Colors.textSecondary },
  dayTextOutside: { color: Colors.textMuted, opacity: 0.4 },
  dayTextToday: { color: GYM_ACCENT, fontWeight: Typography.bold },
  dayDot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: GYM_ACCENT, marginTop: 2,
  },
  sectionTitle: {
    fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.lg,
  },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  emptyText: { fontSize: Typography.sm, color: Colors.textMuted },
  sessionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface,
    borderRadius: 20, padding: Spacing.xl, marginBottom: Spacing.md, gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  sessionDate: { alignItems: 'center', width: 44 },
  sessionDay: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.bold, textTransform: 'uppercase' },
  sessionDateNum: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.textPrimary },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  sessionMeta: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  sessionVolume: { fontSize: Typography.xs, color: GYM_ACCENT, fontWeight: Typography.bold, marginTop: 4 },
});
