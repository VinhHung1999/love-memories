import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

type PhotoboothStep = 'mode' | 'capture' | 'review';

const TOTAL_SHOTS = 4;

export function usePhotoboothViewModel() {
  const router = useRouter();
  const [step, setStep] = useState<PhotoboothStep>('mode');
  const [shots, setShots] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [shotIndex, setShotIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const stripRef = useRef<View>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  // Countdown → auto-capture when it hits 1
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(async () => {
      if (countdown === 1) {
        try {
          const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
          if (!photo?.uri) {
            setCountdown(0);
            return;
          }
          setShots((prev) => {
            const next = [...prev, photo.uri];
            if (next.length >= TOTAL_SHOTS) {
              setStep('review');
            } else {
              setShotIndex(next.length);
              setCountdown(3);
            }
            return next;
          });
        } catch {
          setCountdown(0);
        }
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const onStartCamera = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setShots([]);
    setShotIndex(0);
    setCountdown(0);
    setStep('capture');
  }, [cameraPermission, requestCameraPermission]);

  const onStartCountdown = useCallback(() => {
    setShotIndex(0);
    setShots([]);
    setCountdown(3);
  }, []);

  const onPickGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: TOTAL_SHOTS,
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.length) return;
    setShots(result.assets.slice(0, TOTAL_SHOTS).map((a) => a.uri));
    setStep('review');
  }, []);

  const onRetake = useCallback(() => {
    setShots([]);
    setShotIndex(0);
    setCountdown(0);
    setStep('capture');
  }, []);

  const onAccept = useCallback(async () => {
    if (!stripRef.current || isSaving) return;
    setIsSaving(true);
    try {
      const compositeUri = await captureRef(stripRef, { format: 'jpg', quality: 0.92 });

      if (!mediaPermission?.granted) {
        const result = await requestMediaPermission();
        if (result.granted) {
          await MediaLibrary.saveToLibraryAsync(compositeUri);
        }
      } else {
        await MediaLibrary.saveToLibraryAsync(compositeUri);
      }

      router.replace({
        pathname: '/(modal)/moment-create',
        params: { initialPhotos: JSON.stringify([compositeUri]) },
      });
    } catch {
      setIsSaving(false);
    }
  }, [isSaving, mediaPermission, requestMediaPermission, router]);

  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  return {
    step,
    shots,
    countdown,
    shotIndex,
    isSaving,
    cameraRef,
    stripRef,
    totalShots: TOTAL_SHOTS,
    cameraPermission,
    onStartCamera,
    onStartCountdown,
    onPickGallery,
    onRetake,
    onAccept,
    onClose,
  };
}
