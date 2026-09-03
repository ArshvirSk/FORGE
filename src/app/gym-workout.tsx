/**
 * FORGE Gym — Active Workout Screen
 * Live logging with sets/reps/weight per exercise, rest timer, and PR celebration.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import { useGymStore } from '@/store/gym';
import { CategoryColors, CategoryLabels } from '@/store/gymTypes';
import type { PersonalRecord } from '@/store/gymTypes';
import { RestTimer } from '@/components/RestTimer';
import { ExercisePicker } from '@/components/ExercisePicker';
import { PRCelebration } from '@/components/PRCelebration';

const GYM_ACCENT = '#8B5CF6';

export default function GymWorkoutScreen() {
  const router = useRouter();
  const activeWorkout = useGymStore((s) => s.activeWorkout);
  const exercises = useGymStore((s) => s.exercises);
  const addExerciseToWorkout = useGymStore((s) => s.addExerciseToWorkout);
  const removeExerciseFromWorkout = useGymStore((s) => s.removeExerciseFromWorkout);
  const addSetToExercise = useGymStore((s) => s.addSetToExercise);
  const updateSet = useGymStore((s) => s.updateSet);
  const removeSet = useGymStore((s) => s.removeSet);
  const toggleSetCompleted = useGymStore((s) => s.toggleSetCompleted);
  const finishWorkout = useGymStore((s) => s.finishWorkout);
  const cancelWorkout = useGymStore((s) => s.cancelWorkout);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [newPRs, setNewPRs] = useState<PersonalRecord[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed time counter
  useEffect(() => {
    if (!activeWorkout) return;
    const startTime = new Date(activeWorkout.startTime).getTime();
    const updateElapsed = () => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    };
    updateElapsed();
    intervalRef.current = setInterval(updateElapsed, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeWorkout?.startTime]);

  // Keep screen awake
  useEffect(() => {
    void activateKeepAwakeAsync('gym-workout');
    return () => { deactivateKeepAwake('gym-workout'); };
  }, []);

  const handleToggleSet = (exerciseId: string, setIndex: number) => {
    const exerciseLog = activeWorkout?.exercises.find((e) => e.exerciseId === exerciseId);
    const set = exerciseLog?.sets[setIndex];
    if (!set) return;

    toggleSetCompleted(exerciseId, setIndex);

    // Start rest timer when completing a set
    if (!set.completed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowRestTimer(true);
    }
  };

  const handleFinish = () => {
    if (!activeWorkout) return;

    const hasCompletedSets = activeWorkout.exercises.some((e) =>
      e.sets.some((s) => s.completed)
    );

    if (!hasCompletedSets) {
      Alert.alert('No completed sets', 'Complete at least one set before finishing.');
      return;
    }

    try {
      const result = finishWorkout(notes);
      if (result.newPRs.length > 0) {
        setNewPRs(result.newPRs);
        setShowPRCelebration(true);
      } else {
        router.back();
      }
    } catch {
      router.back();
    }
  };

  const handleCancel = () => {
    Alert.alert('Discard Workout?', 'All logged sets will be lost.', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => { cancelWorkout(); router.back(); },
      },
    ]);
  };

  if (!activeWorkout) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active workout</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const elapsedMins = Math.floor(elapsedSeconds / 60);
  const elapsedSecs = elapsedSeconds % 60;
  const elapsedDisplay = `${elapsedMins}:${elapsedSecs.toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleCancel} hitSlop={16}>
          <Feather name="x" size={24} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeWorkout.templateName ?? 'Free Workout'}
          </Text>
          <Text style={styles.elapsed}>{elapsedDisplay}</Text>
        </View>
        <Pressable onPress={handleFinish} hitSlop={16}>
          <View style={styles.finishBadge}>
            <Feather name="check" size={16} color={Colors.textInverse} />
            <Text style={styles.finishText}>Finish</Text>
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeWorkout.exercises.map((exerciseLog) => {
            const exercise = exercises.find((e) => e.id === exerciseLog.exerciseId);
            if (!exercise) return null;
            const catColor = CategoryColors[exercise.category];

            return (
              <View key={exercise.id} style={styles.exerciseCard}>
                <Pressable 
                  style={styles.exerciseHeader}
                  onPress={() => router.push({ pathname: '/gym-exercise-detail', params: { exerciseId: exercise.id } })}
                >
                  <View style={[styles.catIndicator, { backgroundColor: catColor }]} />
                  {exercise.thumbnailUrl && (
                    <Image source={{ uri: exercise.thumbnailUrl }} style={styles.thumbnail} />
                  )}
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={[styles.exerciseCategory, { color: catColor }]}>
                      {CategoryLabels[exercise.category]}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeExerciseFromWorkout(exercise.id)}
                    hitSlop={8}
                    style={styles.trashBtn}
                  >
                    <Feather name="trash-2" size={16} color={Colors.textMuted} />
                  </Pressable>
                </Pressable>

                {/* Sets Table */}
                <View style={styles.setsTable}>
                  <View style={styles.setsHeader}>
                    <Text style={[styles.setsHeaderText, { width: 32 }]}>Set</Text>
                    <Text style={[styles.setsHeaderText, { flex: 1 }]}>Weight</Text>
                    <Text style={[styles.setsHeaderText, { flex: 1 }]}>Reps</Text>
                    <Text style={[styles.setsHeaderText, { width: 36 }]}>✓</Text>
                  </View>

                  {exerciseLog.sets.map((set, setIdx) => (
                    <View key={setIdx} style={[styles.setRow, set.completed && styles.setRowCompleted]}>
                      <Text style={[styles.setNumber, { width: 32 }]}>{setIdx + 1}</Text>
                      <TextInput
                        style={[styles.setInput, { flex: 1 }]}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={Colors.textMuted}
                        value={set.weight > 0 ? set.weight.toString() : ''}
                        onChangeText={(v) => updateSet(exercise.id, setIdx, { weight: parseFloat(v) || 0 })}
                      />
                      <TextInput
                        style={[styles.setInput, { flex: 1 }]}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={Colors.textMuted}
                        value={set.reps > 0 ? set.reps.toString() : ''}
                        onChangeText={(v) => updateSet(exercise.id, setIdx, { reps: parseInt(v, 10) || 0 })}
                      />
                      <Pressable
                        style={[styles.checkBtn, set.completed && styles.checkBtnActive]}
                        onPress={() => handleToggleSet(exercise.id, setIdx)}
                      >
                        <Feather
                          name="check"
                          size={16}
                          color={set.completed ? Colors.textInverse : Colors.textMuted}
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>

                <Pressable
                  style={styles.addSetBtn}
                  onPress={() => addSetToExercise(exercise.id)}
                >
                  <Feather name="plus" size={14} color={GYM_ACCENT} />
                  <Text style={styles.addSetText}>Add Set</Text>
                </Pressable>
              </View>
            );
          })}

          {/* Add Exercise */}
          <Pressable style={styles.addExerciseBtn} onPress={() => setShowPicker(true)}>
            <Feather name="plus" size={18} color={GYM_ACCENT} />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </Pressable>

          {/* Notes */}
          <Pressable
            style={styles.notesToggle}
            onPress={() => setShowNotes(!showNotes)}
          >
            <Feather name="edit-3" size={16} color={Colors.textSecondary} />
            <Text style={styles.notesToggleText}>
              {showNotes ? 'Hide Notes' : 'Add Notes'}
            </Text>
          </Pressable>

          {showNotes && (
            <TextInput
              style={styles.notesInput}
              placeholder="Workout notes..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Rest Timer */}
      <RestTimer
        visible={showRestTimer}
        durationSeconds={activeWorkout.restTimerSeconds}
        onComplete={() => setShowRestTimer(false)}
        onSkip={() => setShowRestTimer(false)}
        onExtend={() => {}}
      />

      {/* Exercise Picker */}
      <ExercisePicker
        visible={showPicker}
        selectedIds={activeWorkout.exercises.map((e) => e.exerciseId)}
        onConfirm={(ids) => {
          // Add new exercises not already in workout
          const currentIds = new Set(activeWorkout.exercises.map((e) => e.exerciseId));
          ids.forEach((id) => {
            if (!currentIds.has(id)) addExerciseToWorkout(id);
          });
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />

      {/* PR Celebration */}
      <PRCelebration
        visible={showPRCelebration}
        newPRs={newPRs}
        exercises={exercises}
        onDismiss={() => { setShowPRCelebration(false); router.back(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary,
    maxWidth: 160,
  },
  elapsed: {
    fontSize: Typography.sm, color: GYM_ACCENT, fontWeight: Typography.bold,
    fontVariant: ['tabular-nums'], marginTop: 2,
  },
  finishBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.success, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: Radius.full,
  },
  finishText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textInverse },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 100 },
  exerciseCard: {
    backgroundColor: Colors.bgSurface, borderRadius: 20,
    padding: Spacing.xl, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  catIndicator: { width: 4, height: 24, borderRadius: 2 },
  thumbnail: { width: 40, height: 40, borderRadius: 8, backgroundColor: Colors.bgElevated },
  exerciseInfo: { flex: 1 },
  trashBtn: { padding: Spacing.xs },
  exerciseName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  exerciseCategory: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 },
  setsTable: { gap: 1, marginBottom: Spacing.md },
  setsHeader: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  setsHeaderText: {
    fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.bold,
    textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1,
  },
  setRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  setRowCompleted: { backgroundColor: 'rgba(16, 185, 129, 0.05)' },
  setNumber: {
    fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.bold,
    textAlign: 'center',
  },
  setInput: {
    fontSize: Typography.lg, color: Colors.textPrimary, fontWeight: Typography.bold,
    textAlign: 'center', backgroundColor: Colors.bgElevated,
    borderRadius: 8, marginHorizontal: 4, paddingVertical: Spacing.sm,
  },
  checkBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgElevated,
  },
  checkBtnActive: { backgroundColor: Colors.success, shadowColor: Colors.success, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 },
  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md,
    backgroundColor: 'rgba(139, 92, 246, 0.05)', borderRadius: 12, marginTop: Spacing.sm,
  },
  addSetText: { fontSize: Typography.sm, color: GYM_ACCENT, fontWeight: Typography.bold },
  addExerciseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.xl,
    borderWidth: 2, borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 20, borderStyle: 'dashed', marginBottom: Spacing.xl,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  addExerciseText: { fontSize: Typography.lg, color: GYM_ACCENT, fontWeight: Typography.bold },
  notesToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSurface, borderRadius: 20, marginBottom: Spacing.sm,
  },
  notesToggleText: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.bold },
  notesInput: {
    backgroundColor: Colors.bgSurface, borderRadius: 20,
    padding: Spacing.xl, fontSize: Typography.base, color: Colors.textPrimary,
    minHeight: 100, textAlignVertical: 'top', marginTop: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyText: { fontSize: Typography.lg, color: Colors.textMuted },
  backBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: GYM_ACCENT, borderRadius: Radius.full,
  },
  backBtnText: { fontSize: Typography.base, color: Colors.textInverse, fontWeight: Typography.semibold },
});
