import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  View,
  Text,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAttendanceList } from '@/lib/queries';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@attend/shared';
import { GlassCard, GlassButton, IconBadge } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography, borderRadius } from '@/theme';

type AttendanceRecord = {
  id: string;
  student_id: string;
  subject_id: string;
  timestamp: string;
  attendance_date: string;
  face_crop_url: string | null;
  students: { reg_no: string; name: string } | null;
  subjects: { name: string } | null;
};

export default function ReportsDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const raw = useLocalSearchParams<{
    subjectId?: string;
    subjectName?: string;
  }>();
  const subjectId = Array.isArray(raw.subjectId)
    ? raw.subjectId[0]
    : raw.subjectId;
  const subjectName = Array.isArray(raw.subjectName)
    ? raw.subjectName[0]
    : raw.subjectName;
  const queryClient = useQueryClient();
  const { data: records = [], isLoading } = useAttendanceList(
    subjectId ?? null
  );
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);

  const downloadReport = async (type: 'pdf' | 'excel') => {
    if (!subjectId) return;
    setDownloading(type);
    try {
      const endpoint =
        type === 'pdf'
          ? `${ENDPOINTS.ATTENDANCE_REPORT_SIMPLE_PDF}?subject_id=${subjectId}`
          : `${ENDPOINTS.ATTENDANCE_REPORT_SIMPLE_EXCEL}?subject_id=${subjectId}`;
      const { data } = await api.get(endpoint, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';
      const filename = `attendance_report_${
        subjectName?.replace(/\s/g, '_') || subjectId
      }.${ext}`;
      const mimeType =
        type === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (Platform.OS === 'web') {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        Alert.alert(
          'Opened',
          `${type === 'pdf' ? 'PDF' : 'Excel'} opened in a new tab.`
        );
        return;
      }

      try {
        const FileSystem = require('expo-file-system/legacy');
        const Sharing = require('expo-sharing');
        const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
        if (!dir) throw new Error('No storage directory available');
        const path = `${dir}${dir.endsWith('/') ? '' : '/'}${filename}`;

        const bytes = new Uint8Array(data);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
          binary += String.fromCharCode.apply(
            null,
            chunk as unknown as number[]
          );
        }
        const base64 = btoa(binary);

        await FileSystem.writeAsStringAsync(path, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        let opened = false;
        if (Platform.OS === 'android') {
          try {
            const IntentLauncher = require('expo-intent-launcher');
            const contentUri = await FileSystem.getContentUriAsync(path);
            await IntentLauncher.startActivityAsync(
              'android.intent.action.VIEW',
              {
                data: contentUri,
                flags: 1,
                type: mimeType,
              }
            );
            opened = true;
          } catch {
            // Fall through to Sharing
          }
        } else {
          try {
            await Linking.openURL(path);
            opened = true;
          } catch {
            // Fall through to Sharing
          }
        }

        if (!opened && (await Sharing.isAvailableAsync())) {
          const shareUri =
            Platform.OS === 'android'
              ? await FileSystem.getContentUriAsync(path)
              : path;
          await Sharing.shareAsync(shareUri, {
            mimeType,
            dialogTitle: `Save ${filename}`,
          });
          Alert.alert('Opened', 'Report ready. Use Share to save or open.');
        } else if (!opened) {
          Alert.alert(
            'Opened',
            `Report saved. Open Files app to view ${filename}`
          );
        } else {
          Alert.alert(
            'Opened',
            `${type === 'pdf' ? 'PDF' : 'Excel'} opened.`
          );
        }
      } catch (saveErr: any) {
        const errMsg = saveErr?.message || String(saveErr);
        Alert.alert(
          'Could not open',
          `Report received (${
            (data as ArrayBuffer).byteLength
          } bytes) but could not save or open. ${errMsg}`
        );
      }
    } catch (e: any) {
      let msg = `Failed to download ${type.toUpperCase()}`;
      if (e?.response?.status === 404) msg = 'No attendance data found.';
      else if (e?.response?.status === 403) msg = 'Access denied.';
      else if (e?.code === 'ECONNABORTED')
        msg = 'Request timed out. Try again.';
      else if (e?.response?.data) {
        const d = e.response.data;
        if (typeof d === 'string') msg = d;
        else if (d?.detail)
          msg =
            typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail);
        else if (d instanceof ArrayBuffer || ArrayBuffer.isView(d)) {
          try {
            const text = new TextDecoder().decode(d);
            const parsed = JSON.parse(text);
            msg = parsed?.detail || text || msg;
          } catch {
            // keep default msg
          }
        }
      } else if (e?.message) msg = e.message;
      Alert.alert('Error', msg);
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteReport = () => {
    if (!subjectId) return;
    Alert.alert(
      'Delete Report',
      'This will remove all attendance records and images for this subject. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const { data } = await api.delete(
                ENDPOINTS.attendanceDeleteReport(subjectId)
              );
              queryClient.invalidateQueries({
                queryKey: ['attendance-list', subjectId],
              });
              queryClient.invalidateQueries({
                queryKey: ['subjects-with-reports'],
              });
              Alert.alert(
                'Deleted',
                `Report deleted (${data?.deleted ?? 0} records).`,
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (e: any) {
              Alert.alert(
                'Error',
                e.response?.data?.detail || 'Failed to delete'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const byDate = (records as AttendanceRecord[]).reduce<
    Record<string, AttendanceRecord[]>
  >((acc, r) => {
    const d =
      r.attendance_date || (r.timestamp || '').slice(0, 10) || 'Unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort();

  if (!subjectId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassCard>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>Subject required.</Text>
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

  if (isLoading) {
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
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.textPrimary }]}>{subjectName || 'Attendance'}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Tap a row to view full details and image
      </Text>

      <View style={styles.actions}>
        <GlassButton
          variant="secondary"
          size="md"
          onPress={() => downloadReport('pdf')}
          disabled={!!downloading || records.length === 0}
          loading={downloading === 'pdf'}
          leftIcon={
            <Ionicons
              name="document-text"
              size={18}
              color={colors.textPrimary}
            />
          }
          style={styles.actionButton}
        >
          PDF
        </GlassButton>
        <GlassButton
          variant="secondary"
          size="md"
          onPress={() => downloadReport('excel')}
          disabled={!!downloading || records.length === 0}
          loading={downloading === 'excel'}
          leftIcon={
            <Ionicons name="grid" size={18} color={colors.textPrimary} />
          }
          style={styles.actionButton}
        >
          Excel
        </GlassButton>
        <GlassButton
          variant="ghost"
          size="md"
          onPress={handleDeleteReport}
          disabled={deleting || records.length === 0}
          loading={deleting}
          textStyle={{ color: colors.error }}
          leftIcon={<Ionicons name="trash" size={18} color={colors.error} />}
          style={styles.actionButton}
        >
          Delete
        </GlassButton>
      </View>

      {dates.map((date) => (
        <View key={date} style={styles.dateSection}>
          <Text style={[styles.dateHeading, { color: colors.primary }]}>{date}</Text>
          <GlassCard style={styles.tableCard} variant="solid">
            {(byDate[date] || []).map((r, idx, arr) => {
              const student = r.students || {};
              const timeStr = (r.timestamp || '').slice(11, 19) || '—';
              const isLast = idx === arr.length - 1;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.tableRow, !isLast && styles.tableRowBorder]}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/attendance-record-detail',
                      params: {
                        attendanceId: r.id,
                        subjectId: r.subject_id,
                        subjectName: (r.subjects || {}).name || subjectName || '',
                        regNo: student.reg_no || '',
                        studentName: student.name || '',
                        faceCropUrl: r.face_crop_url || '',
                        timestamp: r.timestamp || '',
                      },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.thumbContainer}>
                    {r.face_crop_url ? (
                      <Image
                        source={{ uri: r.face_crop_url }}
                        style={styles.thumb}
                      />
                    ) : (
                      <View style={[styles.thumb, styles.thumbPlaceholder]}>
                        <Ionicons
                          name="person"
                          size={20}
                          color={colors.textMuted}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={[styles.recordName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {student.name || '—'}
                    </Text>
                    <Text style={[styles.recordRegNo, { color: colors.textMuted }]} numberOfLines={1}>
                      {student.reg_no || '—'}
                    </Text>
                  </View>
                  <Text style={[styles.recordTime, { color: colors.textSecondary }]}>{timeStr}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </GlassCard>
        </View>
      ))}
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
  backButton: {
    marginTop: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: staticColors.textPrimary,
    marginBottom: spacing.xs,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  dateSection: {
    marginBottom: spacing.xl,
  },
  dateHeading: {
    ...typography.label,
    color: staticColors.primary,
    marginBottom: spacing.md,
  },
  tableCard: {
    padding: 0,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  thumbContainer: {
    marginRight: spacing.md,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  thumbPlaceholder: {
    backgroundColor: staticColors.surfaceGlass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    ...typography.body,
    color: staticColors.textPrimary,
    fontWeight: '500',
  },
  recordRegNo: {
    ...typography.caption,
    color: staticColors.textMuted,
  },
  recordTime: {
    ...typography.bodySmall,
    color: staticColors.textSecondary,
    marginRight: spacing.sm,
  },
});
