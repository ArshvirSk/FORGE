/**
 * FORGE Gym — Exercise Detail Screen
 * Progress chart + PR history for a single exercise.
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useGymStore } from '@/store/gym';
import { CategoryColors, CategoryLabels } from '@/store/gymTypes';
import { ProgressChart } from '@/components/ProgressChart';
import { PRBadge } from '@/components/PRBadge';
import { calculateEstimated1RM } from '@/utils/prDetection';
import { useVideoPlayer, VideoView } from 'expo-video';

const GYM_ACCENT = '#8B5CF6';

export default function GymExerciseDetailScreen() {
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const exercises = useGymStore((s) => s.exercises);
  const personalRecords = useGymStore((s) => s.personalRecords);
  const getExerciseHistory = useGymStore((s) => s.getExerciseHistory);

  const exercise = useMemo(
    () => exercises.find((e) => e.id === exerciseId),
    [exercises, exerciseId]
  );

  const history = useMemo(
    () => (exerciseId ? getExerciseHistory(exerciseId) : []),
    [exerciseId]
  );

  const pr = useMemo(
    () => personalRecords.find((p) => p.exerciseId === exerciseId),
    [personalRecords, exerciseId]
  );

  const player = useVideoPlayer(exercise?.videoUrl || null, (player) => {
    player.loop = true;
    player.muted = true; // start muted for auto-play friendliness
    player.play();
  });

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={16}>
            <Feather name="arrow-left" size={24} color={Colors.textSecondary} />
          </Pressable>
          <Text style={styles.title}>Exercise</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Exercise not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const catColor = CategoryColors[exercise.category];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Feather name="arrow-left" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{exercise.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise Info */}
        <View style={styles.infoRow}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor + '20' }]}>
            <Text style={[styles.categoryText, { color: catColor }]}>
              {CategoryLabels[exercise.category]}
            </Text>
          </View>
          <Text style={styles.equipmentText}>{exercise.equipment}</Text>
          {exercise.isCustom && (
            <Text style={styles.customBadge}>Custom</Text>
          )}
        </View>

        {/* Animated Video */}
        {exercise.videoUrl && (
          <View style={styles.videoContainer}>
            <VideoView 
              player={player} 
              style={styles.video} 
              contentFit="cover"
              nativeControls={true}
              allowsFullscreen
              allowsPictureInPicture
            />
          </View>
        )}

        {/* Current PR */}
        {pr && (
          <View style={styles.prCard}>
            <View style={styles.prHeader}>
              <Text style={styles.prTitle}>Personal Record</Text>
              <PRBadge />
            </View>
            <View style={styles.prStats}>
              <View style={styles.prStat}>
                <Text style={styles.prStatValue}>{pr.weight}</Text>
                <Text style={styles.prStatLabel}>kg</Text>
              </View>
              <Text style={styles.prMultiply}>×</Text>
              <View style={styles.prStat}>
                <Text style={styles.prStatValue}>{pr.reps}</Text>
                <Text style={styles.prStatLabel}>reps</Text>
              </View>
              <View style={styles.prDivider} />
              <View style={styles.prStat}>
                <Text style={[styles.prStatValue, { color: Colors.accent }]}>
                  {pr.calculatedOneRepMax.toFixed(0)}
                </Text>
                <Text style={styles.prStatLabel}>est. 1RM</Text>
              </View>
            </View>
            <Text style={styles.prDate}>
              Set on {new Date(pr.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        )}

        {/* Progress Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weight Progression</Text>
          <ProgressChart data={history} color={catColor} />
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Session History ({history.length})
          </Text>
          {history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>
                No history yet. Log your first set!
              </Text>
            </View>
          ) : (
            [...history].reverse().map((entry, idx) => {
              const bestSet = entry.sets.reduce(
                (best, s) => {
                  const orm = calculateEstimated1RM(s.weight, s.reps);
                  return orm > best.orm ? { set: s, orm } : best;
                },
                { set: entry.sets[0], orm: 0 }
              );

              return (
                <View key={idx} style={styles.historyCard}>
                  <Text style={styles.historyDate}>
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <View style={styles.historySets}>
                    {entry.sets.map((set, si) => (
                      <Text key={si} style={styles.historySetText}>
                        {set.weight} × {set.reps}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.historyORM}>
                    {bestSet.orm > 0 ? `${bestSet.orm.toFixed(0)}` : '—'}
                  </Text>
                </View>
              );
            })
          )}
        </View>
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
  title: {
    fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary,
    maxWidth: 220,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 100 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  categoryBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  categoryText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  equipmentText: { fontSize: Typography.sm, color: Colors.textMuted },
  customBadge: {
    fontSize: Typography.xs, color: Colors.accent, fontWeight: Typography.medium,
    backgroundColor: Colors.accentMuted, paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  prCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: 20,
    padding: Spacing.xl, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  prHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  prTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  prStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  prStat: { alignItems: 'center' },
  prStatValue: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  prStatLabel: { fontSize: Typography.xs, color: Colors.textMuted },
  prMultiply: { fontSize: Typography.lg, color: Colors.textMuted },
  prDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  prDate: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },
  section: { marginBottom: Spacing['2xl'] },
  sectionTitle: {
    fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.lg,
  },
  emptyCard: {
    backgroundColor: Colors.bgSurface, borderRadius: 20, padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyCardText: { fontSize: Typography.sm, color: Colors.textMuted },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface,
    borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.xs, gap: Spacing.md,
  },
  historyDate: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.medium, width: 72 },
  historySets: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  historySetText: {
    fontSize: Typography.xs, color: Colors.textSecondary,
    backgroundColor: Colors.bgElevated, paddingHorizontal: Spacing.sm,
    paddingVertical: 2, borderRadius: Radius.sm,
  },
  historyORM: { fontSize: Typography.sm, color: GYM_ACCENT, fontWeight: Typography.bold, width: 36, textAlign: 'right' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: Typography.base, color: Colors.textMuted },
  videoContainer: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
