import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, ProjectColors, Spacing, Typography, Radius } from '@/constants/theme';
import { useProjectsStore } from '@/store/projects';
import { useTasksStore } from '@/store/tasks';
import { ProjectChip } from '@/components/ProjectChip';

const TIME_OPTIONS = [15, 30, 45, 60, 90];

export default function AddTaskScreen() {
  const router = useRouter();
  const projects = useProjectsStore((s) => s.projects);
  const addTask = useTasksStore((s) => s.addTask);

  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [dueToday, setDueToday] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = () => {
    if (!title.trim() || !selectedProjectId) return;

    addTask({
      projectId: selectedProjectId,
      title: title.trim(),
      notes: notes.trim(),
      dueDate: dueToday ? today : today, // v1: always today
      estimatedMinutes,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedColor = selectedProject
    ? ProjectColors[selectedProject.color] || Colors.accent
    : Colors.accent;

  const isValid = title.trim().length > 0 && selectedProjectId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={16}>
            <Feather name="x" size={22} color={Colors.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>New Task</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!isValid}
            style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          >
            <Text style={[styles.saveText, !isValid && styles.saveTextDisabled]}>
              Add
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Project selector */}
          <Text style={styles.label}>Project</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {projects.map((p) => (
              <ProjectChip
                key={p.id}
                name={p.name}
                color={p.color}
                selected={selectedProjectId === p.id}
                onPress={() => setSelectedProjectId(p.id)}
              />
            ))}
          </ScrollView>

          {/* Title */}
          <Text style={styles.label}>Task</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="What are you working on?"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="next"
          />

          {/* Notes */}
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.titleInput, styles.notesInput]}
            placeholder="Any details..."
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Time estimate */}
          <Text style={styles.label}>Estimated Time</Text>
          <View style={styles.timeRow}>
            {TIME_OPTIONS.map((time) => (
              <Pressable
                key={time}
                style={[
                  styles.timeButton,
                  estimatedMinutes === time && {
                    backgroundColor: selectedColor + '25',
                    borderColor: selectedColor,
                  },
                ]}
                onPress={() => setEstimatedMinutes(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    estimatedMinutes === time && { color: selectedColor },
                  ]}
                >
                  {time}m
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Due today toggle */}
          <Pressable
            style={styles.toggleRow}
            onPress={() => setDueToday(!dueToday)}
          >
            <Feather
              name={dueToday ? 'check-square' : 'square'}
              size={20}
              color={dueToday ? Colors.accent : Colors.textMuted}
            />
            <Text style={styles.toggleText}>Add to Today</Text>
          </Pressable>
        </ScrollView>

        {/* Bottom submit */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: isValid ? selectedColor : Colors.bgElevated },
            ]}
            onPress={handleSubmit}
            disabled={!isValid}
          >
            <Feather
              name="plus"
              size={20}
              color={isValid ? Colors.textInverse : Colors.textMuted}
            />
            <Text
              style={[
                styles.submitText,
                { color: isValid ? Colors.textInverse : Colors.textMuted },
              ]}
            >
              Add Task
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  saveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.accent,
  },
  saveTextDisabled: {
    color: Colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  titleInput: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: {
    minHeight: 80,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
  },
  timeText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.semibold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  toggleText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  bottomBar: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
  },
  submitText: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
  },
});
