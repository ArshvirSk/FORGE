import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

export function PRBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>🏆 PR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  text: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.accent,
  },
});
