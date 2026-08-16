import { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  View,
  Text,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@attend/shared';
import { GlassButton } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography, borderRadius } from '@/theme';

const POSES = ['front', 'left', 'right'] as const;
const POSE_STEPS: Record<
  (typeof POSES)[number],
  { title: string; instruction: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  front: {
    title: '1 of 3: Front',
    instruction:
      'Look straight at the camera. Keep your face centered and fully visible.',
    icon: 'person',
  },
  left: {
    title: '2 of 3: Left',
    instruction:
      'Turn your head about 30° to your LEFT. Keep your face in frame.',
    icon: 'arrow-back',
  },
  right: {
    title: '3 of 3: Right',
    instruction:
      'Turn your head about 30° to your RIGHT. Keep your face in frame.',
    icon: 'arrow-forward',
  },
};

export default function EnrollCameraScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const rawParams = useLocalSearchParams<{
    reg_no: string | string[];
    name: string | string[];
    college_id: string | string[];
    department_id: string | string[];
  }>();
  const params = {
    reg_no: Array.isArray(rawParams.reg_no)
      ? rawParams.reg_no[0]
      : rawParams.reg_no,
    name: Array.isArray(rawParams.name) ? rawParams.name[0] : rawParams.name,
    college_id: Array.isArray(rawParams.college_id)
      ? rawParams.college_id[0]
      : rawParams.college_id,
    department_id: Array.isArray(rawParams.department_id)
      ? rawParams.department_id[0]
      : rawParams.department_id,
  };
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted ?? false;
  const [currentPose, setCurrentPose] = useState(0);
  const [photos, setPhotos] = useState<{ path: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useFocusEffect(
    useCallback(() => {
      setCurrentPose(0);
      setPhotos([]);
    }, [])
  );

  const handleCapture = async () => {
    if (!camera.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 1 });
      if (!photo?.uri) throw new Error('No photo captured');
      const newPhotos = [...photos, { path: photo.uri }];
      setPhotos(newPhotos);
      if (currentPose < POSES.length - 1) {
        setCurrentPose((i) => i + 1);
      } else {
        await submitEnrollment(newPhotos);
      }
    } catch (e) {
      Alert.alert('Capture Failed', String(e));
    } finally {
      setCapturing(false);
    }
  };

  const submitEnrollment = async (photoPaths: { path: string }[]) => {
    if (
      photoPaths.length !== 3 ||
      !params.reg_no ||
      !params.name ||
      !params.college_id ||
      !params.department_id
    ) {
      Alert.alert('Error', 'Missing data. Please go back and try again.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('reg_no', params.reg_no);
      formData.append('name', params.name);
      formData.append('college_id', params.college_id);
      formData.append('department_id', params.department_id);
      const toFile = (uri: string, name: string) => ({
        uri: uri.startsWith('file://')
          ? uri
          : uri.startsWith('/')
          ? `file://${uri}`
          : uri,
        type: 'image/jpeg',
        name,
      });
      formData.append(
        'front',
        toFile(photoPaths[0].path, 'front.jpg') as unknown as Blob
      );
      formData.append(
        'left',
        toFile(photoPaths[1].path, 'left.jpg') as unknown as Blob
      );
      formData.append(
        'right',
        toFile(photoPaths[2].path, 'right.jpg') as unknown as Blob
      );

      const token = require('@/store/auth').useAuthStore.getState().token;
      const res = await fetch(`${api.defaults.baseURL}${ENDPOINTS.ENROLL_STUDENT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        let errData;
        try { errData = await res.json(); } catch (e) {}
        throw { response: { status: res.status, data: errData }, message: errData?.detail || 'Connection failed' };
      }
      Alert.alert('Success', `${params.name} enrolled successfully.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { detail?: string }; status?: number };
        message?: string;
      };
      let msg = 'Please try again.';
      if (ax?.response?.data?.detail) {
        msg = ax.response.data.detail;
      } else if (ax?.response?.status === 400) {
        msg =
          ax?.response?.data?.detail ??
          'Invalid images. Ensure face is clearly visible in all 3 photos.';
      } else if (
        ax?.message?.toLowerCase().includes('network') ||
        !ax?.response
      ) {
        msg =
          'Connection failed. Check that your phone and computer are on the same Wi‑Fi, the backend is running, and the IP in apps/mobile/lib/api.ts matches your computer.';
      }
      const isFaceError =
        msg.toLowerCase().includes('face') ||
        msg.toLowerCase().includes('detected');
      Alert.alert(
        'Enrollment Failed',
        msg,
        isFaceError
          ? [
              {
                text: 'Retake Photos',
                onPress: () => {
                  setPhotos([]);
                  setCurrentPose(0);
                },
              },
              { text: 'Cancel', onPress: () => router.back() },
            ]
          : [
              { text: 'Retry', onPress: () => submitEnrollment(photoPaths) },
              { text: 'Cancel', onPress: () => router.back() },
            ]
      );
    } finally {
      setLoading(false);
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
          Camera permission is required for enrollment.
        </Text>
        <GlassButton variant="primary" size="lg" onPress={requestPermission}>
          Grant Permission
        </GlassButton>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Enrolling student...</Text>
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
          <Ionicons name="camera-reverse" size={20} color={colors.textPrimary} />
          <Text style={styles.flipBtnText}>Flip</Text>
        </BlurView>
      </TouchableOpacity>

      <View style={styles.overlay}>
        <BlurView intensity={60} tint="dark" style={styles.instructionCard}>
          <View style={styles.poseIconContainer}>
            <Ionicons
              name={POSE_STEPS[POSES[currentPose]].icon}
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.stepTitle}>
            {POSE_STEPS[POSES[currentPose]].title}
          </Text>
          <Text style={styles.instruction}>
            {POSE_STEPS[POSES[currentPose]].instruction}
          </Text>
          <Text style={styles.tip}>Good lighting • Face clearly visible</Text>
        </BlurView>

        <View style={styles.progressContainer}>
          {POSES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressDot,
                idx <= currentPose && styles.progressDotActive,
                idx < photos.length && styles.progressDotComplete,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={capturing}
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
    color: staticColors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    ...typography.body,
    color: staticColors.textMuted,
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
    marginBottom: spacing.lg,
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: staticColors.surfaceGlass,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  progressDotActive: {
    borderColor: staticColors.primary,
  },
  progressDotComplete: {
    backgroundColor: staticColors.primary,
    borderColor: staticColors.primary,
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
