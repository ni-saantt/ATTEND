import { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
  View,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useColleges, useDepartments } from '@/lib/queries';
import { GlassCard, GlassButton, GlassInput, IconBadge } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography, borderRadius } from '@/theme';

export default function EnrollScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [collegeModalOpen, setCollegeModalOpen] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);

  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';
  const effectiveCollegeId = collegeId || user?.college_id || '';
  const { data: colleges = [] } = useColleges(isPlatformAdmin);
  const { data: departments = [] } = useDepartments(
    isPlatformAdmin ? collegeId || null : user?.college_id || null
  );

  useEffect(() => {
    if (user?.college_id && !isPlatformAdmin) setCollegeId(user.college_id);
  }, [user?.college_id, isPlatformAdmin]);

  useEffect(() => {
    if (
      user?.department_id &&
      (user?.role === 'DEPARTMENT_ADMIN' || user?.role === 'TEACHER')
    )
      setDepartmentId(user.department_id);
  }, [user?.department_id, user?.role]);

  useEffect(() => {
    if (isPlatformAdmin && !collegeId) setDepartmentId('');
  }, [collegeId, isPlatformAdmin]);

  const selectedCollege = colleges.find((c) => c.id === effectiveCollegeId);
  const selectedDept = departments.find((d) => d.id === departmentId);
  const isDeptAdmin = user?.role === 'DEPARTMENT_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isSuperAdmin =
    String(user?.role ?? '').toUpperCase() === 'SUPER_ADMIN';

  const canProceedFromStep1 = effectiveCollegeId && departmentId;

  const handleContinueFromStep1 = () => {
    if (!canProceedFromStep1) return;
    setStep(2);
  };

  const handleEnroll = () => {
    setFieldError(null);
    const effectiveDeptId = departmentId || user?.department_id || '';
    const trimmedRegNo = regNo.trim();
    const trimmedName = name.trim();
    if (!trimmedRegNo || !trimmedName) {
      setFieldError('Registration number and name are required');
      Alert.alert(
        'Validation Error',
        'Please enter registration number and name.'
      );
      return;
    }
    if (!effectiveCollegeId || !effectiveDeptId) {
      setFieldError('Department is required');
      return;
    }
    const params = new URLSearchParams({
      reg_no: trimmedRegNo,
      name: trimmedName,
      college_id: effectiveCollegeId,
      department_id: effectiveDeptId,
    });
    router.push(`/(tabs)/enroll-camera?${params.toString()}`);
  };

  if (
    user?.role !== 'DEPARTMENT_ADMIN' &&
    user?.role !== 'SUPER_ADMIN' &&
    user?.role !== 'PLATFORM_ADMIN' &&
    user?.role !== 'TEACHER'
  ) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
            Only admins and teachers can enroll students.
          </Text>
        </GlassCard>
      </View>
    );
  }

  if (step === 1) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionsRow}>
          {isSuperAdmin && (
            <TouchableOpacity
              style={[styles.quickAction, styles.quickActionSuccess]}
              onPress={() => router.push('/(tabs)/create-department-admin')}
            >
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={colors.success}
              />
              <Text style={[styles.quickActionText, { color: colors.success }]}>
                Create Dept Admin
              </Text>
            </TouchableOpacity>
          )}
          {isDeptAdmin && (
            <TouchableOpacity
              style={[styles.quickAction, styles.quickActionInfo]}
              onPress={() => router.push('/(tabs)/create-teacher')}
            >
              <Ionicons name="school" size={18} color={colors.info} />
              <Text style={[styles.quickActionText, { color: colors.info }]}>
                Add Teacher
              </Text>
            </TouchableOpacity>
          )}
          {!isTeacher && (
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/student-list')}
            >
              <Ionicons name="people" size={18} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.primary }]}>
                View Students
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Step 1: Select Department</Text>
        <Text style={[styles.stepHint, { color: colors.textMuted }]}>
          Choose the department first. You can add student details next.
        </Text>

        <GlassCard style={styles.formCard}>
          {isPlatformAdmin && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>College</Text>
              <TouchableOpacity
                style={[styles.select, { backgroundColor: colors.surfaceGlass, borderColor: colors.borderGlass }]}
                onPress={() => setCollegeModalOpen(true)}
              >
                <Text style={[styles.selectText, { color: colors.textPrimary }]}>
                  {selectedCollege?.name ?? 'Select college'}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </>
          )}

          <Text style={[styles.label, { color: colors.textSecondary }]}>Department</Text>
          {isDeptAdmin || isTeacher ? (
            <View style={[styles.selectReadonly, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
              <Text style={[styles.selectText, { color: colors.textPrimary }]}>
                {selectedDept?.name ?? '—'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.select,
                { backgroundColor: colors.surfaceGlass, borderColor: colors.borderGlass },
                !effectiveCollegeId && styles.selectDisabled,
              ]}
              onPress={() => effectiveCollegeId && setDeptModalOpen(true)}
              disabled={!effectiveCollegeId}
            >
              <Text style={[styles.selectText, { color: colors.textPrimary }]}>
                {selectedDept?.name ??
                  (effectiveCollegeId
                    ? 'Select department'
                    : 'Select college first')}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </GlassCard>

        <GlassButton
          variant="primary"
          size="lg"
          onPress={handleContinueFromStep1}
          disabled={!canProceedFromStep1}
          style={styles.continueButton}
        >
          Continue
        </GlassButton>

        <Modal visible={collegeModalOpen} transparent animationType="slide">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setCollegeModalOpen(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select College</Text>
              <FlatList
                data={colleges}
                keyExtractor={(c) => c.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setCollegeId(item.id);
                      setCollegeModalOpen(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: colors.textPrimary }]}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
              <GlassButton
                variant="ghost"
                size="md"
                onPress={() => setCollegeModalOpen(false)}
              >
                Cancel
              </GlassButton>
            </View>
          </Pressable>
        </Modal>

        <Modal visible={deptModalOpen} transparent animationType="slide">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setDeptModalOpen(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Department</Text>
              <FlatList
                data={departments}
                keyExtractor={(d) => d.id}
                renderItem={({ item }) => (
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backLink} onPress={() => setStep(1)}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={[styles.backLinkText, { color: colors.primary }]}>Change department</Text>
      </TouchableOpacity>

      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Step 2: Student Details</Text>
      <View style={styles.deptBadge}>
        <Ionicons name="school-outline" size={16} color={colors.primary} />
        <Text style={[styles.deptBadgeText, { color: colors.primary }]}>{selectedDept?.name}</Text>
      </View>

      <GlassCard style={styles.formCard}>
        <GlassInput
          label="Registration No"
          value={regNo}
          onChangeText={setRegNo}
          placeholder="e.g. 2024001"
          leftIcon={
            <Ionicons
              name="card-outline"
              size={20}
              color={colors.textMuted}
            />
          }
        />
        <GlassInput
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Student name"
          leftIcon={
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.textMuted}
            />
          }
        />
        {fieldError && <Text style={[styles.error, { color: colors.error }]}>{fieldError}</Text>}
      </GlassCard>

      <GlassButton
        variant="primary"
        size="lg"
        onPress={handleEnroll}
        loading={loading}
        disabled={loading}
        style={styles.continueButton}
        leftIcon={<Ionicons name="camera" size={20} color={colors.textOnPrimary} />}
      >
        Enroll (Open Camera)
      </GlassButton>
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
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    borderRadius: borderRadius.sm,
  },
  quickActionSuccess: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  quickActionInfo: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  quickActionText: {
    ...typography.buttonSmall,
  },
  stepTitle: {
    ...typography.h3,
    color: staticColors.textPrimary,
    marginBottom: spacing.sm,
  },
  stepHint: {
    ...typography.body,
    color: staticColors.textMuted,
    marginBottom: spacing.xl,
  },
  formCard: {
    marginBottom: spacing.lg,
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
  selectReadonly: {
    backgroundColor: staticColors.surfaceGlass,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: staticColors.border,
    padding: spacing.md,
    opacity: 0.7,
  },
  selectDisabled: {
    opacity: 0.5,
  },
  selectText: {
    ...typography.body,
    color: staticColors.textPrimary,
  },
  continueButton: {
    marginTop: spacing.lg,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  backLinkText: {
    ...typography.body,
    color: staticColors.primary,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  deptBadgeText: {
    ...typography.bodySmall,
    color: staticColors.primary,
  },
  error: {
    ...typography.caption,
    color: staticColors.error,
    marginTop: spacing.sm,
  },
  restrictedText: {
    ...typography.body,
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
