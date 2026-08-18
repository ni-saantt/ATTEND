import { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useSections, useCreateSection, useDeleteSection, useSectionTeachers, useTeachers, useAssignTeachersToSection } from '@/lib/queries';
import { GlassCard, GlassButton, IconBadge } from '@/components/ui';
import { useThemeColors, spacing, typography } from '@/theme';

type Section = { id: string; name: string; subject_id: string };
type Teacher = { id: string; name: string; email: string };

function SectionRow({
  section,
  colors,
  onEdit,
  onDelete,
}: {
  section: Section;
  colors: ReturnType<typeof useThemeColors>;
  onEdit: (sectionId: string, teacherIds: string[]) => void;
  onDelete: (sectionId: string, name: string) => void;
}) {
  const { data: assignedTeachers = [] } = useSectionTeachers(section.id);
  const teacherIds = (assignedTeachers as Teacher[]).map((t) => t.id);
  const hasTeachers = teacherIds.length > 0;
  const teacherNames = (assignedTeachers as Teacher[]).map((t) => t.name || t.email).join(', ');

  return (
    <View style={[styles.sectionItem, { borderBottomColor: colors.border }]}>
      <View style={styles.sectionInfo}>
        <IconBadge variant="primary" size="md">
          <Text style={[styles.sectionIcon, { color: colors.primary }]}>{section.name}</Text>
        </IconBadge>
        <View>
          <Text style={[styles.sectionName, { color: colors.textPrimary }]}>Section {section.name}</Text>
          <Text style={[styles.assignedTeachersLabel, { color: colors.textMuted }]} numberOfLines={1}>
            {hasTeachers ? teacherNames : 'No teachers assigned'}
          </Text>
        </View>
      </View>
      <View style={styles.sectionActions}>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: `${colors.info}18` }]}
          onPress={() => onEdit(section.id, teacherIds)}
        >
          <Ionicons name="pencil" size={18} color={colors.info} />
          <Text style={[styles.editBtnText, { color: colors.info }]}>{hasTeachers ? 'Edit' : 'Assign'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(section.id, section.name)}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ManageSectionsDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const raw = useLocalSearchParams<{ subjectId?: string; subjectName?: string }>();
  const subjectId = Array.isArray(raw.subjectId) ? raw.subjectId[0] : raw.subjectId;
  const subjectName = Array.isArray(raw.subjectName) ? raw.subjectName[0] : raw.subjectName ?? 'Subject';

  const [newSectionName, setNewSectionName] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAssignTeachers, setShowAssignTeachers] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  const departmentId = user?.department_id ?? null;
  const { data: sections = [] } = useSections(subjectId ?? null);
  const { data: teachers = [] } = useTeachers(departmentId);

  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();
  const assignTeachers = useAssignTeachersToSection();

  const handleCreateSection = async () => {
    if (!subjectId || !newSectionName.trim()) return;
    try {
      await createSection.mutateAsync({ subjectId, name: newSectionName.trim().toUpperCase() });
      setNewSectionName('');
      setShowAddSection(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create section');
    }
  };

  const handleDeleteSection = (sectionId: string, sectionName: string) => {
    Alert.alert(
      'Delete Section',
      `Are you sure you want to delete section "${sectionName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSection.mutateAsync(sectionId);
              if (selectedSectionId === sectionId) setSelectedSectionId(null);
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.detail || 'Failed to delete section');
            }
          },
        },
      ]
    );
  };

  const handleOpenAssignTeachers = (sectionId: string, currentTeacherIds: string[] = []) => {
    setSelectedSectionId(sectionId);
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

  if (!subjectId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Subject not found</Text>
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
        <Text style={[styles.backBtnText, { color: colors.primary }]}>Manage Sections</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.textPrimary }]}>{subjectName}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Sections and assigned teachers</Text>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SECTIONS</Text>
        <TouchableOpacity onPress={() => setShowAddSection(true)}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <GlassCard style={styles.listCard} variant="solid">
        {(sections as Section[]).map((section, index) => (
          <View key={section.id} style={index === (sections as Section[]).length - 1 ? styles.lastItem : undefined}>
            <SectionRow
              section={section}
              colors={colors}
              onEdit={handleOpenAssignTeachers}
              onDelete={handleDeleteSection}
            />
          </View>
        ))}
        {(sections as Section[]).length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No sections yet. Tap + to create one.</Text>
        )}
      </GlassCard>

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
              <GlassButton variant="ghost" size="sm" onPress={() => setShowAddSection(false)}>Cancel</GlassButton>
              <GlassButton variant="primary" size="sm" onPress={handleCreateSection} disabled={!newSectionName.trim()}>Create</GlassButton>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAssignTeachers} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '70%' }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Assign Teachers</Text>
            <ScrollView style={styles.teacherList}>
              {(teachers as Teacher[]).map((teacher) => (
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
              {(teachers as Teacher[]).length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No teachers in department</Text>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <GlassButton variant="ghost" size="sm" onPress={() => setShowAssignTeachers(false)}>Cancel</GlassButton>
              <GlassButton variant="primary" size="sm" onPress={handleAssignTeachers}>Save</GlassButton>
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
  sectionLabel: { ...typography.caption, letterSpacing: 1, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  listCard: { padding: 0 },
  sectionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1 },
  sectionInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionIcon: { fontWeight: '700', fontSize: 14 },
  sectionName: { ...typography.body, fontWeight: '500' },
  assignedTeachersLabel: { ...typography.caption, marginTop: 2, maxWidth: 180 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: 8, gap: spacing.xs },
  editBtnText: { ...typography.caption, fontWeight: '600' },
  actionBtn: { padding: spacing.sm },
  lastItem: { borderBottomWidth: 0 },
  emptyText: { ...typography.body, textAlign: 'center', padding: spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: 16, padding: spacing.xl },
  modalTitle: { ...typography.h3, marginBottom: spacing.lg, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: spacing.md, fontSize: 16, marginBottom: spacing.lg },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  teacherList: { maxHeight: 300 },
  teacherItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, gap: spacing.md },
  teacherInfo: { flex: 1 },
  teacherName: { ...typography.body, fontWeight: '500' },
  teacherEmail: { ...typography.caption },
});
