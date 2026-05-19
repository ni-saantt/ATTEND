import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@attend/shared';
import { userSchema } from '@attend/shared';
import { GlassCard, GlassButton, GlassInput, IconBadge } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography } from '@/theme';

export default function CreateTeacherScreen() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setEmail('');
      setPassword('');
      setName('');
      setLoading(false);
    }, [])
  );

  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }
    api
      .get(ENDPOINTS.ME)
      .then(({ data }) => {
        const parsed = userSchema.safeParse(data);
        if (parsed.success) setAuth(token!, parsed.data);
      })
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, [token]);

  const collegeId = user?.college_id ?? '';
  const departmentId = user?.department_id ?? '';
  const userRole = String(user?.role ?? '').toUpperCase();
  const canAddTeacher = userRole === 'DEPARTMENT_ADMIN' || userRole === 'SUPER_ADMIN';

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Validation Error', 'Email and password are required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        'Validation Error',
        'Password must be at least 6 characters.'
      );
      return;
    }
    if (!departmentId) {
      Alert.alert(
        'Validation Error',
        'You must be assigned to a department to add teachers.'
      );
      return;
    }
    setLoading(true);
    try {
      await api.post(ENDPOINTS.USERS, {
        email: trimmedEmail,
        password,
        role: 'TEACHER',
        college_id: collegeId,
        department_id: departmentId,
        name: trimmedName || undefined,
      });
      Alert.alert(
        'Success',
        'Teacher created. They will receive a verification email.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      Alert.alert(
        'Failed',
        ax?.response?.data?.detail ?? 'Could not create teacher.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!canAddTeacher) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
            Only Department Admin can add teachers.
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
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
      </TouchableOpacity>

      <View style={styles.headerSection}>
        <IconBadge variant="info" size="lg" style={styles.headerIcon}>
          <Ionicons name="school" size={28} color={colors.info} />
        </IconBadge>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Add Teacher</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Assign a Teacher to take attendance in your department
        </Text>
      </View>

      <GlassCard style={styles.formCard}>
        <GlassInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="teacher@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
          }
        />
        <GlassInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Min 6 characters"
          secureTextEntry
          leftIcon={
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textMuted}
            />
          }
        />
        <GlassInput
          label="Name (optional)"
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          leftIcon={
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.textMuted}
            />
          }
        />
      </GlassCard>

      <GlassButton
        variant="primary"
        size="lg"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        leftIcon={
          <Ionicons name="add-circle" size={20} color={colors.textOnPrimary} />
        }
      >
        Add Teacher
      </GlassButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  backBtnText: {
    ...typography.body,
    color: staticColors.primary,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerIcon: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: staticColors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: staticColors.textMuted,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: spacing.xl,
  },
  restrictedText: {
    ...typography.body,
    color: staticColors.textSecondary,
    textAlign: 'center',
  },
});
