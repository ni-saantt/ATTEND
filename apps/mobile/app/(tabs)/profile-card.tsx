import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { GlassButton } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography, shadows } from '@/theme';

function formatRole(role: string) {
  return role.replace(/_/g, ' ');
}

export default function ProfileCardScreen() {
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

  const infoItems = [
    {
      icon: 'school-outline' as const,
      label: 'Institution',
      value: user?.college_name,
    },
    {
      icon: 'mail-outline' as const,
      label: 'Email',
      value: user?.email,
    },
    {
      icon: 'call-outline' as const,
      label: 'Phone',
      value: user?.contact_number,
    },
    {
      icon: 'business-outline' as const,
      label: 'Department',
      value: user?.department_name,
    },
  ].filter(item => item.value);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, shadows.glow, { backgroundColor: colors.primary }]}>
          <Text style={[styles.initials, { color: colors.textOnPrimary }]}>{initials}</Text>
        </View>
        
        <Text style={[styles.name, { color: colors.textPrimary }]}>
          {user?.name || '—'}
        </Text>
        
        <View style={[styles.roleBadge, { backgroundColor: `${colors.primary}15` }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>
            {user?.role ? formatRole(user.role) : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          ACCOUNT DETAILS
        </Text>
        
        {infoItems.map((item, index) => (
          <View 
            key={index} 
            style={[
              styles.infoItem, 
              { borderBottomColor: colors.border },
              index === infoItems.length - 1 && styles.lastItem
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                {item.label}
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <GlassButton
          variant="primary"
          size="md"
          onPress={() => router.push('/(tabs)/profile-edit')}
          style={styles.editButton}
          leftIcon={<Ionicons name="create-outline" size={18} color={colors.textOnPrimary} />}
        >
          Edit Profile
        </GlassButton>

        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={() => {
            logout();
            router.replace('/(auth)/login');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  initials: {
    fontSize: 36,
    fontWeight: '700',
  },
  name: {
    ...typography.h1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  roleBadge: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
  },
  roleText: {
    ...typography.buttonSmall,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '500',
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  editButton: {
    width: '100%',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  signOutText: {
    ...typography.button,
    fontWeight: '600',
  },
});
