import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useSubjects, useSections } from '@/lib/queries';
import { GlassCard, GlassButton, IconBadge } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography, shadows } from '@/theme';

type Section = { id: string; name: string; subject_id: string };

export default function AttendanceScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const isTeacher = user?.role === 'TEACHER';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const { data: subjects = [] } = useSubjects(
    user?.department_id ?? null,
    !!isTeacher
  );
  const { data: sections = [], isLoading: sectionsLoading } = useSections(selectedSubject);

  useEffect(() => {
    setSelectedSection(null);
  }, [selectedSubject]);

  const handleTakeAttendance = () => {
    const subject = subjects.find((s: any) => s.id === selectedSubject);
    const section = (sections as Section[]).find((s) => s.id === selectedSection);
    router.push({
      pathname: '/(tabs)/attendance-camera',
      params: {
        subject_id: selectedSubject!,
        subject_name: subject?.name ?? '',
        section_id: selectedSection ?? '',
        section_name: section?.name ?? '',
      },
    });
  };

  const handleTestRecognition = () => {
    router.push({
      pathname: '/(tabs)/attendance-camera',
      params: { test_mode: 'true' },
    });
  };

  if (
    user?.role !== 'TEACHER' &&
    user?.role !== 'DEPARTMENT_ADMIN' &&
    user?.role !== 'SUPER_ADMIN'
  ) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
            Teachers can take attendance.
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
      <Text style={[styles.title, { color: colors.textPrimary }]}>Take Attendance</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {isSuperAdmin
          ? 'Test recognition or select subject'
          : 'Select subject and open camera'}
      </Text>

      {isSuperAdmin && (
        <TouchableOpacity
          style={[styles.testCard, shadows.glow]}
          onPress={handleTestRecognition}
          activeOpacity={0.8}
        >
          <IconBadge variant="success" size="lg" style={styles.testIcon}>
            <Ionicons name="scan" size={24} color={colors.success} />
          </IconBadge>
          <View style={styles.testTextContainer}>
            <Text style={[styles.testTitle, { color: colors.success }]}>Test Recognition</Text>
            <Text style={[styles.testHint, { color: colors.textSecondary }]}>
              Capture photo or live stream to test face recognition
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.success} />
        </TouchableOpacity>
      )}

      {(subjects.length > 0 || !isSuperAdmin) && (
        <>
          {isSuperAdmin && subjects.length > 0 && (
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>or take attendance</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          <Text style={[styles.stepLabel, { color: colors.textMuted }]}>STEP 1: SELECT SUBJECT</Text>
          <GlassCard style={styles.subjectsCard} variant="solid">
            {subjects.map((s: any, index: number) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.subjectItem,
                  selectedSubject === s.id && styles.subjectItemActive,
                  index < subjects.length - 1 && styles.subjectItemBorder,
                ]}
                onPress={() => setSelectedSubject(s.id)}
                activeOpacity={0.7}
              >
                <View style={styles.subjectInfo}>
                  <IconBadge
                    variant={selectedSubject === s.id ? 'primary' : 'secondary'}
                    size="md"
                  >
                    <Ionicons
                      name="book-outline"
                      size={20}
                      color={
                        selectedSubject === s.id
                          ? colors.primary
                          : colors.textMuted
                      }
                    />
                  </IconBadge>
                  <Text
                    style={[
                      styles.subjectName,
                      { color: selectedSubject === s.id ? colors.primary : colors.textPrimary },
                      selectedSubject === s.id && styles.subjectNameActive,
                    ]}
                  >
                    {s.name}
                  </Text>
                </View>
                {selectedSubject === s.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </GlassCard>

          {selectedSubject && (
            <>
              <Text style={[styles.stepLabel, { color: colors.textMuted }]}>STEP 2: SELECT SECTION</Text>
              {sectionsLoading ? (
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading sections...</Text>
              ) : (sections as Section[]).length === 0 ? (
                <GlassCard variant="solid" style={styles.noSectionsCard}>
                  <View style={styles.noSectionsContent}>
                    <Ionicons name="information-circle-outline" size={24} color={colors.textMuted} />
                    <Text style={[styles.noSectionsText, { color: colors.textSecondary }]}>
                      No sections found for this subject. Attendance will be taken for all enrolled students.
                    </Text>
                  </View>
                </GlassCard>
              ) : (
                <GlassCard style={styles.subjectsCard} variant="solid">
                  {(sections as Section[]).map((s, index) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.subjectItem,
                        selectedSection === s.id && styles.subjectItemActive,
                        index < (sections as Section[]).length - 1 && styles.subjectItemBorder,
                      ]}
                      onPress={() => setSelectedSection(s.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.subjectInfo}>
                        <IconBadge
                          variant={selectedSection === s.id ? 'primary' : 'secondary'}
                          size="md"
                        >
                          <Text
                            style={[
                              styles.sectionIcon,
                              { color: selectedSection === s.id ? colors.primary : colors.textMuted },
                            ]}
                          >
                            {s.name}
                          </Text>
                        </IconBadge>
                        <Text
                          style={[
                            styles.subjectName,
                            { color: selectedSection === s.id ? colors.primary : colors.textPrimary },
                            selectedSection === s.id && styles.subjectNameActive,
                          ]}
                        >
                          Section {s.name}
                        </Text>
                      </View>
                      {selectedSection === s.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </GlassCard>
              )}
            </>
          )}

          <GlassButton
            variant="primary"
            size="lg"
            onPress={handleTakeAttendance}
            disabled={!selectedSubject || ((sections as Section[]).length > 0 && !selectedSection)}
            style={styles.cameraButton}
            leftIcon={
              <Ionicons
                name="camera"
                size={20}
                color={colors.textOnPrimary}
              />
            }
          >
            Open Camera
          </GlassButton>
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
  title: {
    ...typography.h1,
    color: staticColors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: staticColors.textMuted,
    marginBottom: spacing.xl,
  },
  restrictedText: {
    ...typography.body,
    color: staticColors.textSecondary,
    textAlign: 'center',
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  testIcon: {
    marginRight: spacing.md,
  },
  testTextContainer: {
    flex: 1,
  },
  testTitle: {
    ...typography.body,
    color: staticColors.success,
    fontWeight: '700',
  },
  testHint: {
    ...typography.caption,
    color: staticColors.textSecondary,
    marginTop: 2,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: staticColors.border,
  },
  dividerText: {
    ...typography.caption,
    color: staticColors.textMuted,
    marginHorizontal: spacing.md,
  },
  subjectsCard: {
    padding: 0,
    marginBottom: spacing.lg,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  subjectItemActive: {
    backgroundColor: 'rgba(0, 200, 83, 0.05)',
  },
  subjectItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  subjectName: {
    ...typography.body,
    color: staticColors.textPrimary,
  },
  subjectNameActive: {
    color: staticColors.primary,
    fontWeight: '600',
  },
  stepLabel: {
    ...typography.caption,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionIcon: {
    fontWeight: '700',
    fontSize: 14,
  },
  loadingText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.lg,
  },
  noSectionsCard: {
    marginBottom: spacing.lg,
  },
  noSectionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  noSectionsText: {
    ...typography.caption,
    flex: 1,
  },
  cameraButton: {
    marginTop: spacing.md,
  },
});
