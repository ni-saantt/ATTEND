import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
  Image,
  View,
  Text,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useDepartments } from '@/lib/queries';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@attend/shared';
import { GlassCard, GlassButton, GlassInput, IconBadge, StatusPill } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography, borderRadius } from '@/theme';

export default function EditStudentScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const [student, setStudent] = useState<{
    id: string;
    reg_no: string;
    name: string;
    college_id: string;
    department_id: string;
    department_name?: string;
    primary_image_url?: string | null;
    left_image_url?: string | null;
    right_image_url?: string | null;
  } | null>(null);
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);

  const collegeId = student?.college_id ?? user?.college_id ?? '';
  const { data: departments = [] } = useDepartments(collegeId || null);
  const selectedDept = departments.find((d) => d.id === departmentId);

  const fetchStudent = useCallback(() => {
    const sid = Array.isArray(studentId) ? studentId[0] : studentId;
    if (!sid) return;
    setLoading(true);
    api
      .get(ENDPOINTS.studentById(sid))
      .then(({ data }) => {
        setStudent(data);
        setRegNo(data.reg_no ?? '');
        setName(data.name ?? '');
        setDepartmentId(data.department_id ?? '');
      })
      .catch(() => Alert.alert('Error', 'Failed to load student'))
      .finally(() => setLoading(false));
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      fetchStudent();
    }, [fetchStudent])
  );

  const handleSave = async () => {
    if (!studentId || !regNo.trim() || !name.trim()) {
      Alert.alert(
        'Validation Error',
        'Registration number and name are required.'
      );
      return;
    }
    setSaving(true);
    try {
      await api.patch(ENDPOINTS.studentById(studentId), {
        reg_no: regNo.trim(),
        name: name.trim(),
        department_id: departmentId || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      Alert.alert('Saved', 'Student details updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      Alert.alert('Error', ax?.response?.data?.detail ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFace = (pose: 'left' | 'right') => {
    const sid = Array.isArray(studentId) ? studentId[0] : studentId;
    if (!sid) return;
    router.push({
      pathname: '/(tabs)/add-face-camera',
      params: { studentId: sid, pose },
    });
  };

  if (loading || !student) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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

      <Text style={[styles.title, { color: colors.textPrimary }]}>Edit Student</Text>

      <GlassCard style={styles.formCard}>
        <GlassInput
          label="Registration No"
          value={regNo}
          onChangeText={setRegNo}
          placeholder="e.g. 2024001"
          leftIcon={
            <Ionicons name="card-outline" size={20} color={colors.textMuted} />
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
        <Text style={[styles.label, { color: colors.textSecondary }]}>Department</Text>
        <TouchableOpacity
          style={styles.select}
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
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        style={styles.saveButton}
      >
        Save Details
      </GlassButton>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Face Images</Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        All three poses improve recognition. Add any that are missing.
      </Text>

      <View style={styles.faceStatusRow}>
        <View
          style={[
            styles.faceBadge,
            student.primary_image_url && styles.faceBadgeComplete,
          ]}
        >
          <Ionicons
            name="person"
            size={20}
            color={student.primary_image_url ? colors.success : colors.textMuted}
          />
          <Text style={[styles.faceBadgeLabel, { color: colors.textSecondary }]}>Front</Text>
          <StatusPill
            label={student.primary_image_url ? 'Done' : 'Missing'}
            variant={student.primary_image_url ? 'success' : 'neutral'}
          />
        </View>
        <View
          style={[
            styles.faceBadge,
            student.left_image_url && styles.faceBadgeComplete,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={student.left_image_url ? colors.success : colors.textMuted}
          />
          <Text style={[styles.faceBadgeLabel, { color: colors.textSecondary }]}>Left</Text>
          <StatusPill
            label={student.left_image_url ? 'Done' : 'Missing'}
            variant={student.left_image_url ? 'success' : 'neutral'}
          />
        </View>
        <View
          style={[
            styles.faceBadge,
            student.right_image_url && styles.faceBadgeComplete,
          ]}
        >
          <Ionicons
            name="arrow-forward"
            size={20}
            color={student.right_image_url ? colors.success : colors.textMuted}
          />
          <Text style={[styles.faceBadgeLabel, { color: colors.textSecondary }]}>Right</Text>
          <StatusPill
            label={student.right_image_url ? 'Done' : 'Missing'}
            variant={student.right_image_url ? 'success' : 'neutral'}
          />
        </View>
      </View>

      {student.primary_image_url && (
        <View style={styles.primaryThumb}>
          <Image
            source={{ uri: student.primary_image_url }}
            style={styles.primaryThumbImg}
          />
          <Text style={[styles.primaryThumbLabel, { color: colors.textMuted }]}>
            Primary (front) – set at enrollment
          </Text>
        </View>
      )}

      <View style={styles.faceActions}>
        <GlassButton
          variant={student.left_image_url ? 'secondary' : 'outline'}
          size="md"
          onPress={() => handleAddFace('left')}
          leftIcon={
            <Ionicons
              name={student.left_image_url ? 'checkmark-circle' : 'add-circle'}
              size={20}
              color={student.left_image_url ? colors.success : colors.primary}
            />
          }
          textStyle={
            student.left_image_url
              ? { color: colors.success }
              : { color: colors.primary }
          }
        >
          {student.left_image_url ? 'Replace Left Face' : 'Add Left Face'}
        </GlassButton>

        <GlassButton
          variant={student.right_image_url ? 'secondary' : 'outline'}
          size="md"
          onPress={() => handleAddFace('right')}
          leftIcon={
            <Ionicons
              name={student.right_image_url ? 'checkmark-circle' : 'add-circle'}
              size={20}
              color={student.right_image_url ? colors.success : colors.primary}
            />
          }
          textStyle={
            student.right_image_url
              ? { color: colors.success }
              : { color: colors.primary }
          }
        >
          {student.right_image_url ? 'Replace Right Face' : 'Add Right Face'}
        </GlassButton>
      </View>

      <Modal visible={deptModalOpen} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDeptModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Department</Text>
            <FlatList
              data={departments}
              keyExtractor={(d) => d.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  title: {
    ...typography.h1,
    color: staticColors.textPrimary,
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
  selectText: {
    ...typography.body,
    color: staticColors.textPrimary,
  },
  saveButton: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: staticColors.textPrimary,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.body,
    color: staticColors.textMuted,
    marginBottom: spacing.lg,
  },
  faceStatusRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  faceBadge: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: staticColors.surfaceGlass,
    borderWidth: 1,
    borderColor: staticColors.border,
    alignItems: 'center',
    gap: spacing.xs,
  },
  faceBadgeComplete: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  faceBadgeLabel: {
    ...typography.caption,
    color: staticColors.textSecondary,
    fontWeight: '600',
  },
  primaryThumb: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  primaryThumbImg: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: staticColors.border,
  },
  primaryThumbLabel: {
    ...typography.caption,
    color: staticColors.textMuted,
    marginTop: spacing.sm,
  },
  faceActions: {
    gap: spacing.md,
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
