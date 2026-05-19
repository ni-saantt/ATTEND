import { StyleSheet, View, Text, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout';
import { GlassCard, GlassButton, IconBadge } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

const logoDark = require('@/assets/images/logo-dark.png');

export default function SignUpScreen() {
  return (
    <ScreenContainer safeBottom>
      <View style={styles.container}>
        <Image source={logoDark} style={styles.logo} resizeMode="contain" />

        <GlassCard style={styles.card}>
          <IconBadge variant="primary" size="lg" style={styles.iconBadge}>
            <Ionicons name="information-circle" size={28} color={colors.primary} />
          </IconBadge>

          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.subtitle}>
            Attend accounts are created by your administrator. Contact your
            department admin or college admin to get an account.
          </Text>

          <Text style={styles.note}>
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
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  note: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});
