import { CheckCircle2, RotateCw, X } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { useUploadQueueStore } from '@/lib/uploadQueue';
import { useAppColors } from '@/theme/ThemeProvider';

// T378 (Sprint 62) — global toast mounted once in app/_layout.tsx inside
// BottomSheetModalProvider. Subscribes to the upload queue and surfaces an
// aggregate status pill at the top of the screen so photos continue uploading
// after the composer modal dismisses.
//
// Rendering rules:
//   - If no entries → render nothing (absolute-positioned invisible view).
//   - If any uploading → spinner + "Đang tải lên {{current}}/{{total}} ảnh"
//     (T391: serial progress, current = successCount + 1 clamped to total).
//   - If all settled + some errors → warning pill + retry-all + dismiss-all.
//   - All-success states auto-dismiss via the queue's AUTO_DISMISS_MS timer
//     (3s), so the "success" branch flashes briefly then the toast unmounts.
//
// Layered via `zIndex: 999` and `pointerEvents: 'box-none'` on the outer
// positioning View so untouched screen areas remain interactive.

export function UploadProgressToast() {
  const uploads = useUploadQueueStore((s) => s.uploads);
  const retry = useUploadQueueStore((s) => s.retry);
  const dismiss = useUploadQueueStore((s) => s.dismiss);
  const clearAll = useUploadQueueStore((s) => s.clearAll);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  // D37 (Sprint 64 Build 74): icons and ActivityIndicator colors need to
  // follow the theme-flipped pill. `bg-ink` flips dark-in-light / light-in-
  // dark; content color uses `c.bg` which is always the opposite — so we
  // get (dark pill + light content) in light mode and (light pill + dark
  // content) in dark mode, both high contrast. Hardcoded `#ffffff` broke
  // the contrast the moment the user flipped to dark mode.
  const c = useAppColors();

  const { uploadingCount, errorIds, successCount, total, displayCurrent, allAudio } =
    useMemo(() => {
      const entries = Object.values(uploads);
      let uploading = 0;
      let success = 0;
      let audioCount = 0;
      const errors: string[] = [];
      for (const e of entries) {
        if (e.status === 'uploading') uploading += 1;
        else if (e.status === 'error') errors.push(e.id);
        else if (e.status === 'success') success += 1;
        if (e.kind === 'audio') audioCount += 1;
      }
      // Serial progress index (T391): the "next in line" photo is successCount+1.
      // Clamp to total for the brief window after the last success lands but
      // before AUTO_DISMISS_MS unmounts the toast.
      const current = Math.min(success + 1, entries.length);
      return {
        uploadingCount: uploading,
        errorIds: errors,
        successCount: success,
        total: entries.length,
        displayCurrent: current,
        // D48 (Sprint 65 Build 77 hot-fix): switch to the audio copy only when
        // every active entry is a voice memo. Mixed photo+audio batches fall
        // back to the photo copy (ảnh) — practical compromise: the user
        // typically only attaches one or the other per letter, and switching
        // mid-batch would jitter the toast text. Backward-compat: legacy
        // entries without `kind` default to 'photo' in the queue.
        allAudio: entries.length > 0 && audioCount === entries.length,
      };
    }, [uploads]);

  if (total === 0) return null;

  const topOffset = insets.top + (Platform.OS === 'ios' ? 4 : 12);
  const hasErrors = errorIds.length > 0;
  const stillUploading = uploadingCount > 0;

  const onRetryAll = () => errorIds.forEach((id) => retry(id));
  const onDismissAll = () => {
    // Wipe errors + lingering successes. Uploading entries stay — bailing on
    // an in-flight upload mid-stream would be confusing.
    if (stillUploading) {
      errorIds.forEach((id) => dismiss(id));
      return;
    }
    clearAll();
  };

  // D48 — pick the right kind-aware i18n key.
  const message = stillUploading
    ? allAudio
      ? t('compose.uploadToast.uploadingAudio')
      : t('compose.uploadToast.uploading', {
          current: displayCurrent,
          total,
        })
    : hasErrors
      ? allAudio
        ? t('compose.uploadToast.failedAudio')
        : t('compose.uploadToast.failed', {
            failed: errorIds.length,
            total,
          })
      : allAudio
        ? t('compose.uploadToast.doneAudio')
        : t('compose.uploadToast.done', { count: successCount });

  // D47 (Sprint 65 Build 77 hot-fix): wrap the floating toast in a
  // FullWindowOverlay on iOS so it renders above any active modal screen.
  // Without this the toast mounts at the BottomSheetModalProvider level but
  // gets clipped by the (modal) presentation's transparentModal native screen
  // container — the user sees nothing while a Compose-modal-triggered
  // upload is in flight (Boss Build 76 D47). Same pattern as
  // CameraActionSheet + DiscardSheet + AudioRecordSheet (D46).
  const toast = (
    // pointerEvents=box-none so taps on areas outside the pill still reach
    // underlying content. className position utilities aren't sufficient
    // because the toast must ignore parent layout — absolute + top offset.
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center px-4"
      // Inline style carve-out: dynamic top offset + zIndex can't be class-ed.
      style={{ top: topOffset, zIndex: 999 }}
    >
      <View
        pointerEvents="auto"
        className={`flex-row items-center gap-3 rounded-full px-4 py-2.5 shadow-lg ${
          hasErrors && !stillUploading ? 'bg-primary-deep' : 'bg-ink'
        }`}
      >
        {stillUploading ? (
          <ActivityIndicator size="small" color={c.bg} />
        ) : hasErrors ? (
          <View className="w-5 h-5 rounded-full bg-bg/20 items-center justify-center">
            <Text className="font-bodySemibold text-bg text-[13px]">!</Text>
          </View>
        ) : (
          <CheckCircle2 size={18} color={c.bg} strokeWidth={2} />
        )}
        <Text
          numberOfLines={1}
          className="font-bodyMedium text-bg text-[13px] leading-[18px] flex-shrink"
        >
          {message}
        </Text>
        {!stillUploading && hasErrors ? (
          <Pressable
            onPress={onRetryAll}
            accessibilityRole="button"
            accessibilityLabel={t('compose.uploadToast.retry')}
            className="flex-row items-center gap-1 rounded-full bg-bg/15 px-3 py-1 active:bg-bg/25"
          >
            <RotateCw size={12} color={c.bg} strokeWidth={2.25} />
            <Text className="font-bodySemibold text-bg text-[12px]">
              {t('compose.uploadToast.retry')}
            </Text>
          </Pressable>
        ) : null}
        {!stillUploading ? (
          <Pressable
            onPress={onDismissAll}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('compose.uploadToast.dismiss')}
            className="w-6 h-6 rounded-full items-center justify-center active:bg-bg/10"
          >
            <X size={14} color={c.bg} strokeWidth={2.25} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  if (Platform.OS === 'ios') {
    return <FullWindowOverlay>{toast}</FullWindowOverlay>;
  }
  return toast;
}
