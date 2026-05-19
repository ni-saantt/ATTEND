import { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useSubjects, useSections, useCreateSection, useDeleteSection, useSectionTeachers, useTeachers, useAssignTeachersToSection, useRemoveTeacherFromSection } from '@/lib/queries';
import { GlassCard, GlassButton, IconBadge } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography } from '@/theme';

type Section = { id: string; name: string; subject_id: string };
type Teacher = { id: string; name: string; email: string };

export default function ManageSectionsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAssignTeachers, setShowAssignTeachers] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  const isDeptAdmin = user?.role === 'DEPARTMENT_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN';
  const departmentId = user?.department_id ?? null;

  const { data: subjects = [] } = useSubjects(departmentId, false);
  const { data: sections = [] } = useSections(selectedSubjectId);
  const { data: sectionTeachers = [] } = useSectionTeachers(selectedSectionId);
  const { data: teachers = [] } = useTeachers(departmentId);

  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();
  const assignTeachers = useAssignTeachersToSection();
  const removeTeacher = useRemoveTeacherFromSection();

  if (!isDeptAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
            Only Department Admins can manage sections.
          </Text>
        </GlassCard>
      </View>
    );
  }

  const handleCreateSection = async () => {
    if (!selectedSubjectId || !newSectionName.trim()) return;
    try {
      await createSection.mutateAsync({ subjectId: selectedSubjectId, name: newSectionName.trim().toUpperCase() });
      setNewSectionName('');
      setShowAddSection(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create section');
    }
  };

  const handleDeleteSection = (sectionId: string, sectionName: string) => {
    Alert.alert(
      'Delete Section',
      `Are you sure you want to delete section "${sectionName}"? This will remove all student assignments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSection.mutateAsync(sectionId);
              if (selectedSectionId === sectionId) {
                setSelectedSectionId(null);
              }
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.detail || 'Failed to delete section');
            }
          },
        },
      ]
    );
  };

  const handleOpenAssignTeachers = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const currentTeacherIds = sectionTeachers.map((t: Teacher) => t.id);
    setSelectedTeacherIds(currentTeacherIds);
    setShowAssignTeachers(true);
  };

  const handleAssignTeachers = async () => {
    if (!selectedSectionId) return;
    try {
      await assignTeachers.mutateAsync({ sectionId: selectedSectionId, teacherIds: selectedTeacherIds });
      setShowAssignTeachers(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to assign teachers');
    }
  };

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeacherIds(prev =>
      prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]
    );
  };

  const selectedSubject = subjects.find((s: any) => s.id === selectedSubjectId);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>Manage Sections</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Create sections and assign teachers
      </Text>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SELECT SUBJECT</Text>
      <GlassCard style={styles.listCard} variant="solid">
        {subjects.map((subject: any, index: number) => (
          <TouchableOpacity
            key={subject.id}
            style={[
              styles.listItem,
              { borderBottomColor: colors.border },
              selectedSubjectId === subject.id && { backgroundColor: `${colors.primary}10` },
              index === subjects.length - 1 && styles.lastItem,
            ]}
            onPress={() => {
              setSelectedSubjectId(subject.id);
              setSelectedSectionId(null);
            }}
            activeOpacity={0.7}
          >
            <IconBadge variant={selectedSubjectId === subject.id ? 'primary' : 'secondary'} size="md">
              <Ionicons name="book-outline" size={20} color={selectedSubjectId === subject.id ? colors.primary : colors.textMuted} />
            </IconBadge>
            <Text style={[styles.listItemText, { color: selectedSubjectId === subject.id ? colors.primary : colors.textPrimary }]}>
              {subject.name}
            </Text>
            {selectedSubjectId === subject.id && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
        {subjects.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No subjects found</Text>
        )}
      </GlassCard>

      {selectedSubjectId && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              SECTIONS FOR {selectedSubject?.name?.toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => setShowAddSection(true)}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <GlassCard style={styles.listCard} variant="solid">
            {sections.map((section: Section, index: number) => (
              <View
                key={section.id}
                style={[
                  styles.sectionItem,
                  { borderBottomColor: colors.border },
                  index === sections.length - 1 && styles.lastItem,
                ]}
              >
                <View style={styles.sectionInfo}>
                  <IconBadge variant="primary" size="md">
                    <Text style={[styles.sectionIcon, { color: colors.primary }]}>{section.name}</Text>
                  </IconBadge>
                  <Text style={[styles.sectionName, { color: colors.textPrimary }]}>Section {section.name}</Text>
                </View>
                <View style={styles.sectionActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenAssignTeachers(section.id)}
                  >
                    <Ionicons name="people-outline" size={20} color={colors.info} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDeleteSection(section.id, section.name)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {sections.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No sections yet. Tap + to create one.
              </Text>
            )}
          </GlassCard>
        </>
      )}

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={[styles.backLinkText, { color: colors.primary }]}>Back to Dashboard</Text>
      </TouchableOpacity>

      <Modal visible={showAddSection} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Section</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Section name (e.g., A, B, C)"
              placeholderTextColor={colors.textMuted}
              value={newSectionName}
              onChangeText={(text) => setNewSectionName(text.toUpperCase())}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.modalActions}>
              <GlassButton variant="ghost" size="sm" onPress={() => setShowAddSection(false)}>
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                size="sm"
                onPress={handleCreateSection}
                disabled={!newSectionName.trim()}
              >
                Create
              </GlassButton>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAssignTeachers} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '70%' }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Assign Teachers</Text>
            <ScrollView style={styles.teacherList}>
              {teachers.map((teacher: Teacher) => (
                <TouchableOpacity
                  key={teacher.id}
                  style={[styles.teacherItem, { borderBottomColor: colors.border }]}
                  onPress={() => toggleTeacher(teacher.id)}
                >
                  <Ionicons
                    name={selectedTeacherIds.includes(teacher.id) ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={selectedTeacherIds.includes(teacher.id) ? colors.primary : colors.textMuted}
                  />
                  <View style={styles.teacherInfo}>
                    <Text style={[styles.teacherName, { color: colors.textPrimary }]}>{teacher.name || 'Unnamed'}</Text>
                    <Text style={[styles.teacherEmail, { color: colors.textMuted }]}>{teacher.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {teachers.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No teachers in department</Text>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <GlassButton variant="ghost" size="sm" onPress={() => setShowAssignTeachers(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" size="sm" onPress={handleAssignTeachers}>
                Save
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
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  sectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionIcon: {
    fontWeight: '700',
    fontSize: 14,
  },
  sectionName: {
    ...typography.body,
    fontWeight: '500',
  },
  sectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.sm,
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
    borderRadius: 16,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  teacherList: {
    maxHeight: 300,
  },
  teacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
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
  },
});
