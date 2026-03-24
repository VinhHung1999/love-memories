import { useRef, useState } from 'react';
import { Alert, Share } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useTranslation } from 'react-i18next';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import CreateMomentSheet from '../CreateMoment/CreateMomentSheet';

export type FilterType = 'original' | 'grayscale' | 'sepia' | 'warm' | 'cool' | 'rose' | 'vintage' | 'softglow';
export type FrameType = 'none' | 'polaroid' | 'floral' | 'minimal';
export type PhotoBoothMode = 'camera' | 'edit';
export type PhotoCount = 1 | 4 | 6;

export interface StickerItem {
  id: string;
  content: string;
  x: number;
  y: number;
  scale: number;
}

export function usePhotoBoothViewModel() {
  const { t } = useTranslation();
  const navigation = useAppNavigation();

  const [mode, setMode] = useState<PhotoBoothMode>('camera');
  const [photoCount, setPhotoCount] = useState<PhotoCount>(4);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('original');
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('none');
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePanel, setActivePanel] = useState<'filters' | 'frames' | 'stickers' | null>(null);
  const [stickerCategory, setStickerCategory] = useState<'love' | 'fun' | 'text'>('love');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewShotRef = useRef<any>(null);

  const capturedCount = photos.length;

  // ── Count selection ──────────────────────────────────────────────────────────

  const handleSetPhotoCount = (count: PhotoCount) => {
    setPhotoCount(count);
    setPhotos([]);
    setIsCapturing(false);
  };

  // ── Start capture ────────────────────────────────────────────────────────────

  const handleStartCapture = () => {
    setIsCapturing(true);
  };

  // ── Add photo (from camera or gallery) ─────────────────────────────────────

  const addPhoto = (uri: string) => {
    setPhotos(prev => {
      const next = [...prev, uri];
      if (next.length >= photoCount) {
        setMode('edit');
        setIsCapturing(false);
      }
      return next;
    });
  };

  // ── Gallery picker (secondary option) ──────────────────────────────────────

  const handlePickFromGallery = async () => {
    const remaining = photoCount - capturedCount;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: remaining,
      quality: 0.9,
    });
    if (result.assets) {
      result.assets.forEach(asset => {
        if (asset.uri) addPhoto(asset.uri);
      });
    }
  };

  // ── Retake ──────────────────────────────────────────────────────────────────

  const handleRetake = () => {
    setPhotos([]);
    setMode('camera');
    setIsCapturing(false);
    setSelectedFilter('original');
    setSelectedFrame('none');
    setStickers([]);
    setActivePanel(null);
  };

  const handleClose = () => navigation.goBack();

  // ── ViewShot capture ────────────────────────────────────────────────────────

  const captureImage = async (): Promise<string | null> => {
    if (!viewShotRef.current) return null;
    try {
      const uri: string = await viewShotRef.current.capture();
      return uri;
    } catch (err) {
      console.error('[PhotoBooth] captureImage failed:', err);
      return null;
    }
  };

  // ── Save / Share / Attach ───────────────────────────────────────────────────

  const handleSaveToGallery = async () => {
    setIsProcessing(true);
    try {
      const uri = await captureImage();
      if (!uri) throw new Error('capture failed');
      await CameraRoll.save(uri, { type: 'photo' });
      Alert.alert(t('common.success'), t('photoBooth.saved'));
    } catch {
      Alert.alert(t('common.error'), t('photoBooth.errors.saveFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    setIsProcessing(true);
    try {
      const uri = await captureImage();
      if (!uri) throw new Error('capture failed');
      await Share.share({ url: uri });
    } catch {
      // user cancelled or error — ignore
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAttachToMoment = async () => {
    setIsProcessing(true);
    try {
      const uri = await captureImage();
      if (!uri) throw new Error('capture failed');
      // Replace PhotoBooth (fullScreenModal) with BottomSheet route to avoid
      // containedTransparentModal-on-top-of-fullScreenModal layering issue on iOS
      navigation.replace('BottomSheet' as any, {
        component: CreateMomentSheet,
        props: { initialPhoto: { uri, mimeType: 'image/jpeg' } },
      });
    } catch (err) {
      console.error('[PhotoBooth] Save to Memories failed:', err);
      Alert.alert(t('common.error'), t('photoBooth.errors.saveFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Stickers ────────────────────────────────────────────────────────────────

  const addSticker = (content: string) => {
    const id = `sticker-${Date.now()}-${Math.random()}`;
    const x = 30 + Math.random() * 200;
    const y = 50 + Math.random() * 150;
    setStickers(prev => [...prev, { id, content, x, y, scale: 1 }]);
  };

  const removeSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  const setStickerPosition = (id: string, x: number, y: number) => {
    setStickers(prev => prev.map(s =>
      s.id === id ? { ...s, x, y } : s,
    ));
  };

  const togglePanel = (panel: 'filters' | 'frames' | 'stickers') => {
    setActivePanel(prev => (prev === panel ? null : panel));
  };

  return {
    mode,
    photoCount,
    photos,
    capturedCount,
    isCapturing,
    selectedFilter,
    setSelectedFilter,
    selectedFrame,
    setSelectedFrame,
    stickers,
    isProcessing,
    activePanel,
    stickerCategory,
    setStickerCategory,
    viewShotRef,
    handleClose,
    handleSetPhotoCount,
    handleStartCapture,
    addPhoto,
    handlePickFromGallery,
    handleRetake,
    handleSaveToGallery,
    handleShare,
    handleAttachToMoment,
    addSticker,
    removeSticker,
    setStickerPosition,
    togglePanel,
    handleSaveToMemories: handleAttachToMoment,
  };
}
