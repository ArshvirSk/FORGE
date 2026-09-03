import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, ProjectColors, Spacing, Typography, Radius } from '@/constants/theme';

interface BarChartEntry {
  label: string;
  value: number;
  color: string;
  maxValue: number;
}

interface BarChartProps {
  entries: BarChartEntry[];
  unit?: string;
}

export function BarChart({ entries, unit = 'h' }: BarChartProps) {
  const maxVal = Math.max(...entries.map((e) => e.maxValue), 1);

  return (
    <View style={styles.container}>
      {entries.map((entry, idx) => {
        const barWidth = entry.maxValue > 0 ? (entry.value / maxVal) * 100 : 0;
        const barColor = ProjectColors[entry.color] || Colors.accent;

        return (
          <View key={idx} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {entry.label}
            </Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.max(barWidth, 2)}%`,
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.value}>
              {entry.value.toFixed(1)}{unit}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  label: {
    width: 80,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: Radius.sm,
    minWidth: 4,
  },
  value: {
    width: 48,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    fontWeight: Typography.medium,
  },
});
