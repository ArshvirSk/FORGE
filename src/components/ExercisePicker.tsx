/**
 * FORGE Gym — Exercise Picker Modal Component
 * Category filter tabs, search, multi-select, and add custom exercise.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useGymStore } from '@/store/gym';
import { CategoryColors, CategoryLabels } from '@/store/gymTypes';
import type { ExerciseCategory } from '@/store/gymTypes';

const CATEGORIES: (ExerciseCategory | 'all')[] = ['all', 'push', 'pull', 'legs', 'core', 'cardio'];

interface ExercisePickerProps {
  visible: boolean;
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
}

export function ExercisePicker({ visible, selectedIds, onConfirm, onClose }: ExercisePickerProps) {
  const exercises = useGymStore((s) => s.exercises);
  const addCustomExercise = useGymStore((s) => s.addCustomExercise);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [filter, setFilter] = useState<ExerciseCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>('push');
  const [customEquipment, setCustomEquipment] = useState('');

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelected(new Set(selectedIds));
      setFilter('all');
      setSearch('');
      setShowAddCustom(false);
    }
  }, [visible, selectedIds]);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchCategory = filter === 'all' || e.category === filter;
      const matchSearch = search === '' || e.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [exercises, filter, search]);

  const toggleExercise = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const id = addCustomExercise(customName.trim(), customCategory, customEquipment.trim() || 'bodyweight');
    setSelected((prev) => new Set(prev).add(id));
    setCustomName('');
    setCustomEquipment('');
    setShowAddCustom(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={16}>
            <Feather name="x" size={24} color={Colors.textSecondary} />
          </Pressable>
          <Text style={styles.title}>Select Exercises</Text>
          <Pressable
            onPress={() => onConfirm(Array.from(selected))}
            hitSlop={16}
          >
            <Text style={styles.doneText}>Done ({selected.size})</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((cat) => {
            const active = filter === cat;
            const color = cat === 'all' ? Colors.accent : CategoryColors[cat];
            return (
              <Pressable
                key={cat}
                style={[styles.categoryPill, active && { backgroundColor: color + '25', borderColor: color }]}
                onPress={() => setFilter(cat)}
              >
                <Text style={[styles.categoryPillText, active && { color }]}>
                  {cat === 'all' ? 'All' : CategoryLabels[cat]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Exercise List */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filtered.map((exercise) => {
            const isSelected = selected.has(exercise.id);
            const catColor = CategoryColors[exercise.category];
            return (
              <Pressable
                key={exercise.id}
                style={[styles.exerciseRow, isSelected && styles.exerciseRowSelected]}
                onPress={() => toggleExercise(exercise.id)}
              >
                <View style={[styles.checkBox, isSelected && { backgroundColor: Colors.accent, borderColor: Colors.accent }]}>
                  {isSelected && <Feather name="check" size={14} color={Colors.textInverse} />}
                </View>
                {exercise.thumbnailUrl ? (
                  <Image source={{ uri: exercise.thumbnailUrl }} style={styles.thumbnail} />
                ) : null}
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {exercise.equipment}{exercise.isCustom ? ' · Custom' : ''}
                  </Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: catColor + '20' }]}>
                  <Text style={[styles.categoryBadgeText, { color: catColor }]}>
                    {CategoryLabels[exercise.category]}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {/* Add Custom Button */}
          {!showAddCustom ? (
            <Pressable style={styles.addCustomButton} onPress={() => setShowAddCustom(true)}>
              <Feather name="plus" size={16} color={Colors.accent} />
              <Text style={styles.addCustomText}>Add Custom Exercise</Text>
            </Pressable>
          ) : (
            <View style={styles.addCustomForm}>
              <TextInput
                style={styles.customInput}
                placeholder="Exercise name"
                placeholderTextColor={Colors.textMuted}
                value={customName}
                onChangeText={setCustomName}
                autoFocus
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.customCategoryRow}>
                  {(['push', 'pull', 'legs', 'core', 'cardio'] as ExerciseCategory[]).map((cat) => (
                    <Pressable
                      key={cat}
                      style={[styles.categoryPill, customCategory === cat && { backgroundColor: CategoryColors[cat] + '25', borderColor: CategoryColors[cat] }]}
                      onPress={() => setCustomCategory(cat)}
                    >
                      <Text style={[styles.categoryPillText, customCategory === cat && { color: CategoryColors[cat] }]}>
                        {CategoryLabels[cat]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <TextInput
                style={styles.customInput}
                placeholder="Equipment (e.g. dumbbell)"
                placeholderTextColor={Colors.textMuted}
                value={customEquipment}
                onChangeText={setCustomEquipment}
              />
              <View style={styles.customActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setShowAddCustom(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.addBtn} onPress={handleAddCustom}>
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  title: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  doneText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.accent },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  categoryScroll: { maxHeight: 44 },
  categoryContainer: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.md },
  categoryPill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  categoryPillText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  exerciseRowSelected: { backgroundColor: 'rgba(245, 158, 11, 0.05)' },
  checkBox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbnail: {
    width: 32, height: 32, borderRadius: 6, backgroundColor: Colors.bgElevated,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: Typography.base, fontWeight: Typography.medium, color: Colors.textPrimary },
  exerciseMeta: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  categoryBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
  categoryBadgeText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  addCustomButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.lg, justifyContent: 'center',
  },
  addCustomText: { fontSize: Typography.base, color: Colors.accent, fontWeight: Typography.medium },
  addCustomForm: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg,
    gap: Spacing.md, marginTop: Spacing.md,
  },
  customInput: {
    backgroundColor: Colors.bgElevated, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.base, color: Colors.textPrimary,
  },
  customCategoryRow: { flexDirection: 'row', gap: Spacing.sm },
  customActions: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  cancelBtnText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.medium },
  addBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    backgroundColor: Colors.accent, borderRadius: Radius.md,
  },
  addBtnText: { fontSize: Typography.sm, color: Colors.textInverse, fontWeight: Typography.semibold },
});
