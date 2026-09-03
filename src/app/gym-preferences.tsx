import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useGymPreferencesStore, DEFAULT_PREFERENCES } from '@/store/gymPreferences';
import type { GymPreferences } from '@/store/gymTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GOALS = ['strength', 'hypertrophy', 'fat loss', 'general fitness', 'endurance'];
const EXPERIENCES = ['beginner', 'intermediate', 'advanced'];
const DURATIONS = [30, 45, 60, 90];
const EQUIPMENT = ['dumbbells', 'barbell', 'bench', 'pull-up bar', 'resistance bands', 'cardio machine', 'bodyweight'];
const SPLITS = ['Push/Pull/Legs', 'Upper/Lower', 'Full Body', 'Bro Split', 'Let AI decide'];
const DAYS = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 7 },
];

export default function GymPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preferences, setPreferences } = useGymPreferencesStore();
  
  const [form, setForm] = useState<GymPreferences>(preferences || DEFAULT_PREFERENCES);

  const toggleDay = (day: number) => {
    setForm(prev => {
      const days = prev.daysPerWeek.includes(day)
        ? prev.daysPerWeek.filter(d => d !== day)
        : [...prev.daysPerWeek, day].sort();
      return { ...prev, daysPerWeek: days };
    });
  };

  const toggleEquipment = (eq: string) => {
    setForm(prev => {
      const equip = prev.equipment.includes(eq)
        ? prev.equipment.filter(e => e !== eq)
        : [...prev.equipment, eq];
      return { ...prev, equipment: equip };
    });
  };

  const handleSave = () => {
    setPreferences(form);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>AI Generator Preferences</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Primary Goal</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {GOALS.map(g => (
            <TouchableOpacity 
              key={g} 
              style={[styles.chip, form.primaryGoal === g && styles.chipActive]}
              onPress={() => setForm({ ...form, primaryGoal: g })}
            >
              <Text style={[styles.chipText, form.primaryGoal === g && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Experience Level</Text>
        <View style={styles.row}>
          {EXPERIENCES.map(e => (
            <TouchableOpacity 
              key={e} 
              style={[styles.chip, form.experienceLevel === e && styles.chipActive]}
              onPress={() => setForm({ ...form, experienceLevel: e })}
            >
              <Text style={[styles.chipText, form.experienceLevel === e && styles.chipTextActive]}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Training Days</Text>
        <View style={styles.row}>
          {DAYS.map(d => {
            const isActive = form.daysPerWeek.includes(d.value);
            return (
              <TouchableOpacity 
                key={d.value} 
                style={[styles.dayCircle, isActive && styles.dayCircleActive]}
                onPress={() => toggleDay(d.value)}
              >
                <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{d.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Target Duration (min)</Text>
        <View style={styles.row}>
          {DURATIONS.map(d => (
            <TouchableOpacity 
              key={d} 
              style={[styles.chip, form.sessionDuration === d && styles.chipActive]}
              onPress={() => setForm({ ...form, sessionDuration: d })}
            >
              <Text style={[styles.chipText, form.sessionDuration === d && styles.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Preferred Split</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {SPLITS.map(s => (
            <TouchableOpacity 
              key={s} 
              style={[styles.chip, form.splitPreference === s && styles.chipActive]}
              onPress={() => setForm({ ...form, splitPreference: s })}
            >
              <Text style={[styles.chipText, form.splitPreference === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Available Equipment</Text>
        <View style={styles.wrap}>
          {EQUIPMENT.map(eq => {
            const isActive = form.equipment.includes(eq);
            return (
              <TouchableOpacity 
                key={eq} 
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => toggleEquipment(eq)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{eq}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Injuries or Limitations</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. sensitive lower back, bad knees..."
          placeholderTextColor={Colors.textMuted}
          value={form.limitations}
          onChangeText={(t) => setForm({ ...form, limitations: t })}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
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
  backButton: {
    width: 40,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: Typography.bold,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayCircleActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  dayText: {
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  dayTextActive: {
    color: '#fff',
    fontWeight: Typography.bold,
  },
  input: {
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: 24,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
});
