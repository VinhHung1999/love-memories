import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, Pressable, Text, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_PHOTOS } from '@/screens/MomentCreate/useMomentCreateViewModel';
import { useCameraSheetStore } from '@/stores/cameraSheetStore';
import { useAppColors } from '@/theme/ThemeProvider';

// T377 (Sprint 62) — action sheet raised when the user taps the red camera
// pill in PillTabBar, or either CTA on the Dashboard / Moments empty states.
// Offers three paths to start a moment:
//   1. Chụp ảnh   → ImagePicker.launchCameraAsync (single shot, quality 0.8)
//   2. Chọn thư viện → launchImageLibraryAsync (multi-select, up to MAX_PHOTOS)
//   3. Photobooth — T404 (Sprint 64) → router.push('/(modal)/photobooth')
//
// Mounting: single instance lives in app/_layout.tsx inside
// BottomSheetModalProvider → subscribes to useCameraSheetStore(isOpen) and
// flips present()/dismiss() via useEffect. Any caller invokes
// `useCameraSheetStore.getState().open()` — no ref drilling.
//
// iOS touch gotcha: wrap in <FullWindowOverlay> because the sheet mounts on
// top of expo-router's transparentModal stack — without this, tapping inside
// the sheet is intercepted by the underlying native screen container and
// nothing happens (documented in mobile-rework rule + Sprint 55 bug).

function iOSContainer(props: { children?: React.ReactNode }) {
  return <FullWindowOverlay>{props.children}</FullWindowOverlay>;
}

export function CameraActionSheet() {
  const ref = useRef<BottomSheetModal>(null);
  const isOpen = useCameraSheetStore((s) => s.isOpen);
  const close = useCameraSheetStore((s) => s.close);
  const router = useRouter();
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isOpen) ref.current?.present();
    else ref.current?.dismiss();
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...p}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.45}
      />
    ),
    [],
  );

  // @gorhom/bottom-sheet carve-out (mobile-rework rule): background + handle
  // indicator must be style objects; classes can't flow into these native
  // props. Values come from theme so palette switches apply.
  const backgroundStyle = { backgroundColor: c.bg };
  const handleIndicatorStyle = { backgroundColor: c.line };

  const navigateToCreate = useCallback(
    (uris: string[]) => {
      close();
      // Small delay so the dismiss animation starts before the modal-stack
      // push — simultaneous present + dismiss on the same UIViewController
      // stack flickers on slower iOS devices.
      setTimeout(() => {
        router.push({
          pathname: '/(modal)/moment-create',
          params: { initialPhotos: JSON.stringify(uris) },
        });
      }, 180);
    },
    [router, close],
  );

  const showSettingsAlert = useCallback(
    (bodyKey: 'cameraDenied' | 'libraryDenied') => {
      Alert.alert(t(`compose.cameraSheet.permission.${bodyKey}`), undefined, [
        { text: t('compose.cameraSheet.permission.cancel'), style: 'cancel' },
        {
          text: t('compose.cameraSheet.permission.openSettings'),
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ]);
    },
    [t],
  );

  // T382 (Sprint 62) — close the sheet BEFORE the async work kicks off so
  // every return path (permission denied, picker canceled, empty assets,
  // success) leaves a dismissed sheet. Earlier version only closed on the
  // success path via navigateToCreate; the three failure paths left the
  // sheet stuck open, forcing the user to tap the backdrop. close() calling
  // dismiss() twice (here + inside navigateToCreate) is a no-op after the
  // first — the second request on an already-dismissed sheet short-circuits.
  const onCamera = useCallback(async () => {
    close();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showSettingsAlert('cameraDenied');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    navigateToCreate(result.assets.map((a) => a.uri));
  }, [close, showSettingsAlert, navigateToCreate]);

  const onLibrary = useCallback(async () => {
    close();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showSettingsAlert('libraryDenied');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      // T393 — align picker cap with MAX_PHOTOS. Picking 10 then letting
      // MomentCreate slice(0, 5) silently drop the extras confused Build 48 QA.
      selectionLimit: MAX_PHOTOS,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    navigateToCreate(result.assets.map((a) => a.uri));
  }, [close, showSettingsAlert, navigateToCreate]);

  const onPhotobooth = useCallback(() => {
    close();
    setTimeout(() => {
      router.push('/(modal)/photobooth');
    }, 180);
  }, [close, router]);

  const containerComponent = Platform.OS === 'ios' ? iOSContainer : undefined;

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      containerComponent={containerComponent}
      onDismiss={close}
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="px-6 pt-2 pb-4">
          <Text className="font-displayMedium text-ink text-[22px] leading-[28px]">
            {t('compose.cameraSheet.title')}
          </Text>
          <Text className="mt-1 font-body text-ink-mute text-[13px] leading-[18px]">
            {t('compose.cameraSheet.subtitle')}
          </Text>
        </View>
        <View className="px-4 gap-2.5 pb-2">
          <Row
            icon={<Camera size={22} color={c.primaryDeep} strokeWidth={1.75} />}
            tint="bg-primary-soft"
            title={t('compose.cameraSheet.takePhoto')}
            subtitle={t('compose.cameraSheet.takePhotoSub')}
            onPress={onCamera}
          />
          <Row
            icon={<ImageIcon size={22} color={c.accent} strokeWidth={1.75} />}
            tint="bg-accent-soft"
            title={t('compose.cameraSheet.pickLibrary')}
            subtitle={t('compose.cameraSheet.pickLibrarySub', { max: MAX_PHOTOS })}
            onPress={onLibrary}
          />
          <Row
            icon={<Sparkles size={22} color={c.primary} strokeWidth={1.75} />}
            tint="bg-primary-soft"
            title={t('compose.cameraSheet.photobooth')}
            subtitle={t('compose.cameraSheet.photoboothSub')}
            onPress={onPhotobooth}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

type RowProps = {
  icon: React.ReactNode;
  tint: 'bg-primary-soft' | 'bg-accent-soft' | 'bg-surface-alt';
  title: string;
  subtitle: string;
  disabled?: boolean;
  onPress: () => void;
};

function Row({ icon, tint, title, subtitle, disabled, onPress }: RowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-line-on-surface p-4 active:bg-surface-alt/60"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View className={`w-12 h-12 rounded-2xl items-center justify-center ${tint}`}>
        {icon}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="font-bodyMedium text-ink text-[15px] leading-[20px]">{title}</Text>
        <Text className="mt-0.5 font-body text-ink-mute text-[12.5px] leading-[17px]">
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
