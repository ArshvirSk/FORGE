import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

interface DaySelectorProps {
  date: Date;
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext?: boolean;
}

export function DaySelector({ date, label, onPrevious, onNext, canGoNext = true }: DaySelectorProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onPrevious} style={styles.arrow} hitSlop={12}>
        <Feather name="chevron-left" size={22} color={Colors.textSecondary} />
      </Pressable>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onNext}
        style={[styles.arrow, !canGoNext && styles.arrowDisabled]}
        hitSlop={12}
        disabled={!canGoNext}
      >
        <Feather name="chevron-right" size={22} color={canGoNext ? Colors.textSecondary : Colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  arrow: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  arrowDisabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    minWidth: 180,
    textAlign: 'center',
  },
});
