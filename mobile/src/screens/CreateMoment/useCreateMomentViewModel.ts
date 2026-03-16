import { useCallback, useEffect, useRef, useReducer, useState } from 'react';
import { useUploadProgress } from '../../contexts/UploadProgressContext';
import { PermissionsAndroid, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import audioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  type RecordBackType,
  type PlayBackType,
} from 'react-native-audio-recorder-player';
import Geolocation from '@react-native-community/geolocation';

import { momentsApi, geocodeApi } from '../../lib/api';
import type { Moment } from '../../types';
import { useTranslation } from 'react-i18next';

export interface LocalPhoto {
  uri: string;
  mimeType: string;
  uploaded: boolean;
  remotePhotoId?: string;
}

export interface UploadProgress {
  done: number;
  total: number;
}

// ── Reducer ──────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  caption: string;
  date: Date;
  location: string;
  latitude: number | undefined;
  longitude: number | undefined;
  tagInput: string;
  tags: string[];
  spotifyUrl: string;
  showDatePicker: boolean;
  photos: LocalPhoto[];
  isRecording: boolean;
  recordedAudioPath: string | null;
  recordingDuration: number;
  isPlayingPreview: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: any }
  | { type: 'ADD_PHOTOS'; photos: LocalPhoto[] }
  | { type: 'REMOVE_PHOTO'; index: number }
  | { type: 'ADD_TAG'; tag: string }
  | { type: 'REMOVE_TAG'; tag: string }
  | { type: 'LOAD_EXISTING'; moment: Moment }
  | { type: 'INCREMENT_UPLOAD' }
  | { type: 'RESET' };

function makeInitialState(initialPhoto?: { uri: string; mimeType?: string }): FormState {
  return {
    title: '',
    caption: '',
    date: new Date(),
    location: '',
    latitude: undefined,
    longitude: undefined,
    tagInput: '',
    tags: [],
    spotifyUrl: '',
    showDatePicker: false,
    photos: initialPhoto
      ? [{ uri: initialPhoto.uri, mimeType: initialPhoto.mimeType ?? 'image/jpeg', uploaded: false }]
      : [],
    isRecording: false,
    recordedAudioPath: null,
    recordingDuration: 0,
    isPlayingPreview: false,
  };
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'ADD_PHOTOS':
      return { ...state, photos: [...state.photos, ...action.photos] };
    case 'REMOVE_PHOTO':
      return { ...state, photos: state.photos.filter((_, i) => i !== action.index) };
    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.tag], tagInput: '' };
    case 'REMOVE_TAG':
      return { ...state, tags: state.tags.filter(existing => existing !== action.tag) };
    case 'LOAD_EXISTING':
      return {
        ...state,
        title: action.moment.title,
        caption: action.moment.caption ?? '',
        date: new Date(action.moment.date),
        location: action.moment.location ?? '',
        latitude: action.moment.latitude ?? undefined,
        longitude: action.moment.longitude ?? undefined,
        tags: action.moment.tags,
        spotifyUrl: action.moment.spotifyUrl ?? '',
        photos: action.moment.photos.map(p => ({
          uri: p.url,
          mimeType: 'image/jpeg',
          uploaded: true,
          remotePhotoId: p.id,
        })),
      };
    case 'INCREMENT_UPLOAD':
      return state;
    case 'RESET':
      return makeInitialState();
    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface Props {
  momentId?: string | null;
  initialMoment?: Moment;
  initialPhoto?: { uri: string; mimeType?: string };
  onClose: () => void;
}

export function useCreateMomentViewModel({ momentId, initialMoment, initialPhoto, onClose }: Props) {
  const { t } = useTranslation();
  const isEdit = !!momentId;
  const queryClient = useQueryClient();
  const navigation = useAppNavigation();

  const [s, dispatch] = useReducer(formReducer, initialPhoto, makeInitialState);
  const { startUpload, incrementUpload } = useUploadProgress();
  const [isLocating, setIsLocating] = useState(false);

  // Ref holds latest handleStopRecording to avoid stale closure in RecordBackListener
  const stopRecordingRef = useRef<() => Promise<void>>(async () => {});

  // ── Auto-fill location on mount (new moments only, permission must already be granted) ──
  useEffect(() => {
    if (isEdit) return; // don't overwrite existing location on edit
    const autoDetect = async () => {
      // Check permission without requesting (don't interrupt user flow)
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (!granted) return;
      }
      setIsLocating(true);
      Geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude: lat, longitude: lng } = pos.coords;
            const result = await geocodeApi.reverse(lat, lng);
            const feature = result.features?.[0];
            if (feature?.place_name) {
              const clean = feature.place_name.replace(/,\s*\d{5,6}(?=\s*,|\s*$)/g, '').trim();
              dispatch({ type: 'SET_FIELD', field: 'location', value: clean });
              dispatch({ type: 'SET_FIELD', field: 'latitude', value: lat });
              dispatch({ type: 'SET_FIELD', field: 'longitude', value: lng });
            }
          } catch {
            // reverse geocode failed — leave empty
          } finally {
            setIsLocating(false);
          }
        },
        () => setIsLocating(false), // location fetch failed — silent
        { timeout: 8000, maximumAge: 60000 },
      );
    };
    autoDetect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load existing data if editing ───────────────────────────────────────────
  const { data: existingMoment } = useQuery({
    queryKey: ['moment', momentId],
    queryFn: () => momentsApi.get(momentId!),
    enabled: isEdit,
    staleTime: 0,
    initialData: initialMoment, // form fills instantly from nav params
  });

  useEffect(() => {
    if (existingMoment) {
      dispatch({ type: 'LOAD_EXISTING', moment: existingMoment });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingMoment?.id]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = useCallback((): string | null => {
    return null; // title auto-generated, no required fields
  }, []);

  // ── Save mutation ───────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Auto-generate title from date if not set (edit mode preserves existing title)
      const autoTitle = s.title.trim() || new Date(s.date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
      const payload = {
        title: autoTitle,
        caption: s.caption.trim() || undefined,
        date: s.date.toISOString(),
        location: s.location.trim() || undefined,
        latitude: s.latitude,
        longitude: s.longitude,
        tags: s.tags,
        spotifyUrl: s.spotifyUrl.trim() || undefined,
      };

      const savedMoment = isEdit
        ? await momentsApi.update(momentId!, payload)
        : await momentsApi.create(payload);

      // Upload photos with global progress tracking (non-blocking)
      const pendingPhotos = s.photos.filter(p => !p.uploaded);
      if (pendingPhotos.length > 0) {
        startUpload(pendingPhotos.length);
        Promise.all(
          pendingPhotos.map(p =>
            momentsApi.uploadPhoto(savedMoment.id, p.uri, p.mimeType)
              .then(() => incrementUpload())
              .catch(() => incrementUpload()),
          ),
        ).then(() => {
          queryClient.invalidateQueries({ queryKey: ['moment', savedMoment.id] });
          queryClient.invalidateQueries({ queryKey: ['moments'] });
        });
      }

      // Upload audio in background
      if (s.recordedAudioPath) {
        momentsApi.uploadAudio(savedMoment.id, s.recordedAudioPath)
          .then(() => queryClient.invalidateQueries({ queryKey: ['moment', savedMoment.id] }))
          .catch(() => null);
      }

      return savedMoment;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      queryClient.invalidateQueries({ queryKey: ['moment', saved.id] });
      onClose();
    },
    onError: (err: Error) =>
      navigation.showAlert({ type: 'error', title: t('common.error'), message: err.message || t('moments.errors.saveFailed') }),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleBack = onClose;

  const handleSave = () => {
    const error = validate();
    if (error) { navigation.showAlert({ type: 'error', title: t('common.error'), message: error }); return; }
    if (saveMutation.isPending) return;
    saveMutation.mutate();
  };

  const handleAddPhotoFromLibrary = async () => {
    if (s.photos.length >= 10) {
      navigation.showAlert({ type: 'error', title: t('common.error'), message: t('moments.errors.maxPhotos') });
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
      selectionLimit: Math.min(10 - s.photos.length, 5),
    });
    if (result.didCancel || !result.assets) return;
    const newPhotos: LocalPhoto[] = result.assets
      .filter(a => a.uri)
      .map(a => ({ uri: a.uri!, mimeType: a.type ?? 'image/jpeg', uploaded: false }));
    dispatch({ type: 'ADD_PHOTOS', photos: newPhotos });
  };

  const handleAddPhotoFromCamera = async () => {
    if (s.photos.length >= 10) return;
    const result = await launchCamera({ mediaType: 'photo', quality: 1 });
    if (result.didCancel || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    dispatch({ type: 'ADD_PHOTOS', photos: [{ uri: asset.uri!, mimeType: asset.type ?? 'image/jpeg', uploaded: false }] });
  };

  const handleRemovePhoto = (index: number) => {
    const photo = s.photos[index];
    if (photo.uploaded && photo.remotePhotoId && momentId) {
      momentsApi.deletePhoto(momentId, photo.remotePhotoId).catch(() => null);
    }
    dispatch({ type: 'REMOVE_PHOTO', index });
  };

  const handleAddTag = () => {
    const tag = s.tagInput.trim();
    if (!tag || s.tags.includes(tag) || s.tags.length >= 10) return;
    dispatch({ type: 'ADD_TAG', tag });
  };

  const handleRemoveTag = (tag: string) => {
    dispatch({ type: 'REMOVE_TAG', tag });
  };

  const handleStopRecording = useCallback(async () => {
    try {
      const path = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      dispatch({ type: 'SET_FIELD', field: 'isRecording', value: false });
      if (path) dispatch({ type: 'SET_FIELD', field: 'recordedAudioPath', value: path });
    } catch {
      audioRecorderPlayer.removeRecordBackListener();
      dispatch({ type: 'SET_FIELD', field: 'isRecording', value: false });
    }
  }, []);

  stopRecordingRef.current = handleStopRecording;

  const handleStartRecording = async () => {
    // Request mic permission on Android
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Allow access to your microphone to record a voice memo',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          navigation.showAlert({ type: 'error', title: t('common.error'), message: t('moments.errors.micPermissionDenied') });
          return;
        }
      } catch { return; }
    }

    try {
      dispatch({ type: 'SET_FIELD', field: 'isRecording', value: true });
      dispatch({ type: 'SET_FIELD', field: 'recordingDuration', value: 0 });
      await audioRecorderPlayer.startRecorder(undefined, {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: 'aac',
      });
      audioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
        dispatch({ type: 'SET_FIELD', field: 'recordingDuration', value: Math.floor(e.currentPosition / 1000) });
        if (e.currentPosition >= 300_000) {
          stopRecordingRef.current();
        }
      });
    } catch {
      audioRecorderPlayer.removeRecordBackListener();
      dispatch({ type: 'SET_FIELD', field: 'isRecording', value: false });
      navigation.showAlert({ type: 'error', title: t('common.error'), message: t('moments.errors.recordFailed') });
    }
  };

  const handlePlayPreview = async () => {
    if (!s.recordedAudioPath) return;
    try {
      if (s.isPlayingPreview) {
        await audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
        dispatch({ type: 'SET_FIELD', field: 'isPlayingPreview', value: false });
        return;
      }
      dispatch({ type: 'SET_FIELD', field: 'isPlayingPreview', value: true });
      await audioRecorderPlayer.startPlayer(s.recordedAudioPath);
      audioRecorderPlayer.addPlayBackListener((e: PlayBackType) => {
        if (e.currentPosition >= e.duration && e.duration > 0) {
          dispatch({ type: 'SET_FIELD', field: 'isPlayingPreview', value: false });
          audioRecorderPlayer.removePlayBackListener();
        }
      });
    } catch {
      dispatch({ type: 'SET_FIELD', field: 'isPlayingPreview', value: false });
    }
  };

  const handleDeleteAudio = () => {
    if (s.isRecording) handleStopRecording();
    dispatch({ type: 'SET_FIELD', field: 'recordedAudioPath', value: null });
    dispatch({ type: 'SET_FIELD', field: 'recordingDuration', value: 0 });
    dispatch({ type: 'SET_FIELD', field: 'isPlayingPreview', value: false });
  };

  // ── Reset form — called on sheet dismiss to clear stale state ────────────────
  const resetForm = useCallback(async () => {
    if (s.isRecording) {
      await audioRecorderPlayer.stopRecorder().catch(() => {});
      audioRecorderPlayer.removeRecordBackListener();
    }
    if (s.isPlayingPreview) {
      await audioRecorderPlayer.stopPlayer().catch(() => {});
      audioRecorderPlayer.removePlayBackListener();
    }
    dispatch({ type: 'RESET' });
  }, [s.isRecording, s.isPlayingPreview]);

  return {
    isEdit,
    title: s.title, caption: s.caption, date: s.date,
    location: s.location, latitude: s.latitude, longitude: s.longitude,
    isLocating,
    tagInput: s.tagInput, tags: s.tags, spotifyUrl: s.spotifyUrl,
    photos: s.photos,
    isRecording: s.isRecording, recordedAudioPath: s.recordedAudioPath,
    recordingDuration: s.recordingDuration, isPlayingPreview: s.isPlayingPreview,
    isSaving: saveMutation.isPending,

    setTitle: (v: string) => dispatch({ type: 'SET_FIELD', field: 'title', value: v }),
    setCaption: (v: string) => dispatch({ type: 'SET_FIELD', field: 'caption', value: v }),
    setDate: (v: Date) => dispatch({ type: 'SET_FIELD', field: 'date', value: v }),
    setTagInput: (v: string) => dispatch({ type: 'SET_FIELD', field: 'tagInput', value: v }),
    setSpotifyUrl: (v: string) => dispatch({ type: 'SET_FIELD', field: 'spotifyUrl', value: v }),
    handleLocationChange: (loc: string, lat?: number, lng?: number) => {
      dispatch({ type: 'SET_FIELD', field: 'location', value: loc });
      dispatch({ type: 'SET_FIELD', field: 'latitude', value: lat });
      dispatch({ type: 'SET_FIELD', field: 'longitude', value: lng });
    },

    resetForm,
    handleBack, handleSave,
    handleAddPhotoFromLibrary, handleAddPhotoFromCamera, handleRemovePhoto,
    handleAddTag, handleRemoveTag,
    handleStartRecording, handleStopRecording, handlePlayPreview, handleDeleteAudio,
  };
}
