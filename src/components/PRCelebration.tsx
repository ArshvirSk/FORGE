/**
 * FORGE Gym — PR Celebration Overlay
 * Shown after finishing a workout with new personal records.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import type { PersonalRecord, Exercise } from '@/store/gymTypes';
import { calculateEstimated1RM } from '@/utils/prDetection';

interface PRCelebrationProps {
  visible: boolean;
  newPRs: PersonalRecord[];
  exercises: Exercise[];
  onDismiss: () => void;
}

export function PRCelebration({ visible, newPRs, exercises, onDismiss }: PRCelebrationProps) {
  if (newPRs.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.emoji}>🏆</Text>
          <Text style={styles.title}>New Personal Records!</Text>
          <Text style={styles.subtitle}>
            You set {newPRs.length} {newPRs.length === 1 ? 'PR' : 'PRs'} this session!
          </Text>

          <View style={styles.prList}>
            {newPRs.map((pr, idx) => {
              const exercise = exercises.find((e) => e.id === pr.exerciseId);
              return (
                <View key={idx} style={styles.prRow}>
                  <View style={styles.prInfo}>
                    <Text style={styles.prExercise}>{exercise?.name ?? 'Exercise'}</Text>
                    <Text style={styles.prDetail}>
                      {pr.weight} × {pr.reps} reps
                    </Text>
                  </View>
                  <View style={styles.prORM}>
                    <Text style={styles.prORMValue}>{pr.calculatedOneRepMax}</Text>
                    <Text style={styles.prORMLabel}>est. 1RM</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Pressable style={styles.dismissBtn} onPress={onDismiss}>
            <Feather name="check" size={20} color={Colors.textInverse} />
            <Text style={styles.dismissText}>Nice!</Text>
          </Pressable>
        </View>
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
    marginHorizontal: Spacing['2xl'],
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  prList: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  prDetail: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  prORM: {
    alignItems: 'center',
  },
  prORMValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.accent,
  },
  prORMLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  dismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    ...Shadows.md,
  },
  dismissText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textInverse,
  },
});
