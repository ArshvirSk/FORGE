import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Colors, ProjectColors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import { useProjectsStore } from '@/store/projects';
import { useTasksStore } from '@/store/tasks';
import { useFocusStore } from '@/store/focus';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationStore } from '@/store/notifications';
import { formatDuration } from '@/utils/helpers';

const TIMER_PRESETS = [15, 25, 45, 60];
const CIRCLE_SIZE = 260;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusScreen() {
  const router = useRouter();
  const { taskId, projectId } = useLocalSearchParams<{ taskId: string; projectId: string }>();

  const task = useTasksStore((s) => s.getTaskById(taskId ?? ''));
  const completeTask = useTasksStore((s) => s.completeTask);
  const project = useProjectsStore((s) => s.getProjectById(projectId ?? ''));
  const startSession = useFocusStore((s) => s.startSession);
  const endSession = useFocusStore((s) => s.endSession);
  const { scheduleNotification } = useNotifications();
  const focusCompleteEnabled = useNotificationStore((s) => s.settings.focusComplete.enabled);

  const [durationMinutes, setDurationMinutes] = useState(
    task?.estimatedMinutes && TIMER_PRESETS.includes(task.estimatedMinutes)
      ? task.estimatedMinutes
      : 25
  );
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const projectColor = project ? ProjectColors[project.color] || Colors.accent : Colors.accent;
  const totalSeconds = durationMinutes * 60;
  const progress = 1 - remainingSeconds / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Pulse animation for active timer
  useEffect(() => {
    if (isRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  // Keep screen awake during focus
  useEffect(() => {
    if (isRunning) {
      void activateKeepAwakeAsync('focus-timer');
    } else {
      deactivateKeepAwake('focus-timer');
    }
    return () => {
      deactivateKeepAwake('focus-timer');
    };
  }, [isRunning]);

  // Timer interval
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    setIsCompleted(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // End session
    if (sessionId) {
      endSession(sessionId, true);
    }

    // Complete task
    if (taskId) {
      completeTask(taskId);
    }

    // Fire notification if enabled
    if (focusCompleteEnabled) {
      void scheduleNotification('focusComplete');
    }
  }, [sessionId, taskId, focusCompleteEnabled, scheduleNotification, endSession, completeTask]);

  const handleStart = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      // Start or resume
      if (!sessionId && taskId && projectId) {
        const id = startSession(taskId, projectId, durationMinutes);
        setSessionId(id);
      }
      setIsRunning(true);
    }
  };

  const handlePresetChange = (preset: number) => {
    if (isRunning) return;
    setDurationMinutes(preset);
    setRemainingSeconds(preset * 60);
  };

  const handleExtend = () => {
    setRemainingSeconds((prev) => prev + 10 * 60);
    setDurationMinutes((prev) => prev + 10);
    setIsCompleted(false);
    setIsRunning(true);
  };

  const handleClose = () => {
    if (isRunning && sessionId) {
      endSession(sessionId, false);
    }
    router.back();
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={handleClose} hitSlop={16}>
          <Feather name="x" size={24} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.taskInfo}>
          <View style={[styles.projectDot, { backgroundColor: projectColor }]} />
          <Text style={styles.projectName} numberOfLines={1}>
            {project?.name ?? 'Project'}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Task title */}
      <Text style={styles.taskTitle} numberOfLines={2}>
        {task?.title ?? 'Focus Session'}
      </Text>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Background circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={Colors.bgElevated}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={isCompleted ? Colors.success : projectColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.timerTextContainer}>
            {isCompleted ? (
              <>
                <Feather name="check-circle" size={40} color={Colors.success} />
                <Text style={styles.completedText}>Done!</Text>
              </>
            ) : (
              <>
                <Text style={styles.timerText}>{timeDisplay}</Text>
                <Text style={styles.timerSubtext}>
                  {isRunning ? 'focused' : 'ready'}
                </Text>
              </>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Duration presets */}
      {!isRunning && !isCompleted && (
        <View style={styles.presets}>
          {TIMER_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              style={[
                styles.presetButton,
                durationMinutes === preset && {
                  backgroundColor: projectColor + '25',
                  borderColor: projectColor,
                },
              ]}
              onPress={() => handlePresetChange(preset)}
            >
              <Text
                style={[
                  styles.presetText,
                  durationMinutes === preset && { color: projectColor },
                ]}
              >
                {preset}m
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {isCompleted ? (
          <View style={styles.completedActions}>
            <Pressable style={styles.secondaryButton} onPress={handleExtend}>
              <Feather name="plus" size={18} color={Colors.textSecondary} />
              <Text style={styles.secondaryButtonText}>+10 min</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: Colors.success }]}
              onPress={handleClose}
            >
              <Feather name="check" size={22} color={Colors.textInverse} />
              <Text style={styles.primaryButtonText}>Finish</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.playButton, { backgroundColor: projectColor }]}
            onPress={handleStart}
          >
            <Feather
              name={isRunning ? 'pause' : 'play'}
              size={28}
              color={Colors.textInverse}
            />
          </Pressable>
        )}
      </View>

      {/* Skip/cancel hint */}
      {isRunning && (
        <Pressable style={styles.cancelHint} onPress={handleClose}>
          <Text style={styles.cancelText}>End session</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  projectName: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  taskTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: Spacing['3xl'],
    marginTop: Spacing['2xl'],
    marginBottom: Spacing['4xl'],
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['4xl'],
  },
  timerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  timerText: {
    fontSize: Typography['4xl'],
    fontWeight: Typography.heavy,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  timerSubtext: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  completedText: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.success,
    marginTop: Spacing.sm,
  },
  presets: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['4xl'],
  },
  presetButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgSurface,
  },
  presetText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.semibold,
  },
  controls: {
    marginTop: 'auto',
    marginBottom: Spacing['5xl'],
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  completedActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    ...Shadows.md,
  },
  primaryButtonText: {
    fontSize: Typography.base,
    color: Colors.textInverse,
    fontWeight: Typography.semibold,
  },
  cancelHint: {
    marginBottom: Spacing['3xl'],
  },
  cancelText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
