/**
 * FORGE Gym — Home Tab Screen
 * Shows weekly volume, gym streak, quick-start, and recent workouts.
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import { useGymStore } from '@/store/gym';
import { startOfWeek, formatDuration } from '@/utils/helpers';
import { VolumeCard } from '@/components/VolumeCard';
import { useWorkoutGenerator } from '@/hooks/useWorkoutGenerator';
import { useGymPreferencesStore } from '@/store/gymPreferences';
import { useGymGeneratorStore } from '@/store/gymGeneratorStore';

const GYM_ACCENT = '#8B5CF6';

export default function GymHomeScreen() {
  const router = useRouter();
  const templates = useGymStore((s) => s.templates);
  const sessions = useGymStore((s) => s.sessions);
  const exercises = useGymStore((s) => s.exercises);
  const getWeeklyVolume = useGymStore((s) => s.getWeeklyVolume);
  const calculateGymStreak = useGymStore((s) => s.calculateGymStreak);
  const startWorkout = useGymStore((s) => s.startWorkout);
  const activeWorkout = useGymStore((s) => s.activeWorkout);

  const { generatePlan, isLoading } = useWorkoutGenerator();
  const preferences = useGymPreferencesStore((s) => s.preferences);
  const setPendingPlan = useGymGeneratorStore((s) => s.setPendingPlan);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const volume = useMemo(() => getWeeklyVolume(weekStart), [sessions, weekStart]);
  const gymStreak = calculateGymStreak();

  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
  }, [sessions]);

  const lastTemplate = useMemo(() => {
    if (sessions.length === 0) return null;
    const lastSession = [...sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!lastSession.templateId) return null;
    return templates.find((t) => t.id === lastSession.templateId) ?? null;
  }, [sessions, templates]);

  const todayIso = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }, []);

  const todayAITemplate = useMemo(() => {
    return templates.find(t => t.isAIGenerated && t.aiDay === todayIso) ?? null;
  }, [templates, todayIso]);

  const hasAIPlan = useMemo(() => templates.some(t => t.isAIGenerated), [templates]);

  const handleGeneratePlan = async () => {
    if (!preferences) {
      router.push('/gym-preferences');
      return;
    }
    const result = await generatePlan(preferences);
    if (result) {
      setPendingPlan(result);
      router.push('/gym-ai-preview');
    } else {
      Alert.alert('Plan Generation Failed', 'Failed to generate your plan. Please check your internet connection or try again.');
    }
  };

  const handleRegeneratePlan = () => {
    Alert.alert(
      'Regenerate Plan',
      'This will replace your current AI plan. Past workout history is not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', onPress: handleGeneratePlan }
      ]
    );
  };

  const handleQuickStart = () => {
    if (activeWorkout) {
      router.push('/gym-workout');
      return;
    }
    if (lastTemplate) {
      startWorkout(lastTemplate.id);
    } else {
      startWorkout();
    }
    router.push('/gym-workout');
  };

  const handleStartBlank = () => {
    if (activeWorkout) {
      router.push('/gym-workout');
      return;
    }
    startWorkout();
    router.push('/gym-workout');
  };

  const weekSessions = useMemo(() => {
    const wsStr = weekStart.toISOString().split('T')[0];
    const weDate = new Date(weekStart);
    weDate.setDate(weDate.getDate() + 6);
    const weStr = weDate.toISOString().split('T')[0];
    return sessions.filter((s) => s.date >= wsStr && s.date <= weStr);
  }, [sessions, weekStart]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Gym</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/gym-preferences')} hitSlop={12}>
            <Feather name="settings" size={20} color={Colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => router.push('/gym-history')} hitSlop={12}>
            <Feather name="calendar" size={20} color={Colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => router.push('/gym-templates')} hitSlop={12}>
            <Feather name="layers" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak + This Week Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.streakCard]}>
            <Text style={styles.streakEmoji}>💪</Text>
            <Text style={styles.streakCount}>{gymStreak}</Text>
            <Text style={styles.streakLabel}>{gymStreak === 1 ? 'day' : 'days'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{weekSessions.length}</Text>
            <Text style={styles.statLabel}>workouts</Text>
            <Text style={styles.statSub}>this week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0)}
            </Text>
            <Text style={styles.statLabel}>minutes</Text>
            <Text style={styles.statSub}>total</Text>
          </View>
        </View>

        {/* AI Plan Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>This Week's Plan</Text>
            {hasAIPlan && !isLoading && (
              <Pressable onPress={handleRegeneratePlan} hitSlop={8}>
                <Text style={styles.seeAll}>Regenerate</Text>
              </Pressable>
            )}
          </View>
          
          {isLoading ? (
            <View style={styles.aiLoadingCard}>
              <ActivityIndicator color={GYM_ACCENT} />
              <Text style={styles.aiLoadingText}>Generating your perfect week...</Text>
            </View>
          ) : hasAIPlan ? (
            todayAITemplate ? (
              <View style={styles.todayAITemplateCard}>
                <View style={styles.todayAIInfo}>
                  <Text style={styles.todayAILabel}>Today's Workout</Text>
                  <Text style={styles.todayAITitle}>{todayAITemplate.name}</Text>
                  <Text style={styles.todayAITitleSub}>{todayAITemplate.exerciseIds.length} exercises</Text>
                </View>
                <Pressable 
                  style={styles.aiStartButton}
                  onPress={() => {
                    startWorkout(todayAITemplate.id);
                    router.push('/gym-workout');
                  }}
                >
                  <Feather name="play" size={16} color="#fff" />
                  <Text style={styles.aiStartButtonText}>Start</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.aiRestCard}>
                <Feather name="coffee" size={24} color={Colors.textMuted} />
                <Text style={styles.aiRestText}>Rest Day</Text>
                <Text style={styles.aiRestSub}>Your plan says to take it easy today.</Text>
              </View>
            )
          ) : (
            <Pressable style={styles.aiPromoCard} onPress={handleGeneratePlan}>
              <Feather name="cpu" size={24} color={GYM_ACCENT} />
              <View style={styles.aiPromoContent}>
                <Text style={styles.aiPromoTitle}>Generate My Plan</Text>
                <Text style={styles.aiPromoSub}>Let Gemini create a personalized weekly routine.</Text>
              </View>
              <Feather name="chevron-right" size={20} color={GYM_ACCENT} />
            </Pressable>
          )}
        </View>

        {/* Quick Start */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <View style={styles.quickStartRow}>
            {activeWorkout ? (
              <Pressable style={styles.resumeButton} onPress={() => router.push('/gym-workout')}>
                <Feather name="play" size={20} color={Colors.textInverse} />
                <Text style={styles.resumeButtonText}>Resume Workout</Text>
              </Pressable>
            ) : (
              <>
                <Pressable style={styles.quickStartButton} onPress={handleQuickStart}>
                  <Feather name="zap" size={18} color={Colors.textInverse} />
                  <Text style={styles.quickStartText}>
                    {lastTemplate ? `Start ${lastTemplate.name}` : 'Start Workout'}
                  </Text>
                </Pressable>
                <Pressable style={styles.blankButton} onPress={handleStartBlank}>
                  <Feather name="plus" size={18} color={GYM_ACCENT} />
                  <Text style={styles.blankText}>Blank</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Template quick picks */}
          {templates.length > 0 && !activeWorkout && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateScroll}
              contentContainerStyle={styles.templateScrollContent}
            >
              {templates.map((template) => (
                <Pressable
                  key={template.id}
                  style={styles.templateChip}
                  onPress={() => {
                    startWorkout(template.id);
                    router.push('/gym-workout');
                  }}
                >
                  <Feather name="layers" size={14} color={GYM_ACCENT} />
                  <Text style={styles.templateChipText} numberOfLines={1}>
                    {template.name}
                  </Text>
                  <Text style={styles.templateChipCount}>
                    {template.exerciseIds.length}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Weekly Volume */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week's Volume</Text>
          <VolumeCard volume={volume} />
        </View>

        {/* Recent Workouts */}
        {recentSessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Workouts</Text>
              <Pressable onPress={() => router.push('/gym-history')} hitSlop={8}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            {recentSessions.map((session) => {
              const template = session.templateId
                ? templates.find((t) => t.id === session.templateId)
                : null;
              const totalSets = session.exercises.reduce(
                (sum, e) => sum + e.sets.length,
                0
              );
              return (
                <Pressable
                  key={session.id}
                  style={styles.recentCard}
                  onPress={() =>
                    router.push({ pathname: '/gym-session-detail', params: { sessionId: session.id } })
                  }
                >
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle}>
                      {template?.name ?? 'Free Workout'}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {formatDuration(session.durationMinutes)} · {totalSets} sets
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={Colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg,
  },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: Spacing.lg },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['3xl'] },
  statCard: {
    flex: 1, backgroundColor: Colors.bgSurface, borderRadius: 20,
    padding: Spacing.xl, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  streakCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)',
    shadowOpacity: 0, elevation: 0,
  },
  streakEmoji: { fontSize: 24 },
  streakCount: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: GYM_ACCENT },
  streakLabel: { fontSize: Typography.sm, color: 'rgba(139, 92, 246, 0.8)', fontWeight: Typography.bold, textTransform: 'uppercase' },
  statNumber: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.bold, textTransform: 'uppercase' },
  statSub: { fontSize: Typography.xs, color: Colors.textMuted },
  section: { marginBottom: Spacing['2xl'] },
  sectionTitle: {
    fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  seeAll: { fontSize: Typography.sm, color: GYM_ACCENT, fontWeight: Typography.medium },
  aiLoadingCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 20,
    padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  aiLoadingText: { color: GYM_ACCENT, fontWeight: Typography.medium },
  aiPromoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 20, padding: Spacing.xl, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)',
    gap: Spacing.md,
  },
  aiPromoContent: { flex: 1 },
  aiPromoTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: GYM_ACCENT },
  aiPromoSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  todayAITemplateCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgSurface, borderRadius: 20, padding: Spacing.xl,
    borderLeftWidth: 4, borderLeftColor: GYM_ACCENT,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  todayAIInfo: { flex: 1, paddingRight: Spacing.md },
  todayAILabel: { fontSize: Typography.xs, color: GYM_ACCENT, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 1 },
  todayAITitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginTop: 4 },
  todayAITitleSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  aiStartButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GYM_ACCENT,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: 24,
    shadowColor: GYM_ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  aiStartButtonText: { color: '#fff', fontWeight: Typography.bold, fontSize: Typography.sm },
  aiRestCard: {
    backgroundColor: Colors.bgSurface, borderRadius: 20, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  aiRestText: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  aiRestSub: { fontSize: Typography.sm, color: Colors.textSecondary },
  quickStartRow: { flexDirection: 'row', gap: Spacing.md },
  quickStartButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: GYM_ACCENT, borderRadius: 20,
    paddingVertical: Spacing.xl,
    shadowColor: GYM_ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  quickStartText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textInverse },
  blankButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  blankText: { fontSize: Typography.base, fontWeight: Typography.bold, color: GYM_ACCENT },
  resumeButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.success, borderRadius: 20,
    paddingVertical: Spacing.xl,
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  resumeButtonText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textInverse },
  templateScroll: { marginTop: Spacing.md },
  templateScrollContent: { gap: Spacing.sm },
  templateChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgSurface, borderRadius: 20,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
    marginRight: Spacing.sm,
  },
  templateChipText: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.bold, maxWidth: 120 },
  templateChipCount: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface,
    borderRadius: 20, padding: Spacing.xl, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  recentMeta: { fontSize: Typography.sm, color: Colors.textSecondary },
});
