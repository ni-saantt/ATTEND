import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  View,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useDepartments, useStudents } from '@/lib/queries';
import { GlassCard } from '@/components/ui';
import { useThemeColors, spacing, typography } from '@/theme';

type Department = { id: string; name: string; college_id: string };
type Student = { id: string; name: string; reg_no: string; department_name?: string };

export default function StudentListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const collegeId = user?.college_id ?? null;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isDeptAdmin = user?.role === 'DEPARTMENT_ADMIN';
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  const { data: departments = [], isLoading: deptLoading } = useDepartments(collegeId);
  const { data: students = [], isLoading: studentsLoading } = useStudents(
    collegeId,
    selectedDeptId,
    !!selectedDeptId
  );

  const canManage = isDeptAdmin || isSuperAdmin || isPlatformAdmin;

  if (!canManage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
            Only admins can view the student list.
          </Text>
        </GlassCard>
      </View>
    );
  }

  const selectedDept = (departments as Department[]).find(d => d.id === selectedDeptId);

  const handleBack = () => {
    if (selectedDeptId) {
      setSelectedDeptId(null);
    } else {
      router.back();
    }
  };

  if (deptLoading) {
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
      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={[styles.backBtnText, { color: colors.primary }]}>
          {selectedDeptId ? 'Departments' : 'Back'}
        </Text>
      </TouchableOpacity>

      {!selectedDeptId ? (
        <>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Departments</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Select a department to view students
          </Text>

          {(departments as Department[]).length === 0 ? (
            <GlassCard>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No departments found.
              </Text>
            </GlassCard>
          ) : (
            <GlassCard style={styles.listCard} variant="solid">
              {(departments as Department[]).map((dept, idx) => (
                <TouchableOpacity
                  key={dept.id}
                  style={[
                    styles.listItem,
                    { borderBottomColor: colors.border },
                    idx === (departments as Department[]).length - 1 && styles.lastItem,
                  ]}
                  onPress={() => setSelectedDeptId(dept.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.deptIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="business-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.deptName, { color: colors.textPrimary }]}>{dept.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </GlassCard>
          )}
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{selectedDept?.name}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {studentsLoading ? 'Loading...' : `${students.length} student(s)`}
          </Text>

          {studentsLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (students as Student[]).length === 0 ? (
            <GlassCard>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No students enrolled in this department.
              </Text>
            </GlassCard>
          ) : (
            <GlassCard style={styles.listCard} variant="solid">
              {(students as Student[]).map((student, idx) => (
                <TouchableOpacity
                  key={student.id}
                  style={[
                    styles.studentItem,
                    { borderBottomColor: colors.border },
                    idx === (students as Student[]).length - 1 && styles.lastItem,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/edit-student',
                      params: { studentId: student.id },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={[styles.serialNumber, { backgroundColor: colors.card }]}>
                    <Text style={[styles.serialText, { color: colors.textMuted }]}>{idx + 1}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.textPrimary }]}>{student.name}</Text>
                    <Text style={[styles.studentReg, { color: colors.textMuted }]}>{student.reg_no}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </GlassCard>
          )}
        </>
      )}
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
  loader: {
    marginTop: spacing.xl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  backBtnText: {
    ...typography.body,
    fontWeight: '500',
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  restrictedText: {
    ...typography.body,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.lg,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  deptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deptName: {
    ...typography.body,
    fontWeight: '500',
    flex: 1,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  serialNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serialText: {
    ...typography.caption,
    fontWeight: '600',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...typography.body,
    fontWeight: '500',
  },
  studentReg: {
    ...typography.caption,
    marginTop: 2,
  },
});
