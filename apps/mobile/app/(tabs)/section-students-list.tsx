import { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useSectionStudents, useSubjectEnrolledStudentIds, useStudents, useAssignStudentsToSection, useRemoveStudentFromSection } from '@/lib/queries';
import { GlassCard, GlassButton, IconBadge } from '@/components/ui';
import { useThemeColors, spacing, typography } from '@/theme';

type Student = { id: string; name: string; reg_no: string };

export default function SectionStudentsListScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const raw = useLocalSearchParams<{ sectionId?: string; sectionName?: string; subjectId?: string; subjectName?: string }>();
  const sectionId = Array.isArray(raw.sectionId) ? raw.sectionId[0] : raw.sectionId;
  const sectionName = Array.isArray(raw.sectionName) ? raw.sectionName[0] : raw.sectionName ?? 'Section';
  const subjectId = Array.isArray(raw.subjectId) ? raw.subjectId[0] : raw.subjectId ?? null;
  const subjectName = Array.isArray(raw.subjectName) ? raw.subjectName[0] : raw.subjectName ?? 'Subject';

  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const departmentId = user?.department_id ?? null;
  const collegeId = user?.college_id ?? null;

  const { data: sectionStudents = [], refetch: refetchStudents } = useSectionStudents(sectionId);
  const { data: enrolledInSubjectIds = [] } = useSubjectEnrolledStudentIds(subjectId);
  const { data: allStudents = [] } = useStudents(collegeId, departmentId, showAddStudents);

  const assignStudents = useAssignStudentsToSection();
  const removeStudent = useRemoveStudentFromSection();

  const enrolledInSubjectSet = useMemo(() => new Set(enrolledInSubjectIds), [enrolledInSubjectIds]);
  const availableStudents = useMemo(() => {
    // Only show students not in any section of this subject (one section per student per subject)
    const students = (allStudents as Student[]).filter(s => !enrolledInSubjectSet.has(s.id));
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => s.name?.toLowerCase().includes(q) || s.reg_no?.toLowerCase().includes(q));
  }, [allStudents, enrolledInSubjectSet, searchQuery]);

  const enterEditMode = () => setIsEditMode(true);
  const exitEditMode = () => setIsEditMode(false);

  const handleOpenAddStudents = () => {
    setSelectedStudentIds([]);
    setSearchQuery('');
    setShowAddStudents(true);
  };

  const handleAddStudents = async () => {
    if (!sectionId || selectedStudentIds.length === 0) return;
    try {
      await assignStudents.mutateAsync({ sectionId, studentIds: selectedStudentIds });
      setShowAddStudents(false);
      refetchStudents();
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      const message = typeof detail === 'object' && detail?.message
        ? detail.message
        : (typeof detail === 'string' ? detail : 'Failed to add students');
      Alert.alert('Cannot add students', message);
    }
  };

  const handleRemoveStudent = (student: Student) => {
    if (!sectionId) return;
    Alert.alert('Remove Student', `Remove ${student.name} from this section?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeStudent.mutateAsync({ sectionId, studentId: student.id });
            refetchStudents();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.detail || 'Failed to remove student');
          }
        },
      },
    ]);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => (prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]));
  };

  if (!sectionId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Section not found</Text>
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
        <Text style={[styles.backBtnText, { color: colors.primary }]}>{subjectName}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.textPrimary }]}>Section {sectionName}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Manage students in this section</Text>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>STUDENTS</Text>
        {isEditMode ? (
          <View style={styles.editModeActions}>
            <TouchableOpacity style={styles.editStudentsBtn} onPress={handleOpenAddStudents}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.editStudentsText, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editStudentsBtn} onPress={exitEditMode}>
              <Text style={[styles.editStudentsText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editStudentsBtn} onPress={enterEditMode}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={[styles.editStudentsText, { color: colors.primary }]}>Edit Students</Text>
          </TouchableOpacity>
        )}
      </View>

      <GlassCard style={styles.listCard} variant="solid">
        {(sectionStudents as Student[]).map((student, index) => (
          <View
            key={student.id}
            style={[
              styles.studentRow,
              { borderBottomColor: colors.border },
              index === (sectionStudents as Student[]).length - 1 && styles.lastItem,
            ]}
          >
            <View style={styles.studentInfo}>
              <IconBadge variant="secondary" size="sm">
                <Ionicons name="person" size={14} color={colors.textMuted} />
              </IconBadge>
              <View style={styles.studentText}>
                <Text style={[styles.studentName, { color: colors.textPrimary }]} numberOfLines={1}>{student.name}</Text>
                <Text style={[styles.studentReg, { color: colors.textMuted }]} numberOfLines={1}>{student.reg_no}</Text>
              </View>
            </View>
            {isEditMode && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveStudent(student)}>
                <Ionicons name="close-circle" size={22} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {(sectionStudents as Student[]).length === 0 && (
          <Text style={[styles.emptyTextSmall, { color: colors.textMuted }]}>
            {isEditMode ? 'No students. Tap Add to add.' : 'No students. Tap Edit Students to add or manage.'}
          </Text>
        )}
      </GlassCard>

      <Modal visible={showAddStudents} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Students</Text>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Search by name or reg no..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <ScrollView style={styles.studentList}>
              {availableStudents.map((student: Student) => (
                <TouchableOpacity
                  key={student.id}
                  style={[styles.studentCheckItem, { borderBottomColor: colors.border }]}
                  onPress={() => toggleStudent(student.id)}
                >
                  <Ionicons
                    name={selectedStudentIds.includes(student.id) ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={selectedStudentIds.includes(student.id) ? colors.primary : colors.textMuted}
                  />
                  <View style={styles.studentCheckInfo}>
                    <Text style={[styles.studentName, { color: colors.textPrimary }]}>{student.name}</Text>
                    <Text style={[styles.studentReg, { color: colors.textMuted }]}>{student.reg_no}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {availableStudents.length === 0 && (
                <Text style={[styles.emptyTextSmall, { color: colors.textMuted }]}>
                  {searchQuery ? 'No match' : 'All students are already in a section of this subject'}
                </Text>
              )}
            </ScrollView>
            <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
              {selectedStudentIds.length} selected
            </Text>
            <View style={styles.modalActions}>
              <GlassButton variant="ghost" size="sm" onPress={() => setShowAddStudents(false)}>Cancel</GlassButton>
              <GlassButton variant="primary" size="sm" onPress={handleAddStudents} disabled={selectedStudentIds.length === 0}>
                Add
              </GlassButton>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xl },
  backBtnText: { ...typography.body, fontWeight: '500' },
  title: { ...typography.h1, marginBottom: spacing.xs },
  subtitle: { ...typography.body, marginBottom: spacing.xl },
  sectionLabel: { ...typography.caption, letterSpacing: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  editModeActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  editStudentsBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  editStudentsText: { ...typography.body, fontWeight: '600', fontSize: 14 },
  listCard: { padding: 0 },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  studentText: { flex: 1, minWidth: 0 },
  studentName: { ...typography.body, fontWeight: '500', fontSize: 14 },
  studentReg: { ...typography.caption, fontSize: 12 },
  removeBtn: { padding: spacing.xs },
  lastItem: { borderBottomWidth: 0 },
  emptyTextSmall: { ...typography.caption, textAlign: 'center', padding: spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { width: '100%', maxWidth: 400, maxHeight: '80%', borderRadius: 16, padding: spacing.xl },
  modalTitle: { ...typography.h3, marginBottom: spacing.lg, textAlign: 'center' },
  searchInput: { borderWidth: 1, borderRadius: 8, padding: spacing.md, fontSize: 16, marginBottom: spacing.md },
  studentList: { maxHeight: 280 },
  studentCheckItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: 1, gap: spacing.sm },
  studentCheckInfo: { flex: 1 },
  selectedCount: { ...typography.caption, textAlign: 'center', marginVertical: spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
});
