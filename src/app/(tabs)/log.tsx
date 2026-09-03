import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, ProjectColors, Spacing, Typography, Radius } from '@/constants/theme';
import { useProjectsStore } from '@/store/projects';
import { useTasksStore } from '@/store/tasks';
import { useFocusStore } from '@/store/focus';
import { useGymStore } from '@/store/gym';
import type { FocusSession } from '@/store/types';
import type { WorkoutSession } from '@/store/gymTypes';
import { formatDateLong, formatDuration, isSameDay } from '@/utils/helpers';
import { DaySelector } from '@/components/DaySelector';
import { EmptyState } from '@/components/EmptyState';

const GYM_ACCENT = '#8B5CF6';

type LogEvent =
  | { type: 'focus'; data: FocusSession; time: number }
  | { type: 'gym'; data: WorkoutSession; time: number };

export default function LogScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const projects = useProjectsStore((s) => s.projects);
  const tasks = useTasksStore((s) => s.tasks);
  const sessions = useFocusStore((s) => s.sessions);
  const gymSessions = useGymStore((s) => s.sessions);
  const templates = useGymStore((s) => s.templates);

  const today = new Date();
  const canGoNext = !isSameDay(selectedDate, today);

  const dayEvents = useMemo(() => {
    const events: LogEvent[] = [];

    sessions.forEach((s) => {
      const d = new Date(s.startTime);
      if (isSameDay(d, selectedDate) && s.completed) {
        events.push({ type: 'focus', data: s, time: d.getTime() });
      }
    });

    gymSessions.forEach((s) => {
      const d = new Date(s.startTime);
      if (isSameDay(d, selectedDate)) {
        events.push({ type: 'gym', data: s, time: d.getTime() });
      }
    });

    return events.sort((a, b) => a.time - b.time);
  }, [sessions, gymSessions, selectedDate]);

  const completedTasks = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return tasks.filter(
      (t) => t.status === 'done' && t.completedAt && t.completedAt.startsWith(dateStr)
    );
  }, [tasks, selectedDate]);

  const totalFocusMinutes = useMemo(
    () =>
      dayEvents
        .filter((e) => e.type === 'focus')
        .reduce((sum, e) => sum + e.data.durationMinutes, 0),
    [dayEvents]
  );

  const totalGymMinutes = useMemo(
    () =>
      dayEvents
        .filter((e) => e.type === 'gym')
        .reduce((sum, e) => sum + e.data.durationMinutes, 0),
    [dayEvents]
  );

  const totalMinutes = totalFocusMinutes + totalGymMinutes;

  const handlePrevious = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleShare = async () => {
    const lines: string[] = [formatDateLong(selectedDate), ''];
    dayEvents.forEach((event) => {
      if (event.type === 'focus') {
        const session = event.data;
        const project = projects.find((p) => p.id === session.projectId);
        const task = tasks.find((t) => t.id === session.taskId);
        lines.push(
          `✅ ${project?.name ?? 'Project'} — ${task?.title ?? 'Task'} (${formatDuration(session.durationMinutes)})`
        );
      } else {
        const session = event.data;
        const template = session.templateId ? templates.find((t) => t.id === session.templateId) : null;
        lines.push(
          `💪 Gym — ${template?.name ?? 'Free Workout'} (${formatDuration(session.durationMinutes)})`
        );
      }
    });
    if (totalMinutes > 0) {
      lines.push('', `Total: ${formatDuration(totalMinutes)}`);
    }
    lines.push('', '#FORGE #buildinpublic');

    try {
      await Share.share({ message: lines.join('\n') });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Log</Text>
        {dayEvents.length > 0 && (
          <Pressable onPress={handleShare} hitSlop={12}>
            <Feather name="share" size={20} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <DaySelector
        date={selectedDate}
        label={formatDateLong(selectedDate)}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoNext={canGoNext}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {dayEvents.length > 0 ? (
          <>
            {dayEvents.map((event, idx) => {
              const time = new Date(event.time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

              if (event.type === 'focus') {
                const session = event.data;
                const project = projects.find((p) => p.id === session.projectId);
                const task = tasks.find((t) => t.id === session.taskId);
                const projectColor = project ? ProjectColors[project.color] || Colors.accent : Colors.accent;

                return (
                  <View key={session.id} style={styles.logEntry}>
                    <View style={styles.timeline}>
                      <View style={[styles.timelineDot, { backgroundColor: projectColor }]} />
                      {idx < dayEvents.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.logContent}>
                      <Text style={styles.logTime}>{time}</Text>
                      <Text style={styles.logTask}>{task?.title ?? 'Focus session'}</Text>
                      <View style={styles.logMeta}>
                        <Text style={[styles.logProject, { color: projectColor }]}>
                          {project?.name ?? 'Project'}
                        </Text>
                        <Text style={styles.logDuration}>
                          {formatDuration(session.durationMinutes)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              } else {
                const session = event.data;
                const template = session.templateId ? templates.find((t) => t.id === session.templateId) : null;
                const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.length, 0);

                return (
                  <View key={session.id} style={styles.logEntry}>
                    <View style={styles.timeline}>
                      <View style={[styles.timelineDot, { backgroundColor: GYM_ACCENT, borderRadius: 2 }]} />
                      {idx < dayEvents.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={[styles.logContent, { borderColor: 'rgba(139, 92, 246, 0.2)', borderWidth: 1 }]}>
                      <Text style={styles.logTime}>{time}</Text>
                      <Text style={styles.logTask}>{template?.name ?? 'Free Workout'}</Text>
                      <View style={styles.logMeta}>
                        <Text style={[styles.logProject, { color: GYM_ACCENT }]}>
                          💪 Gym · {totalSets} sets
                        </Text>
                        <Text style={styles.logDuration}>
                          {formatDuration(session.durationMinutes)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }
            })}

            {/* Total */}
            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Feather name="clock" size={16} color={Colors.accent} />
                <Text style={styles.totalLabel}>Focus time</Text>
                <Text style={styles.totalValue}>{formatDuration(totalFocusMinutes)}</Text>
              </View>
              {totalGymMinutes > 0 && (
                <View style={[styles.totalRow, { marginTop: Spacing.sm }]}>
                  <Feather name="activity" size={16} color={GYM_ACCENT} />
                  <Text style={styles.totalLabel}>Gym time</Text>
                  <Text style={[styles.totalValue, { color: GYM_ACCENT }]}>{formatDuration(totalGymMinutes)}</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <EmptyState
            icon="book-open"
            title="No sessions logged"
            subtitle={
              isSameDay(selectedDate, today)
                ? "Start a focus session to build today's log"
                : 'Nothing was logged on this day'
            }
          />
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
  logEntry: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  timeline: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  logContent: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginLeft: Spacing.md,
    marginBottom: Spacing.sm,
  },
  logTime: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  logTask: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logProject: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  logDuration: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  totalCard: {
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  totalLabel: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  totalValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.accent,
  },
});
