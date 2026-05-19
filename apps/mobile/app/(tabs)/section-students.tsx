import { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useMySections, useSectionStudents, useStudents, useAssignStudentsToSection, useRemoveStudentFromSection } from '@/lib/queries';
import { GlassCard, GlassButton, IconBadge } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography } from '@/theme';

type Student = { id: string; name: string; reg_no: string; primary_image_url?: string };
type Section = { id: string; name: string; created_at?: string };
type SubjectWithSections = { subject_id: string; subject_name: string; sections: Section[] };

export default function SectionStudentsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const isTeacher = user?.role === 'TEACHER';
  const isDeptAdmin = user?.role === 'DEPARTMENT_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN';
  const departmentId = user?.department_id ?? null;
  const collegeId = user?.college_id ?? null;

  const { data: mySections = [], isLoading: sectionsLoading } = useMySections();
  const { data: sectionStudents = [], refetch: refetchStudents } = useSectionStudents(selectedSectionId);
  const { data: allStudents = [] } = useStudents(collegeId, departmentId, showAddStudents);

  const assignStudents = useAssignStudentsToSection();
  const removeStudent = useRemoveStudentFromSection();

  const selectedSection = useMemo(() => {
    for (const subj of mySections as SubjectWithSections[]) {
      const section = subj.sections.find((s: Section) => s.id === selectedSectionId);
      if (section) return { ...section, subject_name: subj.subject_name };
    }
    return null;
  }, [mySections, selectedSectionId]);

  const currentStudentIds = useMemo(() => 
    new Set((sectionStudents as Student[]).map(s => s.id)), 
    [sectionStudents]
  );

  const availableStudents = useMemo(() => {
    const students = (allStudents as Student[]).filter(s => !currentStudentIds.has(s.id));
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(s => 
      s.name?.toLowerCase().includes(query) || s.reg_no?.toLowerCase().includes(query)
    );
  }, [allStudents, currentStudentIds, searchQuery]);

  if (!isTeacher && !isDeptAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
            Only teachers can manage section students.
          </Text>
        </GlassCard>
      </View>
    );
  }

  const handleOpenAddStudents = () => {
    setSelectedStudentIds([]);
    setSearchQuery('');
    setShowAddStudents(true);
  };

  const handleAddStudents = async () => {
    if (!selectedSectionId || selectedStudentIds.length === 0) return;
    try {
      await assignStudents.mutateAsync({ sectionId: selectedSectionId, studentIds: selectedStudentIds });
      setShowAddStudents(false);
      refetchStudents();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to add students');
    }
  };

  const handleRemoveStudent = (student: Student) => {
    if (!selectedSectionId) return;
    Alert.alert(
      'Remove Student',
      `Remove ${student.name} from this section?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeStudent.mutateAsync({ sectionId: selectedSectionId, studentId: student.id });
              refetchStudents();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.detail || 'Failed to remove student');
            }
          },
        },
      ]
    );
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>My Sections</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Manage students in your assigned sections
      </Text>

      {sectionsLoading ? (
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
      ) : (mySections as SubjectWithSections[]).length === 0 ? (
        <GlassCard>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            You are not assigned to any sections yet.
          </Text>
        </GlassCard>
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SELECT SECTION</Text>
          {(mySections as SubjectWithSections[]).map((subj) => (
            <View key={subj.subject_id} style={styles.subjectGroup}>
              <Text style={[styles.subjectName, { color: colors.textSecondary }]}>{subj.subject_name}</Text>
              <GlassCard style={styles.listCard} variant="solid">
                {subj.sections.map((section: Section, index: number) => (
                  <TouchableOpacity
                    key={section.id}
                    style={[
                      styles.listItem,
                      { borderBottomColor: colors.border },
                      selectedSectionId === section.id && { backgroundColor: `${colors.primary}10` },
                      index === subj.sections.length - 1 && styles.lastItem,
                    ]}
                    onPress={() => setSelectedSectionId(section.id)}
                    activeOpacity={0.7}
                  >
                    <IconBadge variant={selectedSectionId === section.id ? 'primary' : 'secondary'} size="md">
                      <Text style={[styles.sectionIcon, { color: selectedSectionId === section.id ? colors.primary : colors.textMuted }]}>
                        {section.name}
                      </Text>
                    </IconBadge>
                    <Text style={[styles.listItemText, { color: selectedSectionId === section.id ? colors.primary : colors.textPrimary }]}>
                      Section {section.name}
                    </Text>
                    {selectedSectionId === section.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </GlassCard>
            </View>
          ))}

          {selectedSectionId && selectedSection && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                  STUDENTS IN SECTION {selectedSection.name}
                </Text>
                <TouchableOpacity onPress={handleOpenAddStudents}>
                  <Ionicons name="add-circle" size={28} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <GlassCard style={styles.listCard} variant="solid">
                {(sectionStudents as Student[]).map((student, index) => (
                  <View
                    key={student.id}
                    style={[
                      styles.studentItem,
                      { borderBottomColor: colors.border },
                      index === (sectionStudents as Student[]).length - 1 && styles.lastItem,
                    ]}
                  >
                    <View style={styles.studentInfo}>
                      <IconBadge variant="secondary" size="md">
                        <Ionicons name="person" size={20} color={colors.textMuted} />
                      </IconBadge>
                      <View style={styles.studentText}>
                        <Text style={[styles.studentName, { color: colors.textPrimary }]}>{student.name}</Text>
                        <Text style={[styles.studentReg, { color: colors.textMuted }]}>{student.reg_no}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveStudent(student)}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                {(sectionStudents as Student[]).length === 0 && (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No students in this section. Tap + to add.
                  </Text>
                )}
              </GlassCard>
            </>
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={[styles.backLinkText, { color: colors.primary }]}>Back to Dashboard</Text>
      </TouchableOpacity>

      <Modal visible={showAddStudents} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Students</Text>
            
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
                    size={24}
                    color={selectedStudentIds.includes(student.id) ? colors.primary : colors.textMuted}
                  />
                  <View style={styles.studentCheckInfo}>
                    <Text style={[styles.studentName, { color: colors.textPrimary }]}>{student.name}</Text>
                    <Text style={[styles.studentReg, { color: colors.textMuted }]}>{student.reg_no}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {availableStudents.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {searchQuery ? 'No students match your search' : 'All students are already in this section'}
                </Text>
              )}
            </ScrollView>

            <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
              {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
            </Text>

            <View style={styles.modalActions}>
              <GlassButton variant="ghost" size="sm" onPress={() => setShowAddStudents(false)}>
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                size="sm"
                onPress={handleAddStudents}
                disabled={selectedStudentIds.length === 0}
              >
                Add Students
              </GlassButton>
            </View>
          </View>
        </View>
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
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  restrictedText: {
    ...typography.body,
    textAlign: 'center',
  },
  loadingText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.xl,
  },
  sectionLabel: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  subjectGroup: {
    marginBottom: spacing.md,
  },
  subjectName: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  listCard: {
    padding: 0,
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
  listItemText: {
    ...typography.body,
    flex: 1,
  },
  sectionIcon: {
    fontWeight: '700',
    fontSize: 14,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  studentText: {
    flex: 1,
  },
  studentName: {
    ...typography.body,
    fontWeight: '500',
  },
  studentReg: {
    ...typography.caption,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.xl,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  backLinkText: {
    ...typography.body,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  studentList: {
    maxHeight: 300,
  },
  studentCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  studentCheckInfo: {
    flex: 1,
  },
  selectedCount: {
    ...typography.caption,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
});
