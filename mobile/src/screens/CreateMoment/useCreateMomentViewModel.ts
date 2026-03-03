import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import audioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  type RecordBackType,
  type PlayBackType,
} from 'react-native-audio-recorder-player';
import type { MomentsStackParamList } from '../../navigation';
import { momentsApi } from '../../lib/api';
import t from '../../locales/en';

type Nav = NativeStackNavigationProp<MomentsStackParamList>;
type Route = RouteProp<MomentsStackParamList, 'CreateMoment'>;

const SPOTIFY_REGEX = /^https:\/\/open\.spotify\.com\/.+/;

export interface LocalPhoto {
  uri: string;
  mimeType: string;
  uploaded: boolean;
  remotePhotoId?: string;
}


export function useCreateMomentViewModel() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const momentId = route.params?.momentId;
  const isEdit = !!momentId;
  const queryClient = useQueryClient();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ── Photo state ────────────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);

  // ── Audio state ────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioPath, setRecordedAudioPath] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // ── Load existing data if editing ─────────────────────────────────────────
  useQuery({
    queryKey: ['moment', momentId],
    queryFn: () => momentsApi.get(momentId!),
    enabled: isEdit,
    staleTime: 0,
    select: data => {
      setTitle(data.title);
      setCaption(data.caption ?? '');
      setDate(new Date(data.date));
      setLocation(data.location ?? '');
      setTags(data.tags);
      setSpotifyUrl(data.spotifyUrl ?? '');
      return data;
    },
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = useCallback((): string | null => {
    if (!title.trim()) return t.moments.errors.titleRequired;
    if (title.trim().length > 200) return t.moments.errors.titleTooLong;
    if (spotifyUrl && !SPOTIFY_REGEX.test(spotifyUrl.trim()))
      return t.moments.errors.spotifyInvalid;
    return null;
  }, [title, spotifyUrl]);

  // ── Save mutation ──────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        caption: caption.trim() || undefined,
        date: date.toISOString(),
        location: location.trim() || undefined,
        tags,
        spotifyUrl: spotifyUrl.trim() || undefined,
      };

      const savedMoment = isEdit
        ? await momentsApi.update(momentId!, payload)
        : await momentsApi.create(payload);

      // Upload new photos in background (non-blocking — fire and forget)
      const pendingPhotos = photos.filter(p => !p.uploaded);
      if (pendingPhotos.length > 0) {
        Promise.all(
          pendingPhotos.map(p =>
            momentsApi.uploadPhoto(savedMoment.id, p.uri, p.mimeType).catch(() => null),
          ),
        ).then(() => {
          queryClient.invalidateQueries({ queryKey: ['moment', savedMoment.id] });
          queryClient.invalidateQueries({ queryKey: ['moments'] });
        });
      }

      // Upload audio in background
      if (recordedAudioPath) {
        momentsApi.uploadAudio(savedMoment.id, recordedAudioPath)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['moment', savedMoment.id] });
          })
          .catch(() => null);
      }

      return savedMoment;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      queryClient.invalidateQueries({ queryKey: ['moment', saved.id] });
      navigation.goBack();
    },
    onError: (err: Error) => Alert.alert(t.common.error, err.message || t.moments.errors.saveFailed),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBack = () => navigation.goBack();

  const handleSave = () => {
    const error = validate();
    if (error) { Alert.alert(t.common.error, error); return; }
    if (saveMutation.isPending) return;
    saveMutation.mutate();
  };

  const handleAddPhotoFromLibrary = async () => {
    if (photos.length >= 10) {
      Alert.alert(t.common.error, 'Maximum 10 photos allowed');
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

  const handleStartRecording = async () => {
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
          // 5-minute max
          handleStopRecording();
        }
      });
    } catch {
      setIsRecording(false);
      Alert.alert(t.common.error, 'Could not start recording. Check microphone permissions.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const path = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      if (path) setRecordedAudioPath(path);
    } catch {
      setIsRecording(false);
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

  return {
    isEdit,
    title,
    caption,
    date,
    location,
    tagInput,
    tags,
    spotifyUrl,
    showDatePicker,
    photos,
    isRecording,
    recordedAudioPath,
    recordingDuration,
    isPlayingPreview,
    isSaving: saveMutation.isPending,

    setTitle,
    setCaption,
    setLocation,
    setTagInput,
    setSpotifyUrl,
    setShowDatePicker,

    handleBack,
    handleSave,
    handleAddPhotoFromLibrary,
    handleAddPhotoFromCamera,
    handleRemovePhoto,
    handleAddTag,
    handleRemoveTag,
    handleDateChange,
    handleStartRecording,
    handleStopRecording,
    handlePlayPreview,
    handleDeleteAudio,
  };
}
