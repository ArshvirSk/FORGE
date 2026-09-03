import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, ProjectColors, Spacing, Typography, Radius } from '@/constants/theme';

interface ProjectChipProps {
  name: string;
  color: string;
  selected?: boolean;
  onPress?: () => void;
}

export function ProjectChip({ name, color, selected, onPress }: ProjectChipProps) {
  const chipColor = ProjectColors[color] || Colors.accent;

  return (
    <Pressable
      style={[
        styles.chip,
        selected && { backgroundColor: chipColor + '30', borderColor: chipColor },
      ]}
      onPress={onPress}
    >
      <View style={[styles.dot, { backgroundColor: chipColor }]} />
      <Text style={[styles.label, selected && { color: chipColor }]}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
});
