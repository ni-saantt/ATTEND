import { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  View,
  Text,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@attend/shared';
import { GlassButton } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography, borderRadius } from '@/theme';

const POSE_INSTRUCTIONS: Record<
  string,
  { title: string; instruction: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  left: {
    title: 'Left Face',
    instruction:
      'Turn your head about 30° to your LEFT. Keep your face in frame.',
    icon: 'arrow-back',
  },
  right: {
    title: 'Right Face',
    instruction:
      'Turn your head about 30° to your RIGHT. Keep your face in frame.',
    icon: 'arrow-forward',
  },
};

export default function AddFaceCameraScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { studentId, pose } = useLocalSearchParams<{
    studentId: string;
    pose: string;
  }>();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted ?? false;
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');

  const poseKey = pose === 'left' || pose === 'right' ? pose : 'left';
  const { title, instruction, icon } =
    POSE_INSTRUCTIONS[poseKey] ?? POSE_INSTRUCTIONS.left;

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const handleCapture = async () => {
    if (!camera.current || capturing || uploading || !studentId) return;
    setCapturing(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 1 });
      if (!photo?.uri) throw new Error('No photo captured');

      setCapturing(false);
      setUploading(true);

      const sid = Array.isArray(studentId) ? studentId[0] : studentId;
      if (!sid) throw new Error('Missing student');

      const formData = new FormData();
      const uri = photo.uri.startsWith('file://')
        ? photo.uri
        : photo.uri.startsWith('/')
        ? `file://${photo.uri}`
        : photo.uri;
      const file = {
        uri,
        type: 'image/jpeg',
        name: `${poseKey}.jpg`,
      } as unknown as Blob;

      if (poseKey === 'left') {
        formData.append('left', file);
      } else {
        formData.append('right', file);
      }

      const res = await fetch(`${api.defaults.baseURL}${ENDPOINTS.addStudentFace(sid)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${require('@/store/auth').useAuthStore.getState().token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        let errData;
        try { errData = await res.json(); } catch (e) {}
        throw { response: { status: res.status, data: errData }, message: errData?.detail || 'Upload failed' };
      }

      Alert.alert('Success', `${title} added successfully.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      const err = e as Error & { response?: { data?: { detail?: string }; status?: number }; code?: string };
      const isNetworkError = !err?.response || err?.code === 'ECONNABORTED' || err?.code === 'ERR_NETWORK' || String(err?.message ?? '').toLowerCase().includes('network');
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Upload failed';
      const fullMsg = isNetworkError
        ? `${msg}\n\nEnsure your phone and computer are on the same Wi‑Fi, the backend is running, and the IP in apps/mobile/lib/api.ts matches your computer.`
        : msg;
      Alert.alert('Failed', fullMsg);
    } finally {
      setCapturing(false);
      setUploading(false);
    }
  };

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!hasPermission) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Camera permission is required.
        </Text>
        <GlassButton variant="primary" size="lg" onPress={requestPermission}>
          Grant Permission
        </GlassButton>
      </View>
    );
  }

  if (uploading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Uploading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing} />

      <TouchableOpacity
        style={styles.flipBtn}
        onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
      >
        <BlurView intensity={40} tint="dark" style={styles.flipBtnBlur}>
          <Ionicons
            name="camera-reverse"
            size={20}
            color={colors.textPrimary}
          />
          <Text style={styles.flipBtnText}>Flip</Text>
        </BlurView>
      </TouchableOpacity>

      <View style={styles.overlay}>
        <BlurView intensity={60} tint="dark" style={styles.instructionCard}>
          <View style={styles.poseIconContainer}>
            <Ionicons name={icon} size={28} color={colors.primary} />
          </View>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={styles.instruction}>{instruction}</Text>
          <Text style={styles.tip}>Good lighting • Face clearly visible</Text>
        </BlurView>

        <TouchableOpacity
          style={[
            styles.captureBtn,
            (capturing || uploading) && styles.captureBtnDisabled,
          ]}
          onPress={handleCapture}
          disabled={capturing || uploading}
          activeOpacity={0.8}
        >
          <View style={styles.captureBtnInner}>
            {capturing ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Ionicons name="camera" size={32} color={colors.textOnPrimary} />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.lg,
  },
  flipBtn: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    zIndex: 10,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  flipBtnBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  flipBtnText: {
    ...typography.buttonSmall,
    color: staticColors.textPrimary,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  instructionCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    alignItems: 'center',
  },
  poseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 200, 83, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepTitle: {
    ...typography.h3,
    color: staticColors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  instruction: {
    ...typography.body,
    color: staticColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  tip: {
    ...typography.caption,
    color: staticColors.textMuted,
    textAlign: 'center',
  },
  captureBtn: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: staticColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 4,
    borderColor: staticColors.glow,
  },
  captureBtnDisabled: {
    opacity: 0.6,
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: staticColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    alignItems: 'center',
  },
  cancelBtnText: {
    ...typography.body,
    color: staticColors.textSecondary,
  },
});
