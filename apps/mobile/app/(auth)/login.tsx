import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  View,
  Text,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, API_BASE, ENDPOINTS } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { loginSchema, loginResponseSchema } from '@attend/shared';
import { ScreenContainer } from '@/components/layout';
import { GlassButton, GlassInput } from '@/components/ui';
import { useThemeColors, spacing, typography } from '@/theme';

const logoDark = require('@/assets/images/logo-dark.png');
const logoLight = require('@/assets/images/logo-light.png');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

  const testConnection = async () => {
    try {
      const { data } = await api.get('/health', { timeout: 10000 });
      Alert.alert(
        'Connection OK',
        `Backend at ${API_BASE} responded: ${JSON.stringify(data)}`
      );
    } catch (e: any) {
      const isTimeout = e?.code === 'ECONNABORTED' || e?.message?.toLowerCase().includes('timeout');
      const msg = e?.response
        ? `Server error: ${e.response.status}`
        : isTimeout
          ? `Timed out. Using: ${API_BASE}\n\nStart backend (npm run dev), same WiFi. Or set EXPO_PUBLIC_API_URL in apps/mobile/.env`
          : `Cannot reach: ${API_BASE}\n\n1) npm run dev (backend on :8000)\n2) Phone & computer on same WiFi\n3) Restart Expo: npx expo start --clear\n4) Or set EXPO_PUBLIC_API_URL in apps/mobile/.env`;
      Alert.alert('Connection Failed', msg);
    }
  };

  const handleLogin = async () => {
    setFieldError(null);
    const parseResult = loginSchema.safeParse({ email, password });
    if (!parseResult.success) {
      const msg = parseResult.error.errors[0]?.message ?? 'Invalid input';
      setFieldError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }
    setLoading(true);
    const safetyTimer = setTimeout(() => setLoading(false), 20000);
    try {
      const { data } = await api.post(ENDPOINTS.LOGIN, parseResult.data, {
        timeout: 25000, // allow time on slow networks; backend must be reachable at API_BASE (see Test connection)
      });
      const parsed = loginResponseSchema.parse(data);
      setAuth(parsed.access_token, parsed.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e?.name === 'ZodError') {
        Alert.alert('Error', 'Invalid response from server');
      } else if (
        e?.response?.status === 403 &&
        e?.response?.data?.detail === 'email_not_verified'
      ) {
        router.replace({ pathname: '/(auth)/verify-email', params: { email } });
      } else if (!e?.response) {
        const isTimeout =
          e?.code === 'ECONNABORTED' ||
          e?.message?.toLowerCase().includes('timeout');
        const msg = isTimeout
          ? `Request timed out. Backend: ${API_BASE}\n\n1) npm run dev  2) Same WiFi  3) Tap "Test connection"`
          : `Could not reach ${API_BASE}. Same WiFi? Run npm run dev. Try "Test connection".`;
        Alert.alert('Connection Failed', msg);
      } else {
        Alert.alert(
          'Login Failed',
          e.response?.data?.detail || 'Invalid email or password'
        );
      }
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  return (
    <ScreenContainer safeBottom>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.inner}>
          <Image 
            source={isDark ? logoDark : logoLight} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Attendance, Automated
          </Text>

          <View style={styles.form}>
            <GlassInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textMuted}
                />
              }
            />
            <GlassInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textMuted}
                />
              }
            />

            {fieldError && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {fieldError}
              </Text>
            )}

            <GlassButton
              variant="primary"
              size="lg"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.signInButton}
            >
              Sign In
            </GlassButton>

            <GlassButton
              variant="ghost"
              size="md"
              onPress={() => router.push('/(auth)/sign-up')}
            >
              Create account
            </GlassButton>

            <GlassButton
              variant="ghost"
              size="sm"
              onPress={testConnection}
              textStyle={styles.testConnectionText}
            >
              Test connection
            </GlassButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 70,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  signInButton: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  testConnectionText: {
    opacity: 0.5,
    fontSize: 14,
  },
});
