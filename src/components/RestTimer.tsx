/**
 * FORGE Gym — Rest Timer Overlay
 * Circular SVG countdown with vibration, skip, and extend buttons.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Modal } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';

const CIRCLE_SIZE = 200;
const STROKE_WIDTH = 6;
const R = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface RestTimerProps {
  visible: boolean;
  durationSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
  onExtend: (extraSeconds: number) => void;
}

export function RestTimer({ visible, durationSeconds, onComplete, onSkip, onExtend }: RestTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Reset when timer becomes visible
  useEffect(() => {
    if (visible) {
      setRemaining(durationSeconds);
      setIsComplete(false);
    }
  }, [visible, durationSeconds]);

  // Countdown logic
  useEffect(() => {
    if (visible && remaining > 0 && !isComplete) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, isComplete]);

  const handleComplete = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsComplete(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  }, [onComplete]);

  // Pulse animation when complete
  useEffect(() => {
    if (isComplete) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isComplete]);

  if (!visible) return null;

  const progress = 1 - remaining / durationSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.label}>{isComplete ? 'Rest Complete!' : 'Rest Timer'}</Text>

          <View style={styles.timerCircle}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
              <Circle
                cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={R}
                stroke={Colors.bgElevated} strokeWidth={STROKE_WIDTH} fill="none"
              />
              <Circle
                cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={R}
                stroke={isComplete ? Colors.success : '#8B5CF6'}
                strokeWidth={STROKE_WIDTH} fill="none"
                strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.timerTextContainer}>
              <Text style={[styles.timerText, isComplete && { color: Colors.success }]}>
                {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={onSkip}>
              <Text style={styles.secondaryBtnText}>Skip</Text>
            </Pressable>
            <Pressable
              style={styles.extendBtn}
              onPress={() => {
                setRemaining((prev) => prev + 30);
                setIsComplete(false);
                onExtend(30);
              }}
            >
              <Text style={styles.extendBtnText}>+30s</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius['2xl'],
    padding: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.xl,
    ...Shadows.lg,
  },
  label: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  timerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTextContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  timerText: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.heavy,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  secondaryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  extendBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  extendBtnText: {
    fontSize: Typography.base,
    color: '#8B5CF6',
    fontWeight: Typography.semibold,
  },
});
