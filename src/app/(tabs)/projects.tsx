import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, ProjectColors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import { useProjectsStore } from '@/store/projects';
import { useTasksStore } from '@/store/tasks';
import { useFocusStore } from '@/store/focus';
import { formatDuration, startOfWeek } from '@/utils/helpers';
import type { Task } from '@/store/types';

export default function ProjectsScreen() {
  const router = useRouter();
  const projects = useProjectsStore((s) => s.projects);
  const tasks = useTasksStore((s) => s.tasks);
  const sessions = useFocusStore((s) => s.sessions);
  const deleteTask = useTasksStore((s) => s.deleteTask);
  const completeTask = useTasksStore((s) => s.completeTask);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const weekStart = startOfWeek(new Date());

  const projectStats = useMemo(() => {
    const stats: Record<string, { taskCount: number; weekMinutes: number; completedCount: number }> = {};
    projects.forEach((p) => {
      const projectTasks = tasks.filter((t) => t.projectId === p.id);
      const incompleteTasks = projectTasks.filter((t) => t.status !== 'done');
      const weekSessions = sessions.filter((s) => {
        const d = new Date(s.startTime);
        return s.projectId === p.id && d >= weekStart && s.completed;
      });
      stats[p.id] = {
        taskCount: incompleteTasks.length,
        weekMinutes: weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0),
        completedCount: projectTasks.filter((t) => t.status === 'done').length,
      };
    });
    return stats;
  }, [projects, tasks, sessions]);

  const handleStartFocus = (task: Task) => {
    router.push({
      pathname: '/focus',
      params: { taskId: task.id, projectId: task.projectId },
    });
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    Alert.alert('Delete Task', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(taskId) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/add-task')}
        >
          <Feather name="plus" size={18} color={Colors.accent} />
          <Text style={styles.addButtonText}>Add Task</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {projects.map((project) => {
          const color = ProjectColors[project.color] || Colors.accent;
          const stats = projectStats[project.id] || { taskCount: 0, weekMinutes: 0, completedCount: 0 };
          const isExpanded = expandedProject === project.id;
          const projectTasks = tasks.filter(
            (t) => t.projectId === project.id && t.status !== 'done'
          );

          return (
            <View key={project.id} style={styles.projectCard}>
              <Pressable
                style={styles.projectRow}
                onPress={() => setExpandedProject(isExpanded ? null : project.id)}
              >
                <View style={[styles.colorBar, { backgroundColor: color }]} />
                <View style={styles.projectInfo}>
                  <View style={styles.projectNameRow}>
                    <Feather
                      name={project.icon as any}
                      size={16}
                      color={color}
                    />
                    <Text style={styles.projectName}>{project.name}</Text>
                  </View>
                  <View style={styles.projectMeta}>
                    <Text style={styles.metaText}>
                      {stats.taskCount} task{stats.taskCount !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaText}>
                      {formatDuration(stats.weekMinutes)} this week
                    </Text>
                  </View>
                </View>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textMuted}
                />
              </Pressable>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  {projectTasks.length > 0 ? (
                    projectTasks.map((task) => (
                      <View key={task.id} style={styles.taskRow}>
                        <Pressable
                          style={styles.taskCheckbox}
                          onPress={() => completeTask(task.id)}
                          hitSlop={8}
                        >
                          <Feather name="circle" size={16} color={Colors.textMuted} />
                        </Pressable>
                        <Pressable
                          style={styles.taskContent}
                          onPress={() => handleStartFocus(task)}
                        >
                          <Text style={styles.taskTitle} numberOfLines={1}>
                            {task.title}
                          </Text>
                          {task.estimatedMinutes > 0 && (
                            <Text style={styles.taskTime}>{task.estimatedMinutes}m</Text>
                          )}
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteTask(task.id, task.title)}
                          hitSlop={8}
                        >
                          <Feather name="trash-2" size={14} color={Colors.textMuted} />
                        </Pressable>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyTasks}>No active tasks</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
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
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  addButtonText: {
    fontSize: Typography.sm,
    color: Colors.accent,
    fontWeight: Typography.semibold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  projectCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  colorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  projectInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  projectNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  projectName: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  metaDot: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  taskCheckbox: {
    padding: 2,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  taskTitle: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  taskTime: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  emptyTasks: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
