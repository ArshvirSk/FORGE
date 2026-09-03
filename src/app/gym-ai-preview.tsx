import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useGymGeneratorStore } from '@/store/gymGeneratorStore';
import { useGymStore } from '@/store/gym';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GeneratedExercise } from '@/hooks/useWorkoutGenerator';

export default function GymAIPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pendingPlan, setPendingPlan } = useGymGeneratorStore();
  const { exercises, addCustomExercise, addTemplate, updateTemplate } = useGymStore();

  const newExercises = useMemo(() => {
    if (!pendingPlan) return [];
    const newEx = new Set<string>();
    pendingPlan.weekStructure.forEach(day => {
      if (!day.isRestDay && day.exercises) {
        day.exercises.forEach(ex => {
          if (ex.isNew) newEx.add(ex.exerciseName);
        });
      }
    });
    return Array.from(newEx);
  }, [pendingPlan]);

  const handleDiscard = () => {
    setPendingPlan(null);
    router.back();
  };

  const handleAccept = () => {
    if (!pendingPlan) return;

    if (newExercises.length > 0) {
      Alert.alert(
        'New Exercises Detected',
        `The AI recommended ${newExercises.length} new exercise(s). These will be added to your custom library. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: savePlan },
        ]
      );
    } else {
      savePlan();
    }
  };

  const savePlan = () => {
    if (!pendingPlan) return;

    // Remove existing AI templates before saving the new plan
    const { templates, deleteTemplate } = useGymStore.getState();
    const existingAITemplates = templates.filter(t => t.isAIGenerated);
    existingAITemplates.forEach(t => deleteTemplate(t.id));

    // For each workout day, map exercises and create template
    pendingPlan.weekStructure.forEach(day => {
      if (day.isRestDay || !day.exercises || day.exercises.length === 0) return;

      const exerciseIds: string[] = [];

      day.exercises.forEach((ex: GeneratedExercise) => {
        // Try to find it in our existing library
        let matched = exercises.find(e => e.name.toLowerCase() === ex.exerciseName.toLowerCase());
        
        if (!matched) {
          // Create custom exercise if not found
          const id = addCustomExercise(ex.exerciseName, 'general' as any, 'various');
          exerciseIds.push(id);
        } else {
          exerciseIds.push(matched.id);
        }
      });

      // Create template
      const templateId = addTemplate(day.workoutName || `Day ${day.dayIndex} Workout`, exerciseIds);
      
      // Tag with AI metadata
      updateTemplate(templateId, {
        isAIGenerated: true,
        aiPlanName: pendingPlan.planName,
        aiDay: day.dayIndex,
      });
    });

    setPendingPlan(null);
    router.replace('/(tabs)/gym');
  };

  if (!pendingPlan) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No plan available.</Text>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.back()}>
          <Text style={styles.buttonSecondaryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your AI Plan</Text>
        <TouchableOpacity onPress={handleDiscard}>
          <Feather name="x" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerCard}>
          <View style={styles.planNameRow}>
            <Feather name="zap" size={24} color={Colors.accent} />
            <Text style={styles.planName}>{pendingPlan.planName}</Text>
          </View>
          <View style={styles.reasoningBox}>
            <Text style={styles.reasoningText}>
              {pendingPlan.reasoning}
            </Text>
          </View>
        </View>

        {newExercises.length > 0 && (
          <View style={styles.newExercisesBox}>
            <View style={styles.newExHeader}>
              <Feather name="star" size={16} color="#F59E0B" />
              <Text style={styles.newExercisesTitle}>New Exercises Added</Text>
            </View>
            <View style={styles.chipContainer}>
              {newExercises.map(ex => (
                <View key={ex} style={styles.chip}>
                  <Text style={styles.chipText}>{ex}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Your Weekly Routine</Text>
        
        {pendingPlan.weekStructure.map((day) => (
          <View key={day.dayIndex} style={[styles.dayCard, day.isRestDay && styles.restDayCard]}>
            <View style={styles.dayHeader}>
              <View style={styles.dayHeaderLeft}>
                <Text style={styles.dayName}>{day.day}</Text>
              </View>
              {day.isRestDay && (
                <View style={styles.restBadge}>
                  <Text style={styles.restText}>REST</Text>
                </View>
              )}
            </View>
            
            {!day.isRestDay && (
              <>
                <Text style={styles.workoutName}>{day.workoutName}</Text>
                <View style={styles.exercisesContainer}>
                  {day.exercises?.map((ex, idx) => {
                  const hasRepsText = ex.repsRange.toLowerCase().includes('rep') || ex.repsRange.toLowerCase().includes('s');
                  const repsDisplay = hasRepsText ? ex.repsRange : `${ex.repsRange} reps`;
                  
                  return (
                    <View key={idx} style={styles.exerciseRow}>
                      <Text style={styles.exIndex}>{idx + 1}</Text>
                      <View style={styles.exContent}>
                        <View style={styles.exHeaderRow}>
                          {(() => {
                            const matched = exercises.find(e => e.name.toLowerCase() === ex.exerciseName.toLowerCase());
                            if (matched?.thumbnailUrl) {
                              return <Image source={{ uri: matched.thumbnailUrl }} style={styles.thumbnail} />;
                            }
                            return null;
                          })()}
                          <Pressable 
                            style={styles.exNameRowInner}
                            onPress={() => {
                              const matched = exercises.find(e => e.name.toLowerCase() === ex.exerciseName.toLowerCase());
                              if (matched) {
                                router.push({ pathname: '/gym-exercise-detail', params: { exerciseId: matched.id } });
                              }
                            }}
                          >
                            <Text style={styles.exName}>{ex.exerciseName}</Text>
                            {ex.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
                          </Pressable>
                        </View>
                        <Text style={styles.exDetails}>{ex.sets} sets  •  {repsDisplay}  •  {ex.restSeconds}s rest</Text>
                        {ex.notes && <Text style={styles.exNotes}>{ex.notes}</Text>}
                      </View>
                    </View>
                  );
                })}
                </View>
              </>
            )}
          </View>
        ))}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnDiscard} onPress={handleDiscard}>
            <Feather name="trash-2" size={20} color={Colors.error} />
            <Text style={styles.btnDiscardText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAccept} onPress={handleAccept}>
            <Feather name="check" size={20} color="#fff" />
            <Text style={styles.btnAcceptText}>Accept Plan</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 3,
  },
  headerCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  planName: {
    flex: 1,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  reasoningBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  reasoningText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  newExercisesBox: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  newExHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  newExercisesTitle: {
    color: '#F59E0B',
    fontWeight: Typography.bold,
    fontSize: Typography.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  chipText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  sectionTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  dayCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 20,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  restDayCard: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    shadowOpacity: 0,
    elevation: 0,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dayName: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  restBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  restText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 1,
  },
  workoutName: {
    fontSize: Typography.base,
    color: Colors.accent,
    fontWeight: Typography.bold,
    marginBottom: Spacing.xl,
  },
  exercisesContainer: {
    gap: Spacing.xl,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  exIndex: {
    color: Colors.textMuted,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    width: 20,
    textAlign: 'center',
    marginTop: 2,
  },
  exContent: {
    flex: 1,
  },
  exHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  thumbnail: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.bgElevated,
  },
  exNameRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  exName: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  newBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: Typography.bold,
  },
  exDetails: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  exNotes: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  btnDiscard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    borderRadius: 12,
  },
  btnDiscardText: {
    color: Colors.error,
    fontWeight: Typography.bold,
  },
  btnAccept: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    padding: Spacing.md,
    borderRadius: 12,
  },
  btnAcceptText: {
    color: '#fff',
    fontWeight: Typography.bold,
    fontSize: Typography.md,
  },
  buttonSecondary: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  buttonSecondaryText: {
    color: Colors.textPrimary,
    fontWeight: Typography.bold,
  },
});
