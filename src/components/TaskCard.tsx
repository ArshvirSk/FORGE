import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, ProjectColors, Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import type { Task, Project } from '@/store/types';

interface TaskCardProps {
  task: Task;
  project: Project | undefined;
  onStartFocus: (task: Task) => void;
  onComplete?: (task: Task) => void;
}

export function TaskCard({ task, project, onStartFocus, onComplete }: TaskCardProps) {
  const projectColor = project ? ProjectColors[project.color] || Colors.accent : Colors.accent;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onStartFocus(task)}
    >
      <View style={[styles.colorStripe, { backgroundColor: projectColor }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
          {onComplete && (
            <Pressable
              style={styles.checkButton}
              onPress={() => onComplete(task)}
              hitSlop={12}
            >
              <Feather name="check-circle" size={20} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
        {task.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {task.notes}
          </Text>
        ) : null}
        <View style={styles.bottomRow}>
          <View style={styles.projectBadge}>
            <View style={[styles.projectDot, { backgroundColor: projectColor }]} />
            <Text style={styles.projectName}>{project?.name ?? 'Unknown'}</Text>
          </View>
          {task.estimatedMinutes > 0 && (
            <View style={styles.timeBadge}>
              <Feather name="clock" size={12} color={Colors.textMuted} />
              <Text style={styles.timeText}>{task.estimatedMinutes}m</Text>
            </View>
          )}
          <View style={styles.focusCta}>
            <Feather name="play" size={12} color={Colors.accent} />
            <Text style={styles.focusText}>Focus</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  colorStripe: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  checkButton: {
    padding: Spacing.xs,
  },
  notes: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  projectName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  focusCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  focusText: {
    fontSize: Typography.xs,
    color: Colors.accent,
    fontWeight: Typography.semibold,
  },
});
