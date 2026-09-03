/**
 * FORGE Gym — Weekly Volume Summary Card
 * Per-category breakdown with compact bars.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { CategoryColors, CategoryLabels } from '@/store/gymTypes';
import type { ExerciseCategory } from '@/store/gymTypes';

interface VolumeData {
  sets: number;
  reps: number;
  weight: number;
}

interface VolumeCardProps {
  volume: Record<ExerciseCategory, VolumeData>;
}

export function VolumeCard({ volume }: VolumeCardProps) {
  const categories: ExerciseCategory[] = ['push', 'pull', 'legs', 'core', 'cardio'];
  const maxSets = Math.max(...categories.map((c) => volume[c].sets), 1);
  const totalSets = categories.reduce((sum, c) => sum + volume[c].sets, 0);
  const totalReps = categories.reduce((sum, c) => sum + volume[c].reps, 0);
  const totalWeight = categories.reduce((sum, c) => sum + volume[c].weight, 0);

  return (
    <View style={styles.container}>
      {/* Totals */}
      <View style={styles.totalsRow}>
        <View style={styles.totalItem}>
          <Text style={styles.totalValue}>{totalSets}</Text>
          <Text style={styles.totalLabel}>sets</Text>
        </View>
        <View style={styles.totalItem}>
          <Text style={styles.totalValue}>{totalReps}</Text>
          <Text style={styles.totalLabel}>reps</Text>
        </View>
        <View style={styles.totalItem}>
          <Text style={styles.totalValue}>
            {totalWeight >= 1000
              ? `${(totalWeight / 1000).toFixed(1)}k`
              : totalWeight.toString()}
          </Text>
          <Text style={styles.totalLabel}>kg moved</Text>
        </View>
      </View>

      {/* Category bars */}
      <View style={styles.barsContainer}>
        {categories.map((cat) => {
          const data = volume[cat];
          const barWidth = maxSets > 0 ? (data.sets / maxSets) * 100 : 0;
          const color = CategoryColors[cat];

          return (
            <View key={cat} style={styles.barRow}>
              <Text style={styles.barLabel}>{CategoryLabels[cat]}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(barWidth, 2)}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{data.sets}s</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  totalValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  totalLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  barsContainer: {
    gap: Spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barLabel: {
    width: 42,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  barTrack: {
    flex: 1,
    height: 16,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.sm,
    minWidth: 4,
  },
  barValue: {
    width: 28,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    fontWeight: Typography.medium,
  },
});
