import { useRef, useState } from 'react';
import { Alert, Share } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AppStackParamList } from '../../navigation';
import CreateMomentSheet from '../CreateMoment/CreateMomentSheet';

export type FilterType = 'original' | 'grayscale' | 'sepia' | 'warm' | 'cool' | 'rose' | 'vintage' | 'softglow';
export type FrameType = 'none' | 'polaroid' | 'floral' | 'minimal';

export interface StickerItem {
  id: string;
  content: string;
  x: number;
  y: number;
  scale: number;
}

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function usePhotoBoothViewModel() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const [photo, setPhoto] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'gallery' | 'edit'>('camera');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('original');
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('none');
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<'filters' | 'frames' | 'stickers' | null>(null);
  const [stickerCategory, setStickerCategory] = useState<'love' | 'fun' | 'text'>('love');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewShotRef = useRef<any>(null);

  const captureImage = async (): Promise<string | null> => {
    if (!viewShotRef.current) return null;
    try {
      const uri: string = await viewShotRef.current.capture();
      return uri;
    } catch {
      return null;
    }
  };

  const handleLaunchCamera = () => {
    // Start countdown 3 → 2 → 1 then launch camera
    setCountdown(3);
    setTimeout(() => setCountdown(2), 1000);
    setTimeout(() => setCountdown(1), 2000);
    setTimeout(async () => {
      setCountdown(null);
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        saveToPhotos: false,
        quality: 0.9,
      });
      if (result.assets && result.assets[0]?.uri) {
        setPhoto(result.assets[0].uri);
        setMode('edit');
        setSelectedFilter('original');
        setSelectedFrame('none');
        setStickers([]);
      }
    }, 3000);
  };

  const handleLaunchGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.9,
    });
    if (result.assets && result.assets[0]?.uri) {
      setPhoto(result.assets[0].uri);
      setMode('edit');
      setSelectedFilter('original');
      setSelectedFrame('none');
      setStickers([]);
    }
  };

  const handleRetake = () => {
    setPhoto(null);
    setMode('camera');
    setSelectedFilter('original');
    setSelectedFrame('none');
    setStickers([]);
    setActivePanel(null);
  };

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
      (navigation as any).navigate('MomentsTab', {
        screen: 'BottomSheet',
        params: {
          screen: CreateMomentSheet,
          props: { initialPhoto: { uri, mimeType: 'image/jpeg' } },
        },
      });
    } catch {
      // ignore
    } finally {
      setIsProcessing(false);
    }
  };

  const addSticker = (content: string) => {
    const id = `sticker-${Date.now()}-${Math.random()}`;
    // Random position within central area of the photo
    const x = 30 + Math.random() * 200;
    const y = 50 + Math.random() * 150;
    setStickers(prev => [...prev, { id, content, x, y, scale: 1 }]);
  };

  const removeSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  const togglePanel = (panel: 'filters' | 'frames' | 'stickers') => {
    setActivePanel(prev => (prev === panel ? null : panel));
  };

  return {
    photo,
    mode,
    selectedFilter,
    setSelectedFilter,
    selectedFrame,
    setSelectedFrame,
    stickers,
    isProcessing,
    countdown,
    activePanel,
    stickerCategory,
    setStickerCategory,
    viewShotRef,
    handleLaunchCamera,
    handleLaunchGallery,
    handleRetake,
    handleSaveToGallery,
    handleShare,
    handleAttachToMoment,
    addSticker,
    removeSticker,
    togglePanel,
  };
}
