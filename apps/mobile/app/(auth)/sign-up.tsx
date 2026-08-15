import { StyleSheet, View, Text, Image, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout';
import { GlassCard, GlassButton, IconBadge } from '@/components/ui';
import { useThemeColors, spacing, typography } from '@/theme';

const logoDark = require('@/assets/images/logo-dark.png');
const logoLight = require('@/assets/images/logo-light.png');

export default function SignUpScreen() {
  const colors = useThemeColors();
  const isDark = useColorScheme() !== 'light';

  return (
    <ScreenContainer safeBottom>
      <View style={styles.container}>
        <Image source={isDark ? logoDark : logoLight} style={styles.logo} resizeMode="contain" />

        <GlassCard style={styles.card}>
          <IconBadge variant="primary" size="lg" style={styles.iconBadge}>
            <Ionicons name="information-circle" size={28} color={colors.primary} />
          </IconBadge>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Attend accounts are created by your administrator. Contact your
            department admin or college admin to get an account.
          </Text>

          <Text style={[styles.note, { color: colors.textMuted }]}>
            Teachers and admins are added by their department or college
            administrator.
          </Text>
        </GlassCard>

        <GlassButton
          variant="primary"
          size="lg"
          onPress={() => router.back()}
          style={styles.button}
        >
          Back to Sign In
        </GlassButton>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 60,
    marginBottom: spacing.xxl,
  },
  card: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  iconBadge: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  note: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});
