import { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  Pressable,
  View,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useDepartments } from '@/lib/queries';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@attend/shared';
import { userSchema } from '@attend/shared';
import { GlassCard, GlassButton, GlassInput, IconBadge } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography, borderRadius } from '@/theme';

export default function CreateDepartmentAdminScreen() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  const colors = useThemeColors();

  useEffect(() => {
    if (!token) return;
    api
      .get(ENDPOINTS.ME)
      .then(({ data }) => {
        const parsed = userSchema.safeParse(data);
        if (parsed.success) setAuth(token!, parsed.data);
      })
      .catch(() => {});
  }, [token]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);

  const collegeId = user?.college_id ?? '';
  const { data: departments = [] } = useDepartments(collegeId || null);
  const selectedDept = departments.find(
    (d: { id: string }) => d.id === departmentId
  );

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
      Alert.alert('Validation Error', 'Please select a department.');
      return;
    }
    setLoading(true);
    try {
      await api.post(ENDPOINTS.USERS, {
        email: trimmedEmail,
        password,
        role: 'DEPARTMENT_ADMIN',
        college_id: collegeId,
        department_id: departmentId,
        name: trimmedName || undefined,
      });
      Alert.alert(
        'Success',
        'Department Admin created. They will receive a verification email.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      Alert.alert(
        'Failed',
        ax?.response?.data?.detail ?? 'Could not create user.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (String(user?.role ?? '').toUpperCase() !== 'SUPER_ADMIN') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
            Only Super Admin can create Department Admins.
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
        <IconBadge variant="success" size="lg" style={styles.headerIcon}>
          <Ionicons name="shield-checkmark" size={28} color={colors.success} />
        </IconBadge>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Create Department Admin</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Assign a Department Admin to manage a department
        </Text>
      </View>

      <GlassCard style={styles.formCard}>
        <GlassInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="admin@example.com"
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

        <Text style={[styles.label, { color: colors.textSecondary }]}>Department</Text>
        <TouchableOpacity
          style={[styles.select, { backgroundColor: colors.surfaceGlass, borderColor: colors.borderGlass }]}
          onPress={() => setDeptModalOpen(true)}
        >
          <Text style={[styles.selectText, { color: colors.textPrimary }]}>
            {selectedDept?.name ?? 'Select department'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
        </TouchableOpacity>
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
        Create Department Admin
      </GlassButton>

      <Modal visible={deptModalOpen} transparent animationType="slide">
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setDeptModalOpen(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Department</Text>
            <FlatList
              data={departments}
              keyExtractor={(d: { id: string }) => d.id}
              renderItem={({
                item,
              }: {
                item: { id: string; name: string };
              }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setDepartmentId(item.id);
                    setDeptModalOpen(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.textPrimary }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <GlassButton
              variant="ghost"
              size="md"
              onPress={() => setDeptModalOpen(false)}
            >
              Cancel
            </GlassButton>
          </View>
        </Pressable>
      </Modal>
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
  label: {
    ...typography.label,
    color: staticColors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: staticColors.surfaceGlass,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: staticColors.borderGlass,
    padding: spacing.md,
  },
  selectText: {
    ...typography.body,
    color: staticColors.textPrimary,
  },
  restrictedText: {
    ...typography.body,
    color: staticColors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: staticColors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: staticColors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    ...typography.h3,
    color: staticColors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  modalItemText: {
    ...typography.body,
    color: staticColors.textPrimary,
  },
});
