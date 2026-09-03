/**
 * FORGE Design System
 * Dark charcoal + electric amber theme
 */

import { Platform } from 'react-native';

export const Colors = {
  // Backgrounds
  bg: '#0F0F14',
  bgSurface: '#1A1A24',
  bgElevated: '#242432',
  bgCard: '#1E1E2C',

  // Accent
  accent: '#F59E0B',
  accentMuted: 'rgba(245, 158, 11, 0.15)',
  accentLight: '#FBBF24',

  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#0F0F14',

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

export const ProjectColors: Record<string, string> = {
  blue: '#3B82F6',
  red: '#EF4444',
  purple: '#8B5CF6',
  emerald: '#10B981',
  amber: '#F59E0B',
  pink: '#EC4899',
  cyan: '#06B6D4',
  orange: '#F97316',
};

export const DefaultProjects = [
  { name: 'DBA Consultants', color: 'blue', icon: 'briefcase' },
  { name: 'CEH Sprint', color: 'red', icon: 'shield' },
  { name: 'DSA', color: 'purple', icon: 'code' },
  { name: 'Freelance', color: 'emerald', icon: 'trending-up' },
  { name: 'Personal', color: 'amber', icon: 'user' },
  { name: 'Gym', color: 'orange', icon: 'award' },
] as const;

export const Fonts = Platform.select({
  ios: { sans: 'System' },
  default: { sans: 'Roboto' },
});

export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
  '4xl': 48,

  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  }),
} as const;
