/**
 * FORGE Gym — Templates Screen
 * Create, edit, and delete workout templates.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import { useGymStore } from '@/store/gym';
import { CategoryColors, CategoryLabels } from '@/store/gymTypes';
import { ExercisePicker } from '@/components/ExercisePicker';

const GYM_ACCENT = '#8B5CF6';

export default function GymTemplatesScreen() {
  const router = useRouter();
  const templates = useGymStore((s) => s.templates);
  const exercises = useGymStore((s) => s.exercises);
  const addTemplate = useGymStore((s) => s.addTemplate);
  const updateTemplate = useGymStore((s) => s.updateTemplate);
  const deleteTemplate = useGymStore((s) => s.deleteTemplate);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const handleCreate = () => {
    setShowCreate(true);
    setEditingId(null);
    setName('');
    setSelectedExerciseIds([]);
  };

  const handleEdit = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setEditingId(templateId);
    setShowCreate(true);
    setName(template.name);
    setSelectedExerciseIds([...template.exerciseIds]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      updateTemplate(editingId, { name: name.trim(), exerciseIds: selectedExerciseIds });
    } else {
      addTemplate(name.trim(), selectedExerciseIds);
    }
    setShowCreate(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Template', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Feather name="x" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Templates</Text>
        <Pressable onPress={handleCreate} hitSlop={16}>
          <Feather name="plus" size={24} color={GYM_ACCENT} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Create/Edit Form */}
        {showCreate && (
          <View style={styles.formCard}>
            <TextInput
              style={styles.nameInput}
              placeholder="Template name (e.g. Push Day)"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            {selectedExerciseIds.length > 0 && (
              <View style={styles.selectedExercises}>
                {selectedExerciseIds.map((eid) => {
                  const ex = exercises.find((e) => e.id === eid);
                  if (!ex) return null;
                  const catColor = CategoryColors[ex.category];
                  return (
                    <View key={eid} style={styles.exerciseChip}>
                      {ex.thumbnailUrl ? (
                        <Image source={{ uri: ex.thumbnailUrl }} style={styles.chipThumbnail} />
                      ) : (
                        <View style={[styles.chipDot, { backgroundColor: catColor }]} />
                      )}
                      <Text style={styles.chipText} numberOfLines={1}>{ex.name}</Text>
                      <Pressable
                        onPress={() =>
                          setSelectedExerciseIds((prev) => prev.filter((id) => id !== eid))
                        }
                        hitSlop={8}
                      >
                        <Feather name="x" size={14} color={Colors.textMuted} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            <Pressable style={styles.addExercisesBtn} onPress={() => setShowPicker(true)}>
              <Feather name="plus" size={16} color={GYM_ACCENT} />
              <Text style={styles.addExercisesBtnText}>
                {selectedExerciseIds.length > 0 ? 'Edit Exercises' : 'Add Exercises'}
              </Text>
            </Pressable>

            <View style={styles.formActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => { setShowCreate(false); setEditingId(null); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, (!name.trim() || selectedExerciseIds.length === 0) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!name.trim() || selectedExerciseIds.length === 0}
              >
                <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Template List */}
        {templates.length === 0 && !showCreate ? (
          <View style={styles.emptyState}>
            <Feather name="layers" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No templates yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a template to quickly start your workouts.
            </Text>
            <Pressable style={styles.createBtn} onPress={handleCreate}>
              <Feather name="plus" size={18} color={Colors.textInverse} />
              <Text style={styles.createBtnText}>Create Template</Text>
            </Pressable>
          </View>
        ) : (
          templates.map((template) => {
            const exerciseList = template.exerciseIds
              .map((eid) => exercises.find((e) => e.id === eid))
              .filter(Boolean);

            return (
              <View key={template.id} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateMeta}>
                      {template.exerciseIds.length} exercises
                    </Text>
                  </View>
                  <View style={styles.templateActions}>
                    <Pressable onPress={() => handleEdit(template.id)} hitSlop={8}>
                      <Feather name="edit-2" size={16} color={Colors.textSecondary} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(template.id)} hitSlop={8}>
                      <Feather name="trash-2" size={16} color={Colors.error} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.exerciseList}>
                  {exerciseList.map((ex) => {
                    if (!ex) return null;
                    const catColor = CategoryColors[ex.category];
                    return (
                      <Pressable 
                        key={ex.id} 
                        style={styles.exerciseListItem}
                        onPress={() => router.push({ pathname: '/gym-exercise-detail', params: { exerciseId: ex.id } })}
                      >
                        {ex.thumbnailUrl ? (
                          <Image source={{ uri: ex.thumbnailUrl }} style={styles.listThumbnail} />
                        ) : (
                          <View style={[styles.exDot, { backgroundColor: catColor }]} />
                        )}
                        <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                        <Text style={[styles.exCategory, { color: catColor }]}>
                          {CategoryLabels[ex.category]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <ExercisePicker
        visible={showPicker}
        selectedIds={selectedExerciseIds}
        onConfirm={(ids) => { setSelectedExerciseIds(ids); setShowPicker(false); }}
        onClose={() => setShowPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 100 },
  formCard: {
    backgroundColor: Colors.bgSurface, borderRadius: 20, padding: Spacing.xl,
    gap: Spacing.lg, marginBottom: Spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  nameInput: {
    backgroundColor: Colors.bgElevated, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: Typography.base, color: Colors.textPrimary,
  },
  selectedExercises: { gap: Spacing.xs },
  exerciseChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgElevated, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipThumbnail: { width: 24, height: 24, borderRadius: 4, backgroundColor: Colors.bgSurface },
  chipText: { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary },
  addExercisesBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.lg,
    borderWidth: 2, borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 20, borderStyle: 'dashed',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  addExercisesBtnText: { fontSize: Typography.sm, color: GYM_ACCENT, fontWeight: Typography.medium },
  formActions: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  cancelBtnText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.medium },
  saveBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: GYM_ACCENT, borderRadius: 20,
    shadowColor: GYM_ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: Typography.sm, color: Colors.textInverse, fontWeight: Typography.semibold },
  emptyState: {
    alignItems: 'center', paddingVertical: Spacing['5xl'], gap: Spacing.md,
  },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: GYM_ACCENT, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: 24, marginTop: Spacing.md,
    shadowColor: GYM_ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  createBtnText: { fontSize: Typography.base, color: Colors.textInverse, fontWeight: Typography.bold },
  templateCard: {
    backgroundColor: Colors.bgSurface, borderRadius: 20,
    padding: Spacing.xl, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  templateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  templateInfo: { flex: 1 },
  templateName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  templateMeta: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  templateActions: { flexDirection: 'row', gap: Spacing.lg },
  exerciseList: { gap: Spacing.xs },
  exerciseListItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  exDot: { width: 6, height: 6, borderRadius: 3 },
  listThumbnail: { width: 28, height: 28, borderRadius: 4, backgroundColor: Colors.bgElevated },
  exName: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary },
  exCategory: { fontSize: Typography.xs, fontWeight: Typography.medium },
});
