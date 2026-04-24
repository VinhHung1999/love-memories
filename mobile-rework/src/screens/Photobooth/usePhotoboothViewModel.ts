import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Share } from 'react-native';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

// State machine: mode → capture/gallery → edit → share → moment-create
type PhotoboothStep = 'mode' | 'capture' | 'edit' | 'share';

export type BoothLayout = 'grid-4' | 'col-4' | 'single';

const LAYOUT_SHOTS: Record<BoothLayout, number> = {
  'grid-4': 4,
  'col-4': 4,
  'single': 1,
};

export type BoothFrame = 'polaroid' | 'filmstrip' | 'rose' | 'none';
export type EditTool = 'filter' | 'frame' | 'sticker' | 'text';

export type BoothSticker = {
  id: string;
  emoji: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
};

// T420: prototype photobooth.jsx STICKERS array L43
export const STICKERS = ['♥','✨','🌸','☕','🌙','🔥','🎀','⭐','🌿','☁️','🍃','💌','📷','🫧','🎈','🧸','🦋','🍓','☀️','🌻','💫'];

// T420: frame configs
export type FrameCfg = { id: BoothFrame; label: string };
export const FRAMES: FrameCfg[] = [
  { id: 'polaroid',  label: 'Polaroid' },
  { id: 'filmstrip', label: 'Film' },
  { id: 'rose',      label: 'Hoa hồng' },
  { id: 'none',      label: 'Không viền' },
];

// T420: filter color tints (semi-transparent overlays)
export type FilterCfg = { id: string; label: string; tint: string | null };
export const FILTERS: FilterCfg[] = [
  { id: 'none',   label: 'Gốc',   tint: null },
  { id: 'kodak',  label: 'Kodak', tint: 'rgba(200,140,60,0.18)' },
  { id: 'mauve',  label: 'Mauve', tint: 'rgba(160,90,130,0.18)' },
  { id: 'bloom',  label: 'Bloom', tint: 'rgba(255,150,160,0.18)' },
  { id: 'sepia',  label: 'Sepia', tint: 'rgba(180,140,80,0.22)' },
  { id: 'faded',  label: 'Faded', tint: 'rgba(150,150,140,0.18)' },
  { id: 'golden', label: 'Golden',tint: 'rgba(220,180,50,0.2)' },
];

export function usePhotoboothViewModel() {
  const router = useRouter();
  const [step, setStep] = useState<PhotoboothStep>('mode');
  const [layout, setLayout] = useState<BoothLayout>('grid-4');
  const [shots, setShots] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [shotIndex, setShotIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // T420 edit state
  const [frame, setFrame] = useState<BoothFrame>('polaroid');
  const [filter, setFilter] = useState<string>('none');
  const [stickers, setStickers] = useState<BoothSticker[]>([]);
  const [caption, setCaption] = useState('memoura ♥');
  const [activeTool, setActiveTool] = useState<EditTool>('filter');
  // PB8: selected sticker id (shows X delete button)
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  // PB9 DRAFT (TODO-Boss-confirm): caption inline edit mode
  const [captionEditing, setCaptionEditing] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const stripRef = useRef<View>(null);
  const flashOpacity = useRef(new Animated.Value(0)).current;

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  const totalShots = LAYOUT_SHOTS[layout];

  const triggerShutterEffect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [flashOpacity]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(async () => {
      if (countdown === 1) {
        try {
          triggerShutterEffect();
          const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
          if (!photo?.uri) { setCountdown(0); return; }
          setShots((prev) => {
            const next = [...prev, photo.uri];
            if (next.length >= totalShots) {
              setStep('edit');
            } else {
              setShotIndex(next.length);
              setCountdown(3);
            }
            return next;
          });
        } catch { setCountdown(0); }
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, totalShots, triggerShutterEffect]);

  const onStartCamera = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setShots([]); setShotIndex(0); setCountdown(0);
    setStep('capture');
  }, [cameraPermission, requestCameraPermission]);

  const onStartCountdown = useCallback(() => {
    setShotIndex(0); setShots([]); setCountdown(3);
  }, []);

  const onPickGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: totalShots,
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.length) return;
    setShots(result.assets.slice(0, totalShots).map((a) => a.uri));
    setStep('edit');
  }, [totalShots]);

  const onRetake = useCallback(() => {
    setShots([]); setShotIndex(0); setCountdown(0);
    setStickers([]); setCaption('memoura ♥');
    setStep('capture');
  }, []);

  // T420: add sticker at a pseudo-random position
  const addSticker = useCallback((emoji: string) => {
    setStickers((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        emoji,
        x: 20 + Math.random() * 60,
        y: 10 + Math.random() * 70,
      },
    ]);
  }, []);

  const removeSticker = useCallback((id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    setSelectedStickerId(null);
  }, []);

  // PB7 DRAFT: update sticker position after drag (x/y in strip % coordinates)
  const moveStickerTo = useCallback((id: string, x: number, y: number) => {
    setStickers((prev) => prev.map((s) => s.id === id ? { ...s, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : s));
  }, []);

  // PB8: tap to select/deselect; X button calls removeSticker
  const selectSticker = useCallback((id: string) => {
    setSelectedStickerId((prev) => (prev === id ? null : id));
  }, []);

  // PB9 DRAFT (TODO-Boss-confirm): tap caption text → inline edit overlay
  const onEditCaption = useCallback(() => { setCaptionEditing(true); }, []);
  const onConfirmCaption = useCallback(() => { setCaptionEditing(false); }, []);

  const onProceedToShare = useCallback(() => {
    setStep('share');
  }, []);

  // T421: capture strip, save to library, navigate to moment-create
  const onSaveToLibrary = useCallback(async () => {
    if (!stripRef.current || isSaving) return;
    setIsSaving(true);
    try {
      const compositeUri = await captureRef(stripRef, { format: 'jpg', quality: 0.92 });
      if (!mediaPermission?.granted) {
        const res = await requestMediaPermission();
        if (res.granted) await MediaLibrary.saveToLibraryAsync(compositeUri);
      } else {
        await MediaLibrary.saveToLibraryAsync(compositeUri);
      }
    } catch { /* silent */ }
    setIsSaving(false);
  }, [isSaving, mediaPermission, requestMediaPermission]);

  const onUseNow = useCallback(async () => {
    if (!stripRef.current || isSaving) return;
    setIsSaving(true);
    try {
      const compositeUri = await captureRef(stripRef, { format: 'jpg', quality: 0.92 });
      if (mediaPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(compositeUri).catch(() => {});
      }
      router.replace({
        pathname: '/(modal)/moment-create',
        params: { initialPhotos: JSON.stringify([compositeUri]) },
      });
    } catch { setIsSaving(false); }
  }, [isSaving, mediaPermission, router]);

  const onNativeShare = useCallback(async () => {
    if (!stripRef.current) return;
    try {
      const compositeUri = await captureRef(stripRef, { format: 'jpg', quality: 0.92 });
      await Share.share({ url: compositeUri, message: 'memoura ♥' });
    } catch { /* user cancelled */ }
  }, []);

  const onClose = useCallback(() => { router.back(); }, [router]);

  const onReset = useCallback(() => {
    setShots([]); setShotIndex(0); setCountdown(0);
    setStickers([]); setCaption('memoura ♥');
    setFrame('polaroid'); setFilter('none');
    setStep('mode');
  }, []);

  return {
    step,
    layout, setLayout,
    shots,
    countdown, shotIndex,
    isSaving,
    cameraRef, stripRef,
    flashOpacity,
    totalShots,
    cameraPermission,
    // T420 edit
    frame, setFrame,
    filter, setFilter,
    stickers, addSticker, removeSticker, moveStickerTo,
    caption, setCaption,
    activeTool, setActiveTool,
    // PB8
    selectedStickerId, selectSticker,
    // PB9 DRAFT
    captionEditing, onEditCaption, onConfirmCaption,
    // actions
    onStartCamera,
    onStartCountdown,
    onPickGallery,
    onRetake,
    onProceedToShare,
    onSaveToLibrary,
    onUseNow,
    onNativeShare,
    onClose,
    onReset,
  };
}
