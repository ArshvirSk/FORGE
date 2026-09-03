/**
 * FORGE Gym — Progress Chart Component
 * Line chart for weight progression over time per exercise.
 * Uses react-native-gifted-charts with FORGE dark theme.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import type { WorkoutSet } from '@/store/gymTypes';

interface DataPoint {
  date: string;
  sets: WorkoutSet[];
}

interface ProgressChartProps {
  data: DataPoint[];
  title?: string;
  color?: string;
}

export function ProgressChart({ data, title, color = '#8B5CF6' }: ProgressChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => {
      // Take the best weight from completed sets on that date
      const maxWeight = Math.max(
        ...point.sets.filter((s) => s.completed).map((s) => s.weight),
        0
      );
      const label = new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return {
        value: maxWeight,
        label,
        dataPointText: maxWeight > 0 ? `${maxWeight}` : '',
      };
    });
  }, [data]);

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);
  const stepValue = Math.ceil(maxValue / 5 / 5) * 5 || 5;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <LineChart
        data={chartData}
        width={280}
        height={180}
        color={color}
        thickness={2}
        dataPointsColor={color}
        dataPointsRadius={4}
        startFillColor={color}
        endFillColor={Colors.bgCard}
        startOpacity={0.3}
        endOpacity={0.05}
        areaChart
        curved
        yAxisColor={Colors.border}
        xAxisColor={Colors.border}
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        noOfSections={4}
        stepValue={stepValue}
        maxValue={maxValue + stepValue}
        backgroundColor={Colors.bgCard}
        rulesColor={Colors.border}
        rulesType="dashed"
        hideDataPoints={chartData.length > 20}
        showVerticalLines={false}
        spacing={chartData.length > 10 ? 40 : 60}
        initialSpacing={20}
        endSpacing={20}
        textColor={Colors.textMuted}
        textFontSize={Typography.xs}
        dataPointsHeight={6}
        dataPointsWidth={6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  axisText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
});
