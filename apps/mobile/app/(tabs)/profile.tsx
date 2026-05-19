import { StyleSheet, TouchableOpacity, Image, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { GlassCard, GlassButton, IconBadge } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography, shadows } from '@/theme';

const logoDark = require('@/assets/images/logo-dark.png');

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const colors = useThemeColors();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const getRoleBadge = (role: string | undefined) => {
    switch (role?.toUpperCase()) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', color: colors.success };
      case 'DEPARTMENT_ADMIN':
        return { label: 'Department Admin', color: colors.info };
      case 'TEACHER':
        return { label: 'Teacher', color: colors.primary };
      case 'PLATFORM_ADMIN':
        return { label: 'Platform Admin', color: colors.warning };
      default:
        return { label: role || 'User', color: colors.textMuted };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Image source={logoDark} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity
          style={[styles.avatarContainer, shadows.glow]}
          onPress={() => router.push('/(tabs)/profile-card')}
          activeOpacity={0.8}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary, borderColor: colors.glow }]}>
            <Text style={[styles.initials, { color: colors.textOnPrimary }]}>{initials}</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email}</Text>

        <View style={[styles.roleBadge, { backgroundColor: `${roleBadge.color}20` }]}>
          <Text style={[styles.roleText, { color: roleBadge.color }]}>
            {roleBadge.label}
          </Text>
        </View>
      </View>

      <GlassCard style={styles.actionsCard} variant="solid">
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => router.push('/(tabs)/profile-card')}
          activeOpacity={0.7}
        >
          <IconBadge variant="primary" size="md">
            <Ionicons name="person-outline" size={20} color={colors.primary} />
          </IconBadge>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>View Profile Card</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>See your full profile details</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => router.push('/(tabs)/profile-edit')}
          activeOpacity={0.7}
        >
          <IconBadge variant="secondary" size="md">
            <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
          </IconBadge>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>Update your information</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </GlassCard>

      <GlassButton
        variant="ghost"
        size="md"
        onPress={() => {
          logout();
          router.replace('/(auth)/login');
        }}
        style={styles.logoutButton}
        textStyle={styles.logoutText}
        leftIcon={<Ionicons name="log-out-outline" size={20} color={colors.error} />}
      >
        Sign Out
      </GlassButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  logo: {
    width: 120,
    height: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarContainer: {
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: staticColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: staticColors.glow,
  },
  initials: {
    color: staticColors.textOnPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    ...typography.h2,
    color: staticColors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    color: staticColors.textMuted,
    marginBottom: spacing.md,
  },
  roleBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
  },
  roleText: {
    ...typography.buttonSmall,
  },
  actionsCard: {
    padding: 0,
    marginBottom: spacing.xl,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  actionDivider: {
    height: 1,
    backgroundColor: staticColors.border,
    marginHorizontal: spacing.lg,
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionTitle: {
    ...typography.body,
    color: staticColors.textPrimary,
    fontWeight: '500',
  },
  actionSubtitle: {
    ...typography.caption,
    color: staticColors.textMuted,
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 'auto',
  },
  logoutText: {
    color: staticColors.error,
  },
});
