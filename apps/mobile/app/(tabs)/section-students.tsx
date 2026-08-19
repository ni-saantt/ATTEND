import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useMySections } from '@/lib/queries';
import { GlassCard, IconBadge } from '@/components/ui';
import { useThemeColors, spacing, typography } from '@/theme';

type SubjectWithSections = { subject_id: string; subject_name: string; sections: { id: string; name: string }[] };

export default function SectionStudentsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();

  const isTeacher = user?.role === 'TEACHER';
  const isDeptAdmin = user?.role === 'DEPARTMENT_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN';

  const { data: mySections = [], isLoading: sectionsLoading } = useMySections();
  const subjects = (mySections as SubjectWithSections[]) || [];

  if (!isTeacher && !isDeptAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
            Only teachers can manage section students.
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
      <Text style={[styles.title, { color: colors.textPrimary }]}>My Sections</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Manage students in your assigned sections
      </Text>

      {sectionsLoading ? (
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
      ) : subjects.length === 0 ? (
        <GlassCard>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            You are not assigned to any sections yet.
          </Text>
        </GlassCard>
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SELECT SUBJECT</Text>
          <GlassCard style={styles.listCard} variant="solid">
            {subjects.map((subj, index) => (
              <TouchableOpacity
                key={subj.subject_id}
                style={[
                  styles.listItem,
                  { borderBottomColor: colors.border },
                  index === subjects.length - 1 && styles.lastItem,
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/section-students-detail',
                    params: { subjectId: subj.subject_id, subjectName: subj.subject_name },
                  })
                }
                activeOpacity={0.7}
              >
                <IconBadge variant="secondary" size="md">
                  <Ionicons name="book-outline" size={20} color={colors.textMuted} />
                </IconBadge>
                <Text style={[styles.listItemText, { color: colors.textPrimary }]}>{subj.subject_name}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </GlassCard>
        </>
      )}

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
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  restrictedText: {
    ...typography.body,
    textAlign: 'center',
  },
  loadingText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.xl,
  },
  sectionLabel: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  listCard: {
    padding: 0,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  listItemText: {
    ...typography.body,
    flex: 1,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.xl,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  backLinkText: {
    ...typography.body,
    fontWeight: '500',
  },
});
