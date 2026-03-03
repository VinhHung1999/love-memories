import { useState, useCallback, useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import type { AlertConfig } from '../../components/AlertModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import audioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  type RecordBackType,
  type PlayBackType,
} from 'react-native-audio-recorder-player';

import { momentsApi } from '../../lib/api';
import t from '../../locales/en';

const SPOTIFY_REGEX = /^https:\/\/open\.spotify\.com\/.+/;
// Token is stored in src/config/tokens.ts (gitignored). Copy tokens.example.ts to set it up.
import { MAPBOX_ACCESS_TOKEN as MAPBOX_TOKEN } from '../../config/tokens';

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

interface Props {
  momentId?: string | null;
  onClose: () => void;
}

export function useCreateMomentViewModel({ momentId, onClose }: Props) {
  const isEdit = !!momentId;
  const queryClient = useQueryClient();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // ── Photo state ─────────────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);

  // ── Audio state ─────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioPath, setRecordedAudioPath] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // ── Upload progress ─────────────────────────────────────────────────────────
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // ── Alert state ────────────────────────────────────────────────────────────
  const [alert, setAlert] = useState<AlertConfig>({ visible: false, title: '' });
  const showAlert = (config: Omit<AlertConfig, 'visible'>) =>
    setAlert({ ...config, visible: true });
  const dismissAlert = () => setAlert(prev => ({ ...prev, visible: false }));

  // Ref holds latest handleStopRecording to avoid stale closure
  const stopRecordingRef = useRef<() => Promise<void>>(async () => {});

  // ── Load existing data if editing ───────────────────────────────────────────
  const { data: existingMoment } = useQuery({
    queryKey: ['moment', momentId],
    queryFn: () => momentsApi.get(momentId!),
    enabled: isEdit,
    staleTime: 0,
  });

  useEffect(() => {
    if (existingMoment) {
      setTitle(existingMoment.title);
      setCaption(existingMoment.caption ?? '');
      setDate(new Date(existingMoment.date));
      setLocation(existingMoment.location ?? '');
      setTags(existingMoment.tags);
      setSpotifyUrl(existingMoment.spotifyUrl ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingMoment?.id]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = useCallback((): string | null => {
    if (!title.trim()) return t.moments.errors.titleRequired;
    if (title.trim().length > 200) return t.moments.errors.titleTooLong;
    if (spotifyUrl && !SPOTIFY_REGEX.test(spotifyUrl.trim()))
      return t.moments.errors.spotifyInvalid;
    return null;
  }, [title, spotifyUrl]);

  // ── Save mutation ───────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        caption: caption.trim() || undefined,
        date: date.toISOString(),
        location: location.trim() || undefined,
        latitude,
        longitude,
        tags,
        spotifyUrl: spotifyUrl.trim() || undefined,
      };

      const savedMoment = isEdit
        ? await momentsApi.update(momentId!, payload)
        : await momentsApi.create(payload);

      // Upload photos with progress tracking (non-blocking)
      const pendingPhotos = photos.filter(p => !p.uploaded);
      if (pendingPhotos.length > 0) {
        setUploadProgress({ done: 0, total: pendingPhotos.length });
        Promise.all(
          pendingPhotos.map(p =>
            momentsApi.uploadPhoto(savedMoment.id, p.uri, p.mimeType)
              .then(() => setUploadProgress(prev => prev ? { ...prev, done: prev.done + 1 } : null))
              .catch(() => setUploadProgress(prev => prev ? { ...prev, done: prev.done + 1 } : null)),
          ),
        ).then(() => {
          setUploadProgress(null);
          queryClient.invalidateQueries({ queryKey: ['moment', savedMoment.id] });
          queryClient.invalidateQueries({ queryKey: ['moments'] });
        });
      }

      // Upload audio in background
      if (recordedAudioPath) {
        momentsApi.uploadAudio(savedMoment.id, recordedAudioPath)
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
      showAlert({ type: 'error', title: t.common.error, message: err.message || t.moments.errors.saveFailed }),
  });

  // ── Location: GPS + Mapbox reverse geocode ──────────────────────────────────
  const handleGetCurrentLocation = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Allow access to your location to tag this moment',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        if (result !== PermissionsAndroid.RESULTS.GRANTED) return;
      } catch { return; }
    }

    setIsGettingLocation(true);
    Geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLatitude(lat);
        setLongitude(lng);
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,place,locality&language=vi`,
          );
          const data = await res.json() as { features?: Array<{ place_name?: string }> };
          const place = data.features?.[0]?.place_name;
          if (place) setLocation(place);
        } catch { /* keep coords without address */ }
        setIsGettingLocation(false);
      },
      () => {
        setIsGettingLocation(false);
        showAlert({ type: 'error', title: t.common.error, message: t.moments.errors.locationFailed });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleBack = onClose;

  const handleSave = () => {
    const error = validate();
    if (error) { showAlert({ type: 'error', title: t.common.error, message: error }); return; }
    if (saveMutation.isPending) return;
    saveMutation.mutate();
  };

  const handleAddPhotoFromLibrary = async () => {
    if (photos.length >= 10) {
      showAlert({ type: 'error', title: t.common.error, message: t.moments.errors.maxPhotos });
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
      selectionLimit: Math.min(10 - photos.length, 5),
    });
    if (result.didCancel || !result.assets) return;
    const newPhotos: LocalPhoto[] = result.assets
      .filter(a => a.uri)
      .map(a => ({ uri: a.uri!, mimeType: a.type ?? 'image/jpeg', uploaded: false }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const handleAddPhotoFromCamera = async () => {
    if (photos.length >= 10) return;
    const result = await launchCamera({ mediaType: 'photo', quality: 1 });
    if (result.didCancel || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setPhotos(prev => [
      ...prev,
      { uri: asset.uri!, mimeType: asset.type ?? 'image/jpeg', uploaded: false },
    ]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    setTags(prev => [...prev, tag]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(existing => existing !== tag));
  };

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleStopRecording = useCallback(async () => {
    try {
      const path = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      if (path) setRecordedAudioPath(path);
    } catch {
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
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
          showAlert({ type: 'error', title: t.common.error, message: t.moments.errors.micPermissionDenied });
          return;
        }
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
        if (e.currentPosition >= 300_000) {
          stopRecordingRef.current();
        }
      });
    } catch {
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      showAlert({ type: 'error', title: t.common.error, message: t.moments.errors.recordFailed });
    }
  };

  const handlePlayPreview = async () => {
    if (!recordedAudioPath) return;
    try {
      if (isPlayingPreview) {
        await audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
        setIsPlayingPreview(false);
        return;
      }
      setIsPlayingPreview(true);
      await audioRecorderPlayer.startPlayer(recordedAudioPath);
      audioRecorderPlayer.addPlayBackListener((e: PlayBackType) => {
        if (e.currentPosition >= e.duration && e.duration > 0) {
          setIsPlayingPreview(false);
          audioRecorderPlayer.removePlayBackListener();
        }
      });
    } catch {
      setIsPlayingPreview(false);
    }
  };

  const handleDeleteAudio = () => {
    if (isRecording) handleStopRecording();
    setRecordedAudioPath(null);
    setRecordingDuration(0);
    setIsPlayingPreview(false);
  };

  // ── Reset form — called on sheet dismiss to clear stale state ────────────────
  const resetForm = useCallback(async () => {
    if (isRecording) {
      await audioRecorderPlayer.stopRecorder().catch(() => {});
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
    }
    if (isPlayingPreview) {
      await audioRecorderPlayer.stopPlayer().catch(() => {});
      audioRecorderPlayer.removePlayBackListener();
      setIsPlayingPreview(false);
    }
    setTitle('');
    setCaption('');
    setDate(new Date());
    setLocation('');
    setLatitude(undefined);
    setLongitude(undefined);
    setTagInput('');
    setTags([]);
    setSpotifyUrl('');
    setShowDatePicker(false);
    setPhotos([]);
    setRecordedAudioPath(null);
    setRecordingDuration(0);
    setUploadProgress(null);
    setAlert({ visible: false, title: '' });
  }, [isRecording, isPlayingPreview]);

  return {
    isEdit,
    title, caption, date, location, tagInput, tags, spotifyUrl, showDatePicker, photos,
    isRecording, recordedAudioPath, recordingDuration, isPlayingPreview,
    isSaving: saveMutation.isPending,
    isGettingLocation,
    uploadProgress,

    // alert
    alert,
    dismissAlert,

    setTitle, setCaption, setLocation, setTagInput, setSpotifyUrl, setShowDatePicker,

    resetForm,
    handleBack, handleSave,
    handleAddPhotoFromLibrary, handleAddPhotoFromCamera, handleRemovePhoto,
    handleAddTag, handleRemoveTag, handleDateChange,
    handleStartRecording, handleStopRecording, handlePlayPreview, handleDeleteAudio,
    handleGetCurrentLocation,
  };
}
