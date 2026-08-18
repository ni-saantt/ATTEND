import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useSubjects } from '@/lib/queries';
import { GlassCard, IconBadge } from '@/components/ui';
import { useThemeColors, spacing, typography } from '@/theme';

export default function ManageSectionsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();

  const isDeptAdmin = user?.role === 'DEPARTMENT_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN';
  const departmentId = user?.department_id ?? null;

  const { data: subjects = [] } = useSubjects(departmentId, false);

  if (!isDeptAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
            Only Department Admins can manage sections.
          </Text>
        </GlassCard>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>Manage Sections</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Create sections and assign teachers
      </Text>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SELECT SUBJECT</Text>
      <GlassCard style={styles.listCard} variant="solid">
        {subjects.map((subject: any, index: number) => (
          <TouchableOpacity
            key={subject.id}
            style={[
              styles.listItem,
              { borderBottomColor: colors.border },
              index === subjects.length - 1 && styles.lastItem,
            ]}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/manage-sections-detail',
                params: { subjectId: subject.id, subjectName: subject.name },
              })
            }
            activeOpacity={0.7}
          >
            <IconBadge variant="secondary" size="md">
              <Ionicons name="book-outline" size={20} color={colors.textMuted} />
            </IconBadge>
            <Text style={[styles.listItemText, { color: colors.textPrimary }]}>{subject.name}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
        {subjects.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No subjects found</Text>
        )}
      </GlassCard>

      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={[styles.backLinkText, { color: colors.primary }]}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  title: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.body, marginBottom: spacing.xl },
  restrictedText: { ...typography.body, textAlign: 'center' },
  sectionLabel: { ...typography.caption, letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.lg },
  listCard: { padding: 0 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, gap: spacing.md },
  lastItem: { borderBottomWidth: 0 },
  listItemText: { ...typography.body, flex: 1 },
  emptyText: { ...typography.body, textAlign: 'center', padding: spacing.xl },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl, gap: spacing.sm },
  backLinkText: { ...typography.body, fontWeight: '500' },
});
