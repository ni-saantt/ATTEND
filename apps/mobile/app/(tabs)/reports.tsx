import { useRouter } from 'expo-router';
import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  View,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useSubjectsWithReports } from '@/lib/queries';
import { GlassCard, IconBadge } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography } from '@/theme';

export default function ReportsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const departmentId = user?.department_id ?? null;
  const { data: subjects = [], isLoading } = useSubjectsWithReports(departmentId);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Attendance Reports</Text>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>Attendance Reports</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {subjects.length === 0
          ? 'No attendance data yet. Reports appear after you capture attendance.'
          : 'Tap a subject to view attendance by date'}
      </Text>

      {subjects.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <IconBadge variant="secondary" size="lg" style={styles.emptyIcon}>
            <Ionicons
              name="document-text-outline"
              size={28}
              color={colors.textMuted}
            />
          </IconBadge>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Reports Yet</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Start taking attendance to see reports here
          </Text>
        </GlassCard>
      ) : (
        <GlassCard style={styles.subjectsCard} variant="solid">
          {subjects.map((s, index) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.subjectItem,
                index < subjects.length - 1 && styles.subjectItemBorder,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/reports-detail',
                  params: { subjectId: s.id, subjectName: s.name },
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.subjectInfo}>
                <IconBadge variant="primary" size="md">
                  <Ionicons
                    name="bar-chart-outline"
                    size={20}
                    color={colors.primary}
                  />
                </IconBadge>
                <Text style={[styles.subjectName, { color: colors.textPrimary }]}>{s.name}</Text>
              </View>
              <View style={styles.viewContainer}>
                <Text style={[styles.viewText, { color: colors.primary }]}>View</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>
          ))}
        </GlassCard>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  title: {
    ...typography.h1,
    color: staticColors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: staticColors.textMuted,
    marginBottom: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: staticColors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: staticColors.textMuted,
    textAlign: 'center',
  },
  subjectsCard: {
    padding: 0,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  subjectItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  subjectName: {
    ...typography.body,
    color: staticColors.textPrimary,
    fontWeight: '500',
  },
  viewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewText: {
    ...typography.bodySmall,
    color: staticColors.primary,
  },
});
