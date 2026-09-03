/**
 * FORGE Gym — Session Detail Screen
 * Full view of a past workout session with exercises, sets, and PRs.
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useGymStore } from '@/store/gym';
import { CategoryColors, CategoryLabels } from '@/store/gymTypes';
import { PRBadge } from '@/components/PRBadge';
import { formatDuration } from '@/utils/helpers';
import { calculateEstimated1RM } from '@/utils/prDetection';
import { Image } from 'react-native';

const GYM_ACCENT = '#8B5CF6';

export default function GymSessionDetailScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const sessions = useGymStore((s) => s.sessions);
  const exercises = useGymStore((s) => s.exercises);
  const templates = useGymStore((s) => s.templates);
  const personalRecords = useGymStore((s) => s.personalRecords);

  const session = useMemo(() => {
    return sessions.find((s) => s.id === sessionId);
  }, [sessions, sessionId]);

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={16}>
            <Feather name="arrow-left" size={24} color={Colors.textSecondary} />
          </Pressable>
          <Text style={styles.title}>Session</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Session not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const template = session.templateId
    ? templates.find((t) => t.id === session.templateId)
    : null;

  const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const totalVolume = session.exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0
  );

  const dateStr = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Feather name="arrow-left" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>{template?.name ?? 'Free Workout'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Meta */}
        <Text style={styles.date}>{dateStr}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Feather name="clock" size={16} color={GYM_ACCENT} />
            <Text style={styles.statValue}>{formatDuration(session.durationMinutes)}</Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="layers" size={16} color={GYM_ACCENT} />
            <Text style={styles.statValue}>{session.exercises.length} exercises</Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="activity" size={16} color={GYM_ACCENT} />
            <Text style={styles.statValue}>{totalSets} sets</Text>
          </View>
        </View>

        {totalVolume > 0 && (
          <View style={styles.volumeCard}>
            <Text style={styles.volumeLabel}>Total Volume</Text>
            <Text style={styles.volumeValue}>
              {totalVolume >= 1000
                ? `${(totalVolume / 1000).toFixed(1)}k kg`
                : `${totalVolume} kg`}
            </Text>
          </View>
        )}

        {/* Exercises */}
        {session.exercises.map((exerciseLog) => {
          const exercise = exercises.find((e) => e.id === exerciseLog.exerciseId);
          if (!exercise) return null;
          const catColor = CategoryColors[exercise.category];
          const pr = personalRecords.find((p) => p.exerciseId === exercise.id);

          return (
            <Pressable
              key={exercise.id}
              style={styles.exerciseCard}
              onPress={() =>
                router.push({
                  pathname: '/gym-exercise-detail',
                  params: { exerciseId: exercise.id },
                })
              }
            >
              <Pressable 
                style={styles.exerciseHeader}
                onPress={() => router.push({ pathname: '/gym-exercise-detail', params: { exerciseId: exercise.id } })}
              >
                <View style={[styles.catIndicator, { backgroundColor: catColor }]} />
                {exercise.thumbnailUrl && (
                  <Image source={{ uri: exercise.thumbnailUrl }} style={styles.thumbnail} />
                )}
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={[styles.exerciseCategory, { color: catColor }]}>
                    {CategoryLabels[exercise.category]}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.setsTable}>
                <View style={styles.setsHeader}>
                  <Text style={[styles.shText, { width: 32 }]}>Set</Text>
                  <Text style={[styles.shText, { flex: 1 }]}>Weight</Text>
                  <Text style={[styles.shText, { flex: 1 }]}>Reps</Text>
                  <Text style={[styles.shText, { width: 50 }]}>1RM</Text>
                </View>

                {exerciseLog.sets.map((set, i) => {
                  const orm = calculateEstimated1RM(set.weight, set.reps);
                  const isPR = pr && orm >= pr.calculatedOneRepMax && set.weight === pr.weight && set.reps === pr.reps;

                  return (
                    <View key={i} style={styles.setRow}>
                      <Text style={[styles.setText, { width: 32 }]}>{i + 1}</Text>
                      <Text style={[styles.setText, { flex: 1 }]}>{set.weight}</Text>
                      <Text style={[styles.setText, { flex: 1 }]}>{set.reps}</Text>
                      <View style={{ width: 50, alignItems: 'center' }}>
                        {isPR ? <PRBadge /> : (
                          <Text style={styles.ormText}>{orm > 0 ? orm.toFixed(0) : '—'}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </Pressable>
          );
        })}

        {/* Notes */}
        {session.notes ? (
          <View style={styles.notesCard}>
            <Feather name="edit-3" size={14} color={Colors.textMuted} />
            <Text style={styles.notesText}>{session.notes}</Text>
          </View>
        ) : null}
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
  date: { fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.xl },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  statValue: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  volumeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 20,
    padding: Spacing.xl, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  volumeLabel: { fontSize: Typography.sm, color: GYM_ACCENT, fontWeight: Typography.medium },
  volumeValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: GYM_ACCENT },
  exerciseCard: {
    backgroundColor: Colors.bgSurface, borderRadius: 20,
    padding: Spacing.xl, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  exerciseHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md,
  },
  catIndicator: { width: 3, height: 16, borderRadius: 2 },
  thumbnail: { width: 32, height: 32, borderRadius: 6, backgroundColor: Colors.bgElevated },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  exerciseCategory: { fontSize: Typography.xs, fontWeight: Typography.medium },
  setsTable: { gap: 1 },
  setsHeader: {
    flexDirection: 'row', paddingVertical: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  shText: {
    fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold, textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  setText: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center' },
  ormText: { fontSize: Typography.xs, color: Colors.textMuted },
  notesCard: {
    flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.bgSurface,
    borderRadius: 20, padding: Spacing.xl, marginTop: Spacing.md,
  },
  notesText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: Typography.base, color: Colors.textMuted },
});
