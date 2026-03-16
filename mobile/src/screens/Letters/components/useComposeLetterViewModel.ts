import { useState, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary } from 'react-native-image-picker';
import audioRecorderPlayer, {
  type RecordBackType,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
} from 'react-native-audio-recorder-player';
import { loveLettersApi } from '../../../lib/api';
import { useUploadProgress } from '../../../contexts/UploadProgressContext';
import type { LoveLetter } from '../../../types';
import { useTranslation } from 'react-i18next';
export const MOODS = ['love', 'happy', 'miss', 'grateful', 'playful', 'romantic'] as const;
export type Mood = typeof MOODS[number];

interface PendingPhoto {
  uri: string;
  mimeType: string;
  localId: string;
}

export function useComposeLetterViewModel(onClose: () => void, initialLetter?: LoveLetter) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { startUpload, incrementUpload } = useUploadProgress();
  const stopRecordingRef = useRef<(() => void) | null>(null);

  // ── Text fields ──────────────────────────────────────────────────────────────
  const [draftId, setDraftId] = useState<string | undefined>(initialLetter?.id);
  const [title, setTitle] = useState(initialLetter?.title ?? '');
  const [content, setContent] = useState(initialLetter?.content ?? '');
  const [mood, setMood] = useState<string>(initialLetter?.mood ?? 'love');

  // ── Save/send state ──────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Photos ───────────────────────────────────────────────────────────────────
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const MAX_PHOTOS = 5;

  // ── Audio recording ──────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioPath, setRecordedAudioPath] = useState<string | null>(null);

  // ── Schedule delivery ────────────────────────────────────────────────────────
  const [scheduleMode, setScheduleMode] = useState(
    !!(initialLetter?.scheduledAt),
  );
  const [scheduledAt, setScheduledAt] = useState<Date | null>(
    initialLetter?.scheduledAt ? new Date(initialLetter.scheduledAt) : null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  // ── Core save/send flow ───────────────────────────────────────────────────────

  const executeFlow = useCallback(async (shouldSend: boolean) => {
    if (!isValid) return;
    shouldSend ? setIsSending(true) : setIsSaving(true);
    setError(null);
    try {
      const schedAt = scheduleMode && scheduledAt ? scheduledAt.toISOString() : undefined;

      let id = draftId;
      if (id) {
        await loveLettersApi.update(id, {
          title: title.trim(),
          content: content.trim(),
          mood,
          scheduledAt: schedAt ?? null,
        });
      } else {
        const letter = await loveLettersApi.create({
          title: title.trim(),
          content: content.trim(),
          mood,
          scheduledAt: schedAt,
        });
        id = letter.id;
        setDraftId(id);
      }

      // Upload photos in background
      if (pendingPhotos.length > 0) {
        const photos = [...pendingPhotos];
        setPendingPhotos([]);
        startUpload(photos.length);
        Promise.all(
          photos.map(p =>
            loveLettersApi.uploadPhoto(id!, p.uri, p.mimeType)
              .then(() => incrementUpload())
              .catch(() => incrementUpload()),
          ),
        ).then(() => {
          queryClient.invalidateQueries({ queryKey: ['letters'] });
          queryClient.invalidateQueries({ queryKey: ['letter', id] });
        });
      }

      // Upload audio in background
      if (recordedAudioPath) {
        const audioPath = recordedAudioPath;
        setRecordedAudioPath(null);
        loveLettersApi.uploadAudio(id!, audioPath)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['letters'] });
            queryClient.invalidateQueries({ queryKey: ['letter', id] });
          })
          .catch(() => null);
      }

      queryClient.invalidateQueries({ queryKey: ['letters'] });

      if (shouldSend) {
        await loveLettersApi.send(id!);
      }

      onClose();
    } catch (err: any) {
      if (err?.message?.includes('PREMIUM')) {
        // Layer 2 fallback: navigate Paywall — never show inline error for subscription blocks
        navigation.navigate('Paywall', { trigger: 'locked_module', blockedFeature: 'love-letters' });
      } else {
        setError(
          shouldSend
            ? t('loveLetters.errors.sendFailed')
            : t('loveLetters.errors.saveFailed'),
        );
      }
    } finally {
      setIsSaving(false);
      setIsSending(false);
    }
  }, [draftId, title, content, mood, isValid, scheduleMode, scheduledAt, pendingPhotos, recordedAudioPath, queryClient, onClose, startUpload, incrementUpload, t, navigation]);

  const saveDraft = useCallback(() => executeFlow(false), [executeFlow]);
  const sendNow = useCallback(() => executeFlow(true), [executeFlow]);

  // ── Photo handlers ────────────────────────────────────────────────────────────

  const handleAddPhoto = useCallback(async () => {
    if (pendingPhotos.length >= MAX_PHOTOS) return;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: MAX_PHOTOS - pendingPhotos.length,
    });
    if (result.didCancel || !result.assets) return;
    const toAdd: PendingPhoto[] = result.assets
      .filter(a => !!a.uri)
      .map(a => ({
        uri: a.uri!,
        mimeType: a.type ?? 'image/jpeg',
        localId: `${Date.now()}-${Math.random()}`,
      }));
    setPendingPhotos(prev => [...prev, ...toAdd].slice(0, MAX_PHOTOS));
  }, [pendingPhotos.length]);

  const handleRemovePhoto = useCallback((localId: string) => {
    setPendingPhotos(prev => prev.filter(p => p.localId !== localId));
  }, []);

  // ── Audio handlers ────────────────────────────────────────────────────────────

  const handleStopRecording = useCallback(async () => {
    try {
      const path = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      setRecordedAudioPath(path);
    } catch {
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
    }
  }, []);

  stopRecordingRef.current = handleStopRecording;

  const handleStartRecording = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          { title: 'Microphone', message: 'Allow microphone access to record a voice memo', buttonPositive: 'Allow', buttonNegative: 'Deny' },
        );
        if (result !== PermissionsAndroid.RESULTS.GRANTED) return;
      } catch { return; }
    }
    try {
      setIsRecording(true);
      setRecordingDuration(0);
      await audioRecorderPlayer.startRecorder(undefined, {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: 'aac',
      });
      audioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
        setRecordingDuration(Math.floor(e.currentPosition / 1000));
        if (e.currentPosition >= 30_000) {
          stopRecordingRef.current?.();
        }
      });
    } catch {
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
    }
  }, []);

  const handleDeleteAudio = useCallback(() => {
    if (isRecording) stopRecordingRef.current?.();
    setRecordedAudioPath(null);
    setRecordingDuration(0);
  }, [isRecording]);

  // ── Schedule handlers ─────────────────────────────────────────────────────────

  const toggleScheduleMode = useCallback(() => {
    setScheduleMode(prev => {
      if (prev) { setScheduledAt(null); setShowDatePicker(false); }
      else { setShowDatePicker(true); }
      return !prev;
    });
  }, []);

  const handleDateChange = useCallback((_: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setScheduledAt(date);
  }, []);

  return {
    title, setTitle,
    content, setContent,
    mood, setMood,
    draftId,
    isValid,
    isSaving,
    isSending,
    error,
    saveDraft,
    sendNow,

    // Photos
    pendingPhotos,
    maxPhotos: MAX_PHOTOS,
    handleAddPhoto,
    handleRemovePhoto,

    // Audio
    isRecording,
    recordingDuration,
    recordedAudioPath,
    handleStartRecording,
    handleStopRecording,
    handleDeleteAudio,

    // Schedule
    scheduleMode,
    scheduledAt,
    showDatePicker,
    setShowDatePicker,
    toggleScheduleMode,
    handleDateChange,
  };
}
