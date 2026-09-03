import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';

interface InsightCardProps {
  message: string;
  type?: 'info' | 'warning' | 'success';
}

const typeConfig = {
  info: { icon: 'info' as const, color: Colors.info, bg: 'rgba(59, 130, 246, 0.1)' },
  warning: { icon: 'alert-triangle' as const, color: Colors.warning, bg: 'rgba(245, 158, 11, 0.1)' },
  success: { icon: 'trending-up' as const, color: Colors.success, bg: 'rgba(16, 185, 129, 0.1)' },
};

export function InsightCard({ message, type = 'info' }: InsightCardProps) {
  const config = typeConfig[type];

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Feather name={config.icon} size={18} color={config.color} />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  message: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    lineHeight: 20,
  },
});
