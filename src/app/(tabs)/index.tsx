import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, ProjectColors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import { useProjectsStore } from '@/store/projects';
import { useTasksStore } from '@/store/tasks';
import { useFocusStore, calculateStreak } from '@/store/focus';
import { useGymStore } from '@/store/gym';
import { getGreeting, formatDateShort } from '@/utils/helpers';
import { TaskCard } from '@/components/TaskCard';
import { StreakBadge } from '@/components/StreakBadge';
import { EmptyState } from '@/components/EmptyState';
import type { Task } from '@/store/types';

export default function TodayScreen() {
  const router = useRouter();
  const projects = useProjectsStore((s) => s.projects);
  const tasks = useTasksStore((s) => s.tasks);
  const completeTask = useTasksStore((s) => s.completeTask);
  const sessions = useFocusStore((s) => s.sessions);
  const activeWorkout = useGymStore((s) => s.activeWorkout);
  const templates = useGymStore((s) => s.templates);

  const todayIso = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }, []);

  const todayAITemplate = useMemo(() => {
    return templates.find(t => t.isAIGenerated && t.aiDay === todayIso) ?? null;
  }, [templates, todayIso]);

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
  const todayStr = today.toISOString().split('T')[0];

  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === todayStr && t.status !== 'done');
  }, [tasks, todayStr]);

  const completedToday = useMemo(() => {
    return tasks.filter((t) => t.dueDate === todayStr && t.status === 'done');
  }, [tasks, todayStr]);

  const tasksByProject = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    todayTasks.forEach((task) => {
      if (!grouped[task.projectId]) grouped[task.projectId] = [];
      grouped[task.projectId].push(task);
    });
    return grouped;
  }, [todayTasks]);

  const streak = calculateStreak(completedDates);
  const gymStreak = useGymStore((s) => s.calculateGymStreak)();
  const hasGymSessions = useGymStore((s) => s.sessions).length > 0;
  const greeting = getGreeting();
  const dateStr = formatDateShort(today);

  const handleStartFocus = (task: Task) => {
    router.push({
      pathname: '/focus',
      params: { taskId: task.id, projectId: task.projectId },
    });
  };

  const handleAddTask = () => {
    router.push('/add-task');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../../assets/logo.png')}
              style={{ width: 48, height: 48, marginBottom: Spacing.sm, borderRadius: Radius.md }}
              resizeMode="contain"
            />
            <Text style={styles.greeting}>{greeting}, Arshvir</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.settingsBtn} onPress={() => router.push('/notification-settings')} hitSlop={12}>
              <Feather name="settings" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Dashboard Stats */}
        <View style={styles.dashboardGrid}>
          {/* Work / Tasks Stat */}
          <View style={[styles.dashCard, styles.workCard]}>
            <View style={styles.cardHeader}>
              <Feather name="target" size={16} color={Colors.accent} />
              <Text style={styles.cardTitle}>Focus</Text>
            </View>
            <Text style={styles.dashNumber}>{todayTasks.length}</Text>
            <Text style={styles.dashLabel}>tasks remaining</Text>
            {streak > 0 && (
              <View style={styles.badgeStrip}>
                <Feather name="flame" size={12} color={Colors.accent} />
                <Text style={styles.badgeText}>{streak} day streak</Text>
              </View>
            )}
          </View>

          {/* Gym / Health Stat */}
          <Pressable
            style={[styles.dashCard, styles.gymCard]}
            onPress={() => router.push('/(tabs)/gym')}
          >
            <View style={styles.cardHeader}>
              <Feather name="activity" size={16} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Fitness</Text>
            </View>
            {activeWorkout ? (
              <>
                <Text style={[styles.dashNumber, { color: '#8B5CF6' }]}>Active</Text>
                <Text style={styles.dashLabel}>Workout in progress</Text>
              </>
            ) : todayAITemplate ? (
              <>
                <Text style={[styles.dashNumber, { color: '#8B5CF6', fontSize: Typography.xl }]} numberOfLines={1}>
                  {todayAITemplate.name}
                </Text>
                <Text style={styles.dashLabel}>{todayAITemplate.exerciseIds.length} exercises</Text>
              </>
            ) : (
              <>
                <Text style={[styles.dashNumber, { color: '#8B5CF6' }]}>Rest</Text>
                <Text style={styles.dashLabel}>No workout planned</Text>
              </>
            )}
            {hasGymSessions && gymStreak > 0 && (
              <View style={[styles.badgeStrip, styles.gymBadgeStrip]}>
                <Text style={{ fontSize: 10 }}>💪</Text>
                <Text style={[styles.badgeText, { color: '#8B5CF6' }]}>{gymStreak} day streak</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionDividerText}>Today's Tasks</Text>
          <Text style={styles.completedSummary}>{completedToday.length} done</Text>
        </View>

        {/* Tasks by Project */}
        {todayTasks.length > 0 ? (
          Object.entries(tasksByProject).map(([projectId, projectTasks]) => {
            const project = projects.find((p) => p.id === projectId);
            const projectColor = project
              ? ProjectColors[project.color] || Colors.accent
              : Colors.accent;

            return (
              <View key={projectId} style={styles.projectSection}>
                <View style={styles.projectHeader}>
                  <View style={[styles.projectIndicator, { backgroundColor: projectColor }]} />
                  <Text style={styles.projectTitle}>{project?.name ?? 'Unknown'}</Text>
                  <Text style={styles.projectCount}>{projectTasks.length}</Text>
                </View>
                {projectTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={project}
                    onStartFocus={handleStartFocus}
                    onComplete={(t) => completeTask(t.id)}
                  />
                ))}
              </View>
            );
          })
        ) : (
          <EmptyState
            icon="check-circle"
            title="Nothing on the forge today"
            subtitle="Add a task or enjoy the rest — you've earned it."
          />
        )}

        {/* Completed Today */}
        {completedToday.length > 0 && (
          <View style={styles.completedSection}>
            <Text style={styles.completedHeader}>
              Completed today · {completedToday.length}
            </Text>
            {completedToday.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const projectColor = project
                ? ProjectColors[project.color] || Colors.accent
                : Colors.accent;

              return (
                <View key={task.id} style={styles.completedItem}>
                  <Feather name="check" size={14} color={Colors.success} />
                  <View style={[styles.completedDot, { backgroundColor: projectColor }]} />
                  <Text style={styles.completedText} numberOfLines={1}>
                    {task.title}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={handleAddTask}>
        <Feather name="plus" size={24} color={Colors.textInverse} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    marginTop: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    paddingLeft: Spacing.md,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dashboardGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  dashCard: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderRadius: 24,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  workCard: {
    borderTopColor: 'rgba(245, 158, 11, 0.4)',
    borderTopWidth: 2,
  },
  gymCard: {
    borderTopColor: 'rgba(139, 92, 246, 0.4)',
    borderTopWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dashNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dashLabel: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  badgeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
  },
  gymBadgeStrip: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.accent,
  },
  sectionDivider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionDividerText: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  completedSummary: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  projectSection: {
    marginBottom: Spacing.xl,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  projectIndicator: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  projectTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  projectCount: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  completedSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  completedHeader: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  completedText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
});
