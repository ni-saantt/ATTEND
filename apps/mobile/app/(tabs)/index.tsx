import { useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@attend/shared';
import { userSchema } from '@attend/shared';
import { GlassCard, GlassButton, IconBadge } from '@/components/ui';
import { useThemeColors, spacing, typography, shadows } from '@/theme';

type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  route: string;
  highlight?: boolean;
  variant?: 'primary' | 'success' | 'info';
};

export default function DashboardScreen() {
  const { user, setAuth, token } = useAuthStore();
  const displayUser = user;
  const colors = useThemeColors();

  useEffect(() => {
    if (!token) return;
    api
      .get(ENDPOINTS.ME)
      .then(({ data }) => {
        const parsed = userSchema.safeParse(data);
        if (parsed.success) {
          setAuth(token!, parsed.data);
        }
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (
      displayUser &&
      (!displayUser.name?.trim() || !displayUser.contact_number?.trim())
    ) {
      router.replace('/(tabs)/profile-edit');
    }
  }, [displayUser]);

  const isSuperAdmin =
    String(displayUser?.role ?? '').toUpperCase() === 'SUPER_ADMIN';
  const isDeptAdmin =
    String(displayUser?.role ?? '').toUpperCase() === 'DEPARTMENT_ADMIN';
  const isTeacher =
    String(displayUser?.role ?? '').toUpperCase() === 'TEACHER';

  const quickActions: QuickAction[] = [
    {
      icon: 'camera',
      title: 'Take Attendance',
      subtitle: 'Start a new session',
      route: '/(tabs)/attendance',
      highlight: true,
      variant: 'primary',
    },
    {
      icon: 'person-add',
      title: 'Enroll Student',
      subtitle: 'Add new student',
      route: '/(tabs)/enroll',
    },
    {
      icon: 'bar-chart',
      title: 'View Reports',
      subtitle: 'Check attendance data',
      route: '/(tabs)/reports',
    },
  ];

  const adminActions: QuickAction[] = [];
  if (isSuperAdmin) {
    adminActions.push({
      icon: 'shield-checkmark',
      title: 'Create Department Admin',
      subtitle: 'Add new admin',
      route: '/(tabs)/create-department-admin',
      variant: 'success',
    });
  }
  if (isDeptAdmin) {
    adminActions.push(
      {
        icon: 'school',
        title: 'Add Teacher',
        subtitle: 'Create teacher account',
        route: '/(tabs)/create-teacher',
        variant: 'info',
      },
      {
        icon: 'grid-outline',
        title: 'Manage Sections',
        subtitle: 'Create sections & assign teachers',
        route: '/(tabs)/manage-sections',
        variant: 'info',
      }
    );
  }
  if (isTeacher) {
    adminActions.push({
      icon: 'people-outline',
      title: 'Section Students',
      subtitle: 'Manage students in your sections',
      route: '/(tabs)/section-students',
      variant: 'info',
    });
  }

  const renderActionCard = (action: QuickAction, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.actionCard,
        { borderBottomColor: colors.border },
        action.highlight && { backgroundColor: 'rgba(0, 200, 83, 0.05)' },
        action.highlight && shadows.glow,
      ]}
      onPress={() => router.push(action.route as any)}
      activeOpacity={0.8}
    >
      <IconBadge
        variant={action.variant || 'secondary'}
        size="lg"
        style={styles.actionIcon}
      >
        <Ionicons
          name={action.icon}
          size={24}
          color={
            action.variant === 'primary'
              ? colors.primary
              : action.variant === 'success'
              ? colors.success
              : action.variant === 'info'
              ? colors.info
              : colors.textSecondary
          }
        />
      </IconBadge>
      <View style={styles.actionTextContainer}>
        <Text
          style={[
            styles.actionTitle,
            { color: colors.textPrimary },
            action.highlight && { color: colors.primary },
          ]}
        >
          {action.title}
        </Text>
        <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
          {action.subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={action.highlight ? colors.primary : colors.textMuted}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {displayUser?.name || displayUser?.email}
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          QUICK ACTIONS
        </Text>
        <GlassCard style={styles.actionsContainer} variant="solid">
          {quickActions.map(renderActionCard)}
        </GlassCard>

        {adminActions.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              ADMIN ACTIONS
            </Text>
            <GlassCard style={styles.actionsContainer} variant="solid">
              {adminActions.map(renderActionCard)}
            </GlassCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  welcomeSection: {
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  greeting: {
    ...typography.body,
  },
  userName: {
    ...typography.h1,
  },
  sectionLabel: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  actionsContainer: {
    padding: 0,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  actionIcon: {
    marginRight: spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  actionSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
});
