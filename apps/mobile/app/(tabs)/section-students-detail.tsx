import { useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMySections } from '@/lib/queries';
import { GlassCard, IconBadge } from '@/components/ui';
import { useThemeColors, spacing, typography } from '@/theme';

type Section = { id: string; name: string; created_at?: string };
type SubjectWithSections = { subject_id: string; subject_name: string; sections: Section[] };

export default function SectionStudentsDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const raw = useLocalSearchParams<{ subjectId?: string; subjectName?: string }>();
  const subjectId = Array.isArray(raw.subjectId) ? raw.subjectId[0] : raw.subjectId;
  const subjectName = Array.isArray(raw.subjectName) ? raw.subjectName[0] : raw.subjectName ?? 'Subject';

  const { data: mySections = [] } = useMySections();
  const subjectSections = useMemo(() => {
    const found = (mySections as SubjectWithSections[]).find(s => s.subject_id === subjectId);
    return found?.sections ?? [];
  }, [mySections, subjectId]);

  if (!subjectId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Subject not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={[styles.backBtnText, { color: colors.primary }]}>My Sections</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.textPrimary }]}>{subjectName}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Select a section to manage students</Text>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SELECT SECTION</Text>
      <Text style={[styles.sectionHint, { color: colors.textMuted }]}>Tap a section to open and manage its students</Text>
      <GlassCard style={styles.listCard} variant="solid">
        {subjectSections.map((section, index) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionItem,
              { borderBottomColor: colors.border },
              index === subjectSections.length - 1 && styles.lastItem,
            ]}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/section-students-list',
                params: {
                  sectionId: section.id,
                  sectionName: section.name,
                  subjectId: subjectId ?? '',
                  subjectName: subjectName ?? '',
                },
              })
            }
            activeOpacity={0.7}
          >
            <IconBadge variant="secondary" size="md">
              <Text style={[styles.sectionIcon, { color: colors.textMuted }]}>{section.name}</Text>
            </IconBadge>
            <Text style={[styles.sectionItemText, { color: colors.textPrimary }]}>Section {section.name}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
        {subjectSections.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No sections for this subject.</Text>
        )}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xl },
  backBtnText: { ...typography.body, fontWeight: '500' },
  title: { ...typography.h1, marginBottom: spacing.xs },
  subtitle: { ...typography.body, marginBottom: spacing.xl },
  sectionLabel: { ...typography.caption, letterSpacing: 1, marginBottom: spacing.xs, marginTop: spacing.lg },
  sectionHint: { ...typography.caption, marginBottom: spacing.md },
  listCard: { padding: 0 },
  sectionItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, gap: spacing.md },
  sectionIcon: { fontWeight: '700', fontSize: 14 },
  sectionItemText: { ...typography.body, flex: 1 },
  lastItem: { borderBottomWidth: 0 },
  emptyText: { ...typography.body, textAlign: 'center', padding: spacing.xl },
});
