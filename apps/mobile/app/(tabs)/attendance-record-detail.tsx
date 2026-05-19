import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  View,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassButton, IconBadge } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography, borderRadius, shadows } from '@/theme';

export default function AttendanceRecordDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const raw = useLocalSearchParams<{
    attendanceId?: string;
    subjectName?: string;
    regNo?: string;
    studentName?: string;
    faceCropUrl?: string;
    timestamp?: string;
  }>();
  const subjectName = Array.isArray(raw.subjectName)
    ? raw.subjectName[0]
    : raw.subjectName;
  const regNo = Array.isArray(raw.regNo) ? raw.regNo[0] : raw.regNo;
  const studentName = Array.isArray(raw.studentName)
    ? raw.studentName[0]
    : raw.studentName;
  const faceCropUrl = Array.isArray(raw.faceCropUrl)
    ? raw.faceCropUrl[0]
    : raw.faceCropUrl;
  const timestamp = Array.isArray(raw.timestamp)
    ? raw.timestamp[0]
    : raw.timestamp;

  if (!raw.attendanceId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>Record not found.</Text>
        </GlassCard>
        <GlassButton
          variant="ghost"
          size="md"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          Back
        </GlassButton>
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

      <Text style={[styles.title, { color: colors.textPrimary }]}>Attendance Record</Text>

      <View style={styles.imageSection}>
        {faceCropUrl ? (
          <Image
            source={{ uri: faceCropUrl }}
            style={[styles.faceImage, shadows.md]}
          />
        ) : (
          <View style={[styles.faceImage, styles.facePlaceholder]}>
            <Ionicons name="person" size={48} color={colors.textMuted} />
            <Text style={[styles.facePlaceholderText, { color: colors.textMuted }]}>No image</Text>
          </View>
        )}
      </View>

      <GlassCard style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <IconBadge variant="primary" size="md">
            <Ionicons name="book" size={20} color={colors.primary} />
          </IconBadge>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Subject</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{subjectName || '—'}</Text>
          </View>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailRow}>
          <IconBadge variant="secondary" size="md">
            <Ionicons name="time" size={20} color={colors.textSecondary} />
          </IconBadge>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Time</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {(timestamp || '').slice(0, 19) || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailRow}>
          <IconBadge variant="secondary" size="md">
            <Ionicons name="card" size={20} color={colors.textSecondary} />
          </IconBadge>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Registration No</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{regNo || '—'}</Text>
          </View>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailRow}>
          <IconBadge variant="secondary" size="md">
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </IconBadge>
          <View style={styles.detailTextContainer}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Student Name</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{studentName || '—'}</Text>
          </View>
        </View>
      </GlassCard>
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
  backButton: {
    marginTop: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: staticColors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  restrictedText: {
    ...typography.body,
    color: staticColors.textSecondary,
    textAlign: 'center',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  faceImage: {
    width: 160,
    height: 160,
    borderRadius: borderRadius.lg,
  },
  facePlaceholder: {
    backgroundColor: staticColors.surfaceGlass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  facePlaceholderText: {
    ...typography.caption,
    color: staticColors.textMuted,
    marginTop: spacing.sm,
  },
  detailsCard: {
    padding: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
    color: staticColors.textMuted,
  },
  detailValue: {
    ...typography.body,
    color: staticColors.textPrimary,
    fontWeight: '500',
    marginTop: 2,
  },
  detailDivider: {
    height: 1,
    backgroundColor: staticColors.border,
    marginHorizontal: spacing.lg,
  },
});
