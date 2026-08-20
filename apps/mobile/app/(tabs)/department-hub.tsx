import { StyleSheet, TouchableOpacity, ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { GlassCard, IconBadge } from '@/components/ui';
import { useThemeColors, spacing, typography } from '@/theme';

type HubAction = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  route: string;
  variant?: 'primary' | 'success' | 'info';
};

export default function DepartmentHubScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();

  const isDeptAdmin = user?.role === 'DEPARTMENT_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN';

  const rosterActions: HubAction[] = [];
  rosterActions.push(
    { icon: 'people', title: 'View Students', subtitle: 'By department', route: '/(tabs)/student-list', variant: 'info' },
    { icon: 'school', title: 'View Teachers', subtitle: 'All teachers in department', route: '/(tabs)/teacher-list', variant: 'info' }
  );
  if (isDeptAdmin || user?.role === 'TEACHER') {
    rosterActions.push({
      icon: 'people-outline',
      title: 'Section Students',
      subtitle: 'Manage students in your sections',
      route: '/(tabs)/section-students',
      variant: 'info',
    });
  }

  const setupActions: HubAction[] = [];
  if (isDeptAdmin) {
    setupActions.push(
      { icon: 'grid-outline', title: 'Manage Sections', subtitle: 'Create sections & assign teachers', route: '/(tabs)/manage-sections', variant: 'info' },
      { icon: 'person-add', title: 'Add Teacher', subtitle: 'Create teacher account', route: '/(tabs)/create-teacher', variant: 'info' }
    );
  }

  const renderRow = (action: HubAction, index: number, total: number) => (
    <TouchableOpacity
      key={action.route}
      style={[
        styles.row,
        { borderBottomColor: colors.border },
        index === total - 1 && styles.rowLast,
      ]}
      onPress={() => router.push(action.route as any)}
      activeOpacity={0.7}
    >
      <IconBadge variant={action.variant || 'secondary'} size="md" style={styles.rowIcon}>
        <Ionicons
          name={action.icon}
          size={20}
          color={action.variant === 'info' ? colors.info : colors.textSecondary}
        />
      </IconBadge>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{action.title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{action.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.textPrimary }]}>My department</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Roster, sections & teachers
      </Text>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ROSTER</Text>
      <GlassCard style={styles.card} variant="solid">
        {rosterActions.map((a, i) => renderRow(a, i, rosterActions.length))}
      </GlassCard>

      {setupActions.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SETUP</Text>
          <GlassCard style={styles.card} variant="solid">
            {setupActions.map((a, i) => renderRow(a, i, setupActions.length))}
          </GlassCard>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  backBtnText: { ...typography.body, fontWeight: '500' },
  title: { ...typography.h1, marginBottom: spacing.xs },
  subtitle: { ...typography.body, marginBottom: spacing.xl },
  sectionLabel: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  card: { padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { marginRight: spacing.md },
  rowText: { flex: 1 },
  rowTitle: { ...typography.body, fontWeight: '600' },
  rowSubtitle: { ...typography.caption, marginTop: 2 },
});
