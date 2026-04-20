import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { env } from '@/config/env';
import { formatInviteCode, toInvitePayload } from '@/lib/formatInviteCode';
import { useAppColors } from '@/theme/ThemeProvider';

// T340 (Sprint 61) — invite-code bottom sheet for the Profile settings list.
// Opened from the "🔗 Mã mời" row. Mirrors ShareCodeCard's copy/share UX
// (formatted hex code, 1600ms "Đã sao chép ✓" toast, native Share sheet) but
// without QR or regenerate — those live on Dashboard for an unpaired user.
// The code is read-only here; paired users who want to rotate it can still do
// so from the Dashboard widget before pairing completes.

export type InviteCodeSheetHandle = {
  open: (code: string) => void;
  close: () => void;
};

const COPIED_RESET_MS = 1600;

export const InviteCodeSheet = forwardRef<InviteCodeSheetHandle>((_props, ref) => {
  const bsRef = useRef<BottomSheetModal>(null);
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      open: (next) => {
        setCode(next);
        setCopied(false);
        bsRef.current?.present();
      },
      close: () => {
        bsRef.current?.dismiss();
      },
    }),
    [],
  );

  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    },
    [],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.45}
      />
    ),
    [],
  );

  // Same gorhom style-prop exception documented in ComingSoonSheet — library
  // API only accepts style objects for these two surfaces.
  const backgroundStyle = { backgroundColor: c.bgElev };
  const handleIndicatorStyle = { backgroundColor: c.lineOnSurface };

  const onShare = useCallback(async () => {
    if (!code) return;
    const payload = toInvitePayload(code);
    const message = t('home.shareCode.shareMessage', {
      code: payload,
      url: `${env.appBaseUrl}/join/${payload}`,
    });
    try {
      await Share.share({ message });
    } catch {
      // user cancel or system error — swallow
    }
  }, [code, t]);

  const onCopy = useCallback(async () => {
    if (!code) return;
    await Clipboard.setStringAsync(toInvitePayload(code));
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, [code]);

  return (
    <BottomSheetModal
      ref={bsRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      onDismiss={() => setCopied(false)}
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="px-6 pt-2">
          <Text className="font-displayMedium text-ink text-[22px] leading-[28px]">
            {t('profile.invite.title')}
          </Text>
          <Text className="mt-2 font-body text-ink-soft text-[15px] leading-[22px]">
            {t('profile.invite.subtitle')}
          </Text>

          <View className="mt-6 items-center rounded-3xl bg-surface-alt px-4 py-6">
            <Text className="font-displayItalic uppercase text-primary-deep text-[11px] tracking-[2px]">
              {t('profile.invite.codeLabel')}
            </Text>
            <Text className="mt-2 font-displayBold text-ink text-[32px] leading-[38px] tracking-[3px]">
              {formatInviteCode(code)}
            </Text>
          </View>

          <View className="mt-5 flex-row gap-2">
            <Pressable
              onPress={onShare}
              accessibilityRole="button"
              className="flex-1 flex-row items-center justify-center rounded-full py-3 bg-ink active:opacity-90"
            >
              <Text className="font-bodyBold text-bg text-[14px]">
                {t('profile.invite.shareCta')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onCopy}
              accessibilityRole="button"
              className="flex-1 flex-row items-center justify-center rounded-full py-3 bg-surface border border-line-on-surface active:opacity-90"
            >
              <Text className="font-bodyBold text-ink text-[14px]">
                {copied ? t('profile.invite.copied') : t('profile.invite.copyCta')}
              </Text>
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

InviteCodeSheet.displayName = 'InviteCodeSheet';
