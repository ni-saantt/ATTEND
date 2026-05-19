import { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@attend/shared';

interface RecognizeResult {
  student_id: string | null;
  student_name: string | null;
  reg_no: string | null;
  confidence: number;
  face_crop_base64: string | null;
  bbox?: number[];
  unknown: boolean;
}

type CaptureMode = 'photo' | 'live';

export default function AttendanceCameraScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const rawParams = useLocalSearchParams<{ subject_id?: string; subject_name?: string; section_id?: string; section_name?: string; test_mode?: string }>();
  const params = {
    subject_id: Array.isArray(rawParams.subject_id) ? rawParams.subject_id[0] : rawParams.subject_id,
    subject_name: Array.isArray(rawParams.subject_name) ? rawParams.subject_name[0] : rawParams.subject_name,
    section_id: Array.isArray(rawParams.section_id) ? rawParams.section_id[0] : rawParams.section_id,
    section_name: Array.isArray(rawParams.section_name) ? rawParams.section_name[0] : rawParams.section_name,
    test_mode: Array.isArray(rawParams.test_mode) ? rawParams.test_mode[0] : rawParams.test_mode,
  };
  const isTestMode = params.test_mode === 'true';
  const { width: screenW, height: screenH } = useWindowDimensions();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted ?? false;
  const [mode, setMode] = useState<CaptureMode>(isTestMode ? 'photo' : 'live');
  const [results, setResults] = useState<RecognizeResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [liveOverlay, setLiveOverlay] = useState<{ results: RecognizeResult[]; imgW: number; imgH: number } | null>(null);
  const [acceptedStudentIds, setAcceptedStudentIds] = useState<Set<string>>(new Set());
  const [acceptedRecords, setAcceptedRecords] = useState<RecognizeResult[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [livePaused, setLivePaused] = useState(false);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureInProgressRef = useRef(false);
  const autoStartedRef = useRef(false);
  const resultsRef = useRef<RecognizeResult[]>([]);
  const acceptedRecordsRef = useRef<RecognizeResult[]>([]);
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);
  useEffect(() => {
    acceptedRecordsRef.current = acceptedRecords;
  }, [acceptedRecords]);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (!isTestMode && params.subject_id && mode === 'live' && !liveActive && hasPermission && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startLive();
    }
  }, [isTestMode, params.subject_id, mode, liveActive, hasPermission]);

  const getAuthHeaders = useCallback(() => {
    const token = require('@/store/auth').useAuthStore.getState().token;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const postRecognize = useCallback(
    async (formData: FormData, sid: string | null) => {
      const headers: Record<string, string> = { ...getAuthHeaders() };
      if (sid) formData.append('session_id', sid);
      const endpoint = isTestMode ? ENDPOINTS.RECOGNIZE_TEST : ENDPOINTS.RECOGNIZE;
      const { data } = await api.post<{ results: RecognizeResult[]; image_width?: number; image_height?: number }>(
        endpoint,
        formData,
        {
          headers,
          timeout: 60000,
          transformRequest: [
            (d: unknown, h: Record<string, string>) => {
              if (d instanceof FormData) {
                delete h['Content-Type'];
                return d;
              }
              return d;
            },
          ],
        }
      );
      return { results: data?.results ?? [], imgW: data?.image_width ?? 1, imgH: data?.image_height ?? 1 };
    },
    [getAuthHeaders, isTestMode]
  );

  const handleCapture = async () => {
    if (!camera.current || capturing || (!isTestMode && !params.subject_id)) return;
    setCapturing(true);
    setLoading(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 1 });
      if (!photo?.uri) throw new Error('No photo captured');
      const formData = new FormData();
      if (!isTestMode && params.subject_id) formData.append('subject_id', params.subject_id);
      if (!isTestMode && params.section_id) formData.append('section_id', params.section_id);
      formData.append('image', {
        uri: photo.uri.startsWith('file://') ? photo.uri : `file://${photo.uri}`,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as unknown as Blob);
      const { results: list } = await postRecognize(formData, null);
      setResults(list);
      setSelected(new Set(list.map((_, i) => i).filter((i) => !list[i].unknown)));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string | unknown[] }; status?: number }; message?: string };
      let msg = 'Please try again.';
      if (ax?.response?.data?.detail) {
        const d = ax.response.data.detail;
        msg = Array.isArray(d) ? (d[0] as { msg?: string })?.msg ?? JSON.stringify(d) : String(d);
      } else if (ax?.message) {
        msg = ax.message;
      }
      Alert.alert('Recognition Failed', msg);
    } finally {
      setLoading(false);
      setCapturing(false);
    }
  };

  const startLive = async () => {
    if ((!isTestMode && !params.subject_id) || liveActive) return;
    try {
      setLiveOverlay(null);
      setAcceptedStudentIds(new Set());
      setAcceptedRecords([]);
      setLivePaused(false);
      if (isTestMode) {
        setLiveActive(true);
        setSessionId('test');
        setResults([]);
        setSelected(new Set());
      } else {
        const { data } = await api.post<{ session_id: string }>(
          ENDPOINTS.RECOGNIZE_STREAM_START,
          {},
          { headers: getAuthHeaders() }
        );
        setSessionId(data?.session_id ?? null);
        setLiveActive(true);
        setResults([]);
        setSelected(new Set());
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : String(err);
      Alert.alert('Failed to start live', msg ?? 'Please try again.');
    }
  };

  const captureLiveFrame = useCallback(async () => {
    if (!camera.current || !sessionId || (!isTestMode && !params.subject_id)) return;
    if (captureInProgressRef.current) return;
    captureInProgressRef.current = true;
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) return;
      const formData = new FormData();
      if (!isTestMode) {
        formData.append('session_id', sessionId);
        formData.append('subject_id', params.subject_id!);
        if (params.section_id) formData.append('section_id', params.section_id);
      }
      formData.append('image', {
        uri: photo.uri.startsWith('file://') ? photo.uri : `file://${photo.uri}`,
        type: 'image/jpeg',
        name: 'frame.jpg',
      } as unknown as Blob);
      const endpoint = isTestMode ? ENDPOINTS.RECOGNIZE_TEST : ENDPOINTS.RECOGNIZE_STREAM;
      const { data } = await api.post<{ results: RecognizeResult[]; image_width?: number; image_height?: number }>(
        endpoint,
        formData,
        {
          headers: getAuthHeaders(),
          timeout: 60000,
          transformRequest: [
            (d: unknown, h: Record<string, string>) => {
              if (d instanceof FormData) {
                delete h['Content-Type'];
                return d;
              }
              return d;
            },
          ],
        }
      );
      const newResults = data?.results ?? [];
      const imgW = Math.max(1, data?.image_width ?? 1);
      const imgH = Math.max(1, data?.image_height ?? 1);
      setLiveOverlay({ results: newResults, imgW, imgH });
      if (newResults.some((r) => !r.unknown)) {
        setLivePaused(true);
      }
      setResults((prev) => {
        const byId = new Map<string | number, RecognizeResult>();
        prev.forEach((r, i) => {
          const key = r.student_id ?? `unknown-${i}`;
          if (!byId.has(key)) byId.set(key, r);
        });
        newResults.forEach((r) => {
          const key = r.student_id ?? `unknown-${Date.now()}`;
          if (r.student_id && (!byId.has(r.student_id) || (byId.get(r.student_id)?.confidence ?? 0) < r.confidence)) {
            byId.set(r.student_id, r);
          } else if (r.unknown) {
            byId.set(key, r);
          }
        });
        const merged = Array.from(byId.values());
        return merged.filter((r) => !r.unknown).concat(merged.filter((r) => r.unknown));
      });
    } catch {
      // Ignore frame errors during live
    } finally {
      captureInProgressRef.current = false;
    }
  }, [sessionId, params.subject_id, getAuthHeaders, isTestMode]);

  const resumeLive = useCallback(() => {
    setLiveOverlay(null);
    setLivePaused(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (liveActive && acceptedRecords.length > 0) {
      stopLive();
    } else {
      Alert.alert(
        'Exit attendance?',
        'Are you sure you want to exit from attendance? Any unsaved data will be lost.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              if (liveActive) {
                setLiveActive(false);
                if (liveIntervalRef.current) {
                  clearInterval(liveIntervalRef.current);
                  liveIntervalRef.current = null;
                }
                if (sessionId && !isTestMode) {
                  const fd = new FormData();
                  fd.append('session_id', sessionId);
                  api.post(ENDPOINTS.RECOGNIZE_STREAM_END, fd, {
                    headers: getAuthHeaders(),
                    transformRequest: [(d: unknown, h: Record<string, string>) => {
                      if (d instanceof FormData) { delete h['Content-Type']; }
                      return d;
                    }],
                  }).catch(() => {});
                }
                setSessionId(null);
                setLiveOverlay(null);
                setLivePaused(false);
              }
              setResults([]);
              setSelected(new Set());
              setAcceptedStudentIds(new Set());
              setAcceptedRecords([]);
              router.back();
            },
          },
        ]
      );
    }
  }, [liveActive, acceptedRecords.length, stopLive]);

  const handleAcceptLive = useCallback(
    async (r: RecognizeResult) => {
      if (!r.student_id || r.unknown || !params.subject_id || isTestMode) return;
      if (acceptedStudentIds.has(r.student_id)) return;
      setAcceptingId(r.student_id);
      try {
        await api.post(ENDPOINTS.ATTENDANCE, {
          records: [
            {
              student_id: r.student_id,
              subject_id: params.subject_id,
              section_id: params.section_id || undefined,
              confidence: r.confidence,
              face_crop_base64: r.face_crop_base64 ?? undefined,
            },
          ],
        });
        setAcceptedStudentIds((prev) => new Set(prev).add(r.student_id));
        setAcceptedRecords((prev) => [...prev, r]);
        setLiveOverlay((ov) =>
          ov ? { ...ov, results: ov.results.filter((x) => x.student_id !== r.student_id) } : null
        );
        if (params.subject_id) {
          queryClient.invalidateQueries({ queryKey: ['attendance-list', params.subject_id] });
          queryClient.invalidateQueries({ queryKey: ['subjects-with-reports'] });
        }
      } catch {
        Alert.alert('Failed', 'Could not save attendance.');
      } finally {
        setAcceptingId(null);
      }
    },
    [params.subject_id, isTestMode, acceptedStudentIds, queryClient]
  );

  useEffect(() => {
    if (liveActive && sessionId && !livePaused) {
      captureLiveFrame();
      liveIntervalRef.current = setInterval(captureLiveFrame, 1200);
    }
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [liveActive, sessionId, livePaused, captureLiveFrame]);

  const stopLive = async () => {
    setLiveActive(false);
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    if (sessionId && !isTestMode) {
      try {
        const formData = new FormData();
        formData.append('session_id', sessionId);
        await api.post(ENDPOINTS.RECOGNIZE_STREAM_END, formData, {
          headers: getAuthHeaders(),
          transformRequest: [
            (d: unknown, h: Record<string, string>) => {
              if (d instanceof FormData) {
                delete h['Content-Type'];
                return d;
              }
              return d;
            },
          ],
        });
      } catch {
        // Ignore
      }
    }
    setSessionId(null);
    setLiveOverlay(null);
    setLivePaused(false);
    const latest = resultsRef.current;
    const pending = latest.filter((r) => !r.unknown && r.student_id && !acceptedStudentIds.has(r.student_id));
    const accepted = acceptedRecordsRef.current;
    setResults([...accepted, ...pending]);
    setSelected(new Set(pending.map((_, i) => accepted.length + i)));
  };

  const toggleSelected = (index: number) => {
    if (results[index].unknown) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSave = async () => {
    if (!params.subject_id || selected.size === 0) {
      Alert.alert('No students selected', 'Select at least one student to mark attendance.');
      return;
    }
    setSaving(true);
    try {
      const records = Array.from(selected)
        .map((i) => results[i])
        .filter((r) => r.student_id && !acceptedStudentIds.has(r.student_id))
        .map((r) => ({
          student_id: r.student_id!,
          subject_id: params.subject_id!,
          section_id: params.section_id || undefined,
          confidence: r.confidence,
          face_crop_base64: r.face_crop_base64 ?? undefined,
        }));
      await api.post(ENDPOINTS.ATTENDANCE, { records });
      if (params.subject_id) {
        queryClient.invalidateQueries({ queryKey: ['attendance-list', params.subject_id] });
        queryClient.invalidateQueries({ queryKey: ['subjects-with-reports'] });
      }
      Alert.alert('Saved', `${records.length} attendance record(s) saved.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : String(err);
      Alert.alert('Save Failed', msg ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    setResults([]);
    setSelected(new Set());
    setAcceptedStudentIds(new Set());
    setAcceptedRecords([]);
    autoStartedRef.current = false;
    if (!isTestMode && params.subject_id && mode === 'live') {
      startLive();
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required for attendance.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (results.length > 0 && !liveActive) {
    const savedCount = results.filter((r) => r.student_id && acceptedStudentIds.has(r.student_id)).length;
    const pendingCount = results.length - savedCount;
    return (
      <View style={styles.container}>
        <ScrollView style={styles.resultsList}>
          <Text style={styles.resultsTitle}>
            {savedCount > 0
              ? pendingCount > 0
                ? `Final list (${savedCount} saved, ${pendingCount} to save)`
                : `All saved (${savedCount} attendance records)`
              : isTestMode
                ? 'Test Results'
                : 'Recognized'} ({results.length})
          </Text>
          {results.map((r, i) => {
            const isSaved = r.student_id && acceptedStudentIds.has(r.student_id);
            const RowWrapper = !isTestMode && !r.unknown && !isSaved ? TouchableOpacity : View;
            return (
              <RowWrapper
                key={i}
                style={[
                  styles.resultRow,
                  !isTestMode && selected.has(i) && !isSaved && styles.resultRowSelected,
                  r.unknown && styles.resultRowDisabled,
                ]}
                onPress={!isTestMode && !r.unknown && !isSaved ? () => toggleSelected(i) : undefined}
              >
                {r.face_crop_base64 && (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${r.face_crop_base64}` }}
                    style={styles.faceThumb}
                  />
                )}
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>
                    {r.unknown ? 'Unknown' : `${r.student_name ?? ''} (${r.reg_no ?? ''})`}
                  </Text>
                  {!r.unknown && (
                    <Text style={styles.resultConf}>
                      {isSaved ? 'Saved' : `${(r.confidence * 100).toFixed(0)}% match`}
                    </Text>
                  )}
                </View>
                {!isTestMode && !r.unknown && !isSaved && (
                  <Text style={styles.check}>{selected.has(i) ? '✓' : ''}</Text>
                )}
                {isSaved && <Text style={styles.savedBadge}>✓</Text>}
              </RowWrapper>
            );
          })}
        </ScrollView>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleRetake}>
            <Text style={styles.secondaryBtnText}>{isTestMode ? 'Test Again' : 'Retake'}</Text>
          </TouchableOpacity>
          {!isTestMode && (
            pendingCount > 0 ? (
              <TouchableOpacity
                style={[styles.primaryBtn, (saving || selected.size === 0) && styles.primaryBtnDisabled]}
                onPress={handleSave}
                disabled={saving || selected.size === 0}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save ({selected.size})</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  queryClient.invalidateQueries({ queryKey: ['subjects-with-reports'] });
                  if (params.subject_id) {
                    queryClient.invalidateQueries({ queryKey: ['attendance-list', params.subject_id] });
                  }
                  router.back();
                }}
              >
                <Text style={styles.primaryBtnText}>Done ({savedCount} saved)</Text>
              </TouchableOpacity>
            )
          )}
          {isTestMode && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const recognizedForAccept =
    liveActive && liveOverlay
      ? liveOverlay.results.filter((r) => !r.unknown && r.student_id && !acceptedStudentIds.has(r.student_id))
      : [];

  return (
    <View style={styles.container}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing={facing}
      />
      {liveActive && liveOverlay && liveOverlay.results.length > 0 && (
        <View style={[styles.faceOverlay, { width: screenW, height: screenH }]} pointerEvents="box-none">
          {liveOverlay.results.map((r, i) => {
            if (!r.bbox || r.bbox.length < 4) return null;
            const [x1, y1, x2, y2] = r.bbox;
            const scale = Math.min(screenW / liveOverlay.imgW, screenH / liveOverlay.imgH);
            const padX = (screenW - liveOverlay.imgW * scale) / 2;
            const padY = (screenH - liveOverlay.imgH * scale) / 2;
            const left = padX + x1 * scale;
            const top = padY + y1 * scale;
            const w = (x2 - x1) * scale;
            const h = (y2 - y1) * scale;
            const label = r.unknown ? 'Unknown' : `${r.student_name ?? ''} (${r.reg_no ?? ''})`;
            const canAccept = !r.unknown && r.student_id && !acceptedStudentIds.has(r.student_id) && !isTestMode;
            const boxContent = (
              <>
                <View
                  style={[
                    styles.faceBox,
                    {
                      width: w,
                      height: h,
                      borderColor: r.unknown ? '#FF3B30' : '#34C759',
                    },
                  ]}
                />
                <View style={[styles.faceLabel, { minWidth: w }]}>
                  <Text style={styles.faceLabelText} numberOfLines={1}>{label}</Text>
                  {canAccept && (
                    <View style={styles.faceAcceptBtn}>
                      {acceptingId === r.student_id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.faceAcceptBtnText}>Accept</Text>
                      )}
                    </View>
                  )}
                </View>
              </>
            );
            return (
              <View key={`${r.student_id ?? 'u'}-${i}`} style={[styles.faceBoxWrapper, { left, top }]}>
                {canAccept ? (
                  <TouchableOpacity
                    onPress={() => handleAcceptLive(r)}
                    disabled={acceptingId === r.student_id}
                    activeOpacity={0.9}
                    style={styles.faceBoxTouchable}
                  >
                    {boxContent}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.faceBoxTouchable}>{boxContent}</View>
                )}
              </View>
            );
          })}
        </View>
      )}
      {liveActive && !isTestMode && recognizedForAccept.length > 0 && (
        <ScrollView
          horizontal
          style={styles.acceptChips}
          contentContainerStyle={styles.acceptChipsContent}
          showsHorizontalScrollIndicator={false}
        >
          {recognizedForAccept.map((r, i) => (
            <TouchableOpacity
              key={r.student_id ?? i}
              style={styles.acceptChip}
              onPress={() => handleAcceptLive(r)}
              disabled={acceptingId === r.student_id}
            >
              {r.face_crop_base64 && (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${r.face_crop_base64}` }}
                  style={styles.acceptChipThumb}
                />
              )}
              <Text style={styles.acceptChipName} numberOfLines={1}>
                {r.student_name ?? ''} ({r.reg_no ?? ''})
              </Text>
              <Text style={styles.acceptChipConf}>{(r.confidence * 100).toFixed(0)}%</Text>
              <TouchableOpacity
                style={styles.acceptChipBtn}
                onPress={() => handleAcceptLive(r)}
                disabled={acceptingId === r.student_id}
              >
                {acceptingId === r.student_id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.acceptChipBtnText}>Accept</Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <TouchableOpacity
        style={styles.flipBtn}
        onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
      >
        <Text style={styles.flipBtnText}>Flip camera</Text>
      </TouchableOpacity>
      <View style={styles.overlay}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'photo' && styles.modeBtnActive]}
            onPress={() => setMode('photo')}
          >
            <Text style={[styles.modeBtnText, mode === 'photo' && styles.modeBtnTextActive]}>
              Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'live' && styles.modeBtnActive]}
            onPress={() => setMode('live')}
          >
            <Text style={[styles.modeBtnText, mode === 'live' && styles.modeBtnTextActive]}>
              Live
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          {isTestMode
            ? 'Test recognition – capture or start live'
            : params.subject_name
              ? `${params.subject_name}${params.section_name ? ` (${params.section_name})` : ''}${acceptedRecords.length > 0 ? ` • Saved: ${acceptedRecords.length}` : ''}${livePaused ? ' • Tap Continue to scan more' : ''}`
              : 'Capture classroom'}
        </Text>
        {mode === 'photo' ? (
          loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 24 }} />
          ) : (
            <TouchableOpacity
              style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
              onPress={handleCapture}
              disabled={capturing}
            >
              <Text style={styles.captureBtnText}>{capturing ? '...' : 'Capture'}</Text>
            </TouchableOpacity>
          )
        ) : liveActive ? (
          <View style={styles.liveActions}>
            {livePaused ? (
              <TouchableOpacity style={styles.continueBtn} onPress={resumeLive}>
                <Text style={styles.continueBtnText}>Continue</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.liveBtn, livePaused && styles.liveBtnSecondary]}
              onPress={stopLive}
            >
              <Text style={styles.liveBtnText}>Stop Live</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.captureBtn} onPress={startLive}>
            <Text style={styles.captureBtnText}>Start Live</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
          <Text style={styles.backBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  faceOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  faceBoxWrapper: {
    position: 'absolute',
    alignItems: 'flex-start',
  },
  faceBoxTouchable: {
    alignItems: 'flex-start',
  },
  faceBox: {
    borderWidth: 3,
    borderRadius: 4,
  },
  faceLabel: {
    marginTop: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
  },
  faceLabelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  faceAcceptBtn: {
    marginTop: 4,
    backgroundColor: '#34C759',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  faceAcceptBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  acceptChips: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    maxHeight: 120,
  },
  acceptChipsContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  acceptChip: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 12,
    padding: 12,
    width: 140,
    marginRight: 12,
    alignItems: 'center',
  },
  acceptChipThumb: { width: 48, height: 48, borderRadius: 24, marginBottom: 6 },
  acceptChipName: { color: '#fff', fontSize: 12, fontWeight: '600' },
  acceptChipConf: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  acceptChipBtn: {
    marginTop: 8,
    backgroundColor: '#34C759',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  acceptChipBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  flipBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    zIndex: 10,
  },
  flipBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 48,
  },
  modeToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    padding: 4,
  },
  modeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modeBtnActive: { backgroundColor: '#007AFF' },
  modeBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },
  liveActions: { gap: 12 },
  continueBtn: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  liveBtn: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  liveBtnSecondary: { backgroundColor: 'rgba(255,59,48,0.8)' },
  liveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hint: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  captureBtn: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  captureBtnDisabled: { opacity: 0.6 },
  captureBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backBtn: { marginTop: 12, alignItems: 'center' },
  backBtnText: { color: 'rgba(255,255,255,0.9)', fontSize: 16 },
  resultsList: { flex: 1, padding: 16 },
  resultsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  resultsSectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, opacity: 0.8 },
  savedBadge: { fontSize: 18, color: '#34C759', fontWeight: '700' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
  },
  resultRowSelected: { borderColor: '#007AFF', backgroundColor: 'rgba(0,122,255,0.1)' },
  resultRowDisabled: { opacity: 0.6 },
  faceThumb: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '500' },
  resultConf: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  check: { fontSize: 18, color: '#007AFF' },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  message: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
