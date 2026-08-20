import { useState, useEffect } from 'react';
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
import { useDepartments, useUsers } from '@/lib/queries';
import { GlassCard } from '@/components/ui';
import { useThemeColors, spacing, typography } from '@/theme';

type Department = { id: string; name: string; college_id: string };
type User = { id: string; email: string; name: string | null; role: string; department_id: string | null };

export default function TeacherListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const collegeId = user?.college_id ?? null;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isDeptAdmin = user?.role === 'DEPARTMENT_ADMIN';

  const { data: allDepartments = [], isLoading: deptLoading } = useDepartments(collegeId);
  const departments = isDeptAdmin && user?.department_id
    ? (allDepartments as Department[]).filter((d) => d.id === user.department_id)
    : (allDepartments as Department[]);
  const { data: users = [], isLoading: usersLoading } = useUsers(
    collegeId,
    selectedDeptId,
    !!selectedDeptId
  );
  const teachers = (users as User[]).filter((u) => String(u.role).toUpperCase() === 'TEACHER');

  const canView = isDeptAdmin || isSuperAdmin;

  useEffect(() => {
    if (isDeptAdmin && user?.department_id && departments.length === 1 && !selectedDeptId) {
      setSelectedDeptId(departments[0].id);
    }
  }, [isDeptAdmin, user?.department_id, departments, selectedDeptId]);

  if (!canView) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
            Only department admins can view the teacher list.
          </Text>
        </GlassCard>
      </View>
    );
  }

  const selectedDept = (departments as Department[]).find((d) => d.id === selectedDeptId);

  const handleBack = () => {
    if (selectedDeptId && (departments as Department[]).length > 1) {
      setSelectedDeptId(null);
    } else {
      router.back();
    }
  };

  if (deptLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
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
            Select a department to view teachers
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
            {usersLoading ? 'Loading...' : `${teachers.length} teacher(s)`}
          </Text>

          {usersLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : teachers.length === 0 ? (
            <GlassCard>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No teachers in this department.
              </Text>
            </GlassCard>
          ) : (
            <GlassCard style={styles.listCard} variant="solid">
              {teachers.map((teacher, idx) => (
                <View
                  key={teacher.id}
                  style={[
                    styles.teacherItem,
                    { borderBottomColor: colors.border },
                    idx === teachers.length - 1 && styles.lastItem,
                  ]}
                >
                  <View style={[styles.teacherIcon, { backgroundColor: `${colors.info}15` }]}>
                    <Ionicons name="person" size={20} color={colors.info} />
                  </View>
                  <View style={styles.teacherInfo}>
                    <Text style={[styles.teacherName, { color: colors.textPrimary }]}>
                      {teacher.name || '—'}
                    </Text>
                    <Text style={[styles.teacherEmail, { color: colors.textMuted }]} numberOfLines={1}>
                      {teacher.email}
                    </Text>
                  </View>
                </View>
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
  teacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  teacherIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    ...typography.body,
    fontWeight: '500',
  },
  teacherEmail: {
    ...typography.caption,
    marginTop: 2,
  },
});
