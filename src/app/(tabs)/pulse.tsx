import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, ProjectColors, Spacing, Typography, Radius } from '@/constants/theme';
import { useProjectsStore } from '@/store/projects';
import { useTasksStore } from '@/store/tasks';
import { useFocusStore, calculateStreak } from '@/store/focus';
import { useGymStore } from '@/store/gym';
import { startOfWeek, getWeekDays, getDayShort, formatDuration } from '@/utils/helpers';
import { DaySelector } from '@/components/DaySelector';
import { BarChart } from '@/components/BarChart';
import { InsightCard } from '@/components/InsightCard';
import { StreakBadge } from '@/components/StreakBadge';

export default function PulseScreen() {
  const [weekOffset, setWeekOffset] = useState(0);
  const projects = useProjectsStore((s) => s.projects);
  const tasks = useTasksStore((s) => s.tasks);
  const sessions = useFocusStore((s) => s.sessions);
  const gymSessions = useGymStore((s) => s.sessions);
  const completedDates = useMemo(() => {
    const dates = new Set<string>();
    sessions.forEach((s) => {
      if (s.completed) {
        dates.add(new Date(s.startTime).toISOString().split('T')[0]);
      }
    });
    return Array.from(dates).sort();
  }, [sessions]);

  const today = new Date();
  const currentWeekStart = useMemo(() => {
    const ws = startOfWeek(today);
    ws.setDate(ws.getDate() + weekOffset * 7);
    return ws;
  }, [weekOffset]);

  const weekDays = getWeekDays(currentWeekStart);
  const weekEnd = new Date(weekDays[6]);
  weekEnd.setHours(23, 59, 59, 999);

  const isCurrentWeek = weekOffset === 0;

  const weekLabel = useMemo(() => {
    const start = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} — ${end}`;
  }, [currentWeekStart]);

  // Aggregate data
  const weekSessions = useMemo(() => {
    return sessions.filter((s) => {
      const d = new Date(s.startTime);
      return d >= currentWeekStart && d <= weekEnd && s.completed;
    });
  }, [sessions, currentWeekStart]);

  const weekGymSessions = useMemo(() => {
    return gymSessions.filter((s) => {
      const d = new Date(s.startTime);
      return d >= currentWeekStart && d <= weekEnd;
    });
  }, [gymSessions, currentWeekStart]);

  const totalFocusMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalGymMinutes = weekGymSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalMinutes = totalFocusMinutes + totalGymMinutes;
  const totalHours = totalMinutes / 60;

  const projectHours = useMemo(() => {
    const map: Record<string, number> = {};
    weekSessions.forEach((s) => {
      map[s.projectId] = (map[s.projectId] || 0) + s.durationMinutes;
    });
    // Add Gym minutes to the Gym project if it exists
    const gymProject = projects.find(p => p.name === 'Gym');
    if (gymProject) {
      map[gymProject.id] = (map[gymProject.id] || 0) + totalGymMinutes;
    }
    return map;
  }, [weekSessions, totalGymMinutes, projects]);

  const barData = useMemo(() => {
    const maxMinutes = Math.max(...Object.values(projectHours), 1);
    return projects.map((p) => ({
      label: p.name.length > 10 ? p.name.substring(0, 10) + '…' : p.name,
      value: (projectHours[p.id] || 0) / 60,
      color: p.color,
      maxValue: maxMinutes / 60,
    }));
  }, [projects, projectHours]);

  const weekCompleted = useMemo(() => {
    const dateStr = currentWeekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];
    return tasks.filter(
      (t) => t.status === 'done' && t.completedAt && t.completedAt >= dateStr && t.completedAt <= endStr + 'T23:59:59'
    ).length;
  }, [tasks, currentWeekStart]);

  const weekPlanned = useMemo(() => {
    const startStr = weekDays[0].toISOString().split('T')[0];
    const endStr = weekDays[6].toISOString().split('T')[0];
    return tasks.filter(
      (t) => t.dueDate >= startStr && t.dueDate <= endStr
    ).length;
  }, [tasks, currentWeekStart]);

  const streak = calculateStreak(completedDates);

  // Generate insights
  const insights = useMemo(() => {
    const result: { message: string; type: 'info' | 'warning' | 'success' }[] = [];

    // Find projects with 0 hours
    projects.forEach((p) => {
      if (!projectHours[p.id] || projectHours[p.id] === 0) {
        result.push({
          message: `${p.name} got 0 hours this week`,
          type: 'warning',
        });
      }
    });

    // Best project
    const bestProject = projects.reduce(
      (best, p) => {
        const mins = projectHours[p.id] || 0;
        return mins > best.minutes ? { project: p, minutes: mins } : best;
      },
      { project: projects[0], minutes: 0 }
    );
    if (bestProject.minutes > 0) {
      result.push({
        message: `${bestProject.project?.name} led with ${formatDuration(bestProject.minutes)}`,
        type: 'success',
      });
    }

    // Completion rate
    if (weekPlanned > 0) {
      const rate = Math.round((weekCompleted / weekPlanned) * 100);
      if (rate >= 80) {
        result.push({ message: `${rate}% completion rate — excellent!`, type: 'success' });
      } else if (rate < 50) {
        result.push({ message: `Only ${rate}% tasks completed — review your load`, type: 'warning' });
      }
    }

    return result.slice(0, 3);
  }, [projects, projectHours, weekCompleted, weekPlanned]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Pulse</Text>
        {streak > 0 && <StreakBadge streak={streak} />}
      </View>

      <DaySelector
        date={currentWeekStart}
        label={weekLabel}
        onPrevious={() => setWeekOffset((o) => o - 1)}
        onNext={() => setWeekOffset((o) => o + 1)}
        canGoNext={!isCurrentWeek}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Feather name="clock" size={18} color={Colors.accent} />
            <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
            <Text style={styles.summaryLabel}>total</Text>
          </View>
          <View style={styles.summaryCard}>
            <Feather name="check-square" size={18} color={Colors.success} />
            <Text style={styles.summaryValue}>{weekCompleted}/{weekPlanned}</Text>
            <Text style={styles.summaryLabel}>tasks</Text>
          </View>
          <View style={styles.summaryCard}>
            <Feather name="activity" size={18} color={Colors.info} />
            <Text style={styles.summaryValue}>{weekSessions.length + weekGymSessions.length}</Text>
            <Text style={styles.summaryLabel}>sessions</Text>
          </View>
        </View>

        {/* Bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hours by Project</Text>
          <View style={styles.chartCard}>
            <BarChart entries={barData} />
          </View>
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            <View style={styles.insightsContainer}>
              {insights.map((insight, idx) => (
                <InsightCard key={idx} message={insight.message} type={insight.type} />
              ))}
            </View>
          </View>
        )}
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
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.lg,
  },
  chartCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
  },
  insightsContainer: {
    gap: Spacing.md,
  },
});
