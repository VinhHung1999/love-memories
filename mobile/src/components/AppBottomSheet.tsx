import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Keyboard, Platform, Pressable, TextInput, View } from 'react-native';
import { Body, Heading, Label } from './Typography';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetScrollViewMethods,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../navigation/theme';
import { useTranslation } from 'react-i18next';
// ── Props ─────────────────────────────────────────────────────────────────────

interface AppBottomSheetProps {
  title: string;
  subtitle?: string;      // subtitle below title (triggers icon-style header when set)
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconBgClass?: string;   // unused — kept for backward compat, icon bg is now hardcoded via theme
  // icon-header action button (only used when icon is set)
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  actionDisabled?: boolean;
  scrollable?: boolean; // false=BottomSheetView+dynamicSizing, true=BottomSheetScrollView+snapPoints
  snapPoints?: string[]; // default ['92%'], only used when scrollable=true
  showHeader?: boolean; // default true
  cancelLabel?: string; // default t('common.cancel')
  saveLabel?: string; // default t('common.save')
  onSave?: () => void;
  onDismiss?: () => void;
  saveDisabled?: boolean;
  isSaving?: boolean;
  children: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

const HEADER_HEIGHT = 56;

const AppBottomSheet = forwardRef<BottomSheetModal, AppBottomSheetProps>(
  (
    {
      title,
      subtitle,
      icon,
      iconBgClass: _iconBgClass = 'bg-primary/10',
      actionLabel,
      onAction,
      actionLoading = false,
      actionDisabled = false,
      scrollable = false,
      snapPoints = ['92%'],
      showHeader = true,
      cancelLabel,
      saveLabel,
      onSave,
      onDismiss,
      saveDisabled = false,
      isSaving = false,
      children,
    },
    externalRef,
  ) => {
  const { t } = useTranslation();
    const colors = useAppColors();
    const insets = useSafeAreaInsets();
    const internalRef = useRef<BottomSheetModal>(null);
    const scrollRef = useRef<BottomSheetScrollViewMethods>(null);
    const [kbVisible, setKbVisible] = useState(false);

    useEffect(() => {
      const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const s1 = Keyboard.addListener(showEvt, (e) => {
        setKbVisible(true);
        // Auto-scroll: find focused input and scroll to make it visible above keyboard + footer
        setTimeout(() => {
          const focused = (TextInput as any).State?.currentlyFocusedInput?.();
          if (!focused || !scrollRef.current) return;
          focused.measureLayout?.(
            (scrollRef.current as any).getScrollableNode?.(),
            (_x: number, y: number, _w: number, h: number) => {
              scrollRef.current?.scrollTo({ y: y - e.endCoordinates.height + h + 80, animated: true });
            },
            () => {},
          );
        }, 100);
      });
      const s2 = Keyboard.addListener(hideEvt, () => setKbVisible(false));
      return () => { s1.remove(); s2.remove(); };
    }, []);

    // Proxy methods so parent ref lazy-reads internalRef at call time,
    // avoiding the null-on-first-render race with empty deps [].
    useImperativeHandle(
      externalRef,
      () =>
        ({
          present: (...args: any[]) => internalRef.current?.present(...args),
          dismiss: (...args: any[]) => internalRef.current?.dismiss(...args),
          snapToIndex: (index: number, ...rest: any[]) =>
            (internalRef.current as any)?.snapToIndex(index, ...rest),
          snapToPosition: (pos: string | number, ...rest: any[]) =>
            (internalRef.current as any)?.snapToPosition(pos, ...rest),
          close: (...args: any[]) => internalRef.current?.close(...args),
          forceClose: (...args: any[]) =>
            internalRef.current?.forceClose(...args),
          expand: (...args: any[]) => internalRef.current?.expand(...args),
          collapse: (...args: any[]) => internalRef.current?.collapse(...args),
        } as unknown as BottomSheetModal),
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    const handleDismiss = useCallback(() => onDismiss?.(), [onDismiss]);
    const handleCancel = useCallback(() => internalRef.current?.dismiss(), []);

    const cancel = cancelLabel ?? t('common.cancel');
    const save = saveLabel ?? t('common.save');
    const paddingTop = useMemo(() => {
      return showHeader ? HEADER_HEIGHT : 0;
    }, [showHeader]);

    // Sticky footer for scrollable sheets with onSave — always visible above keyboard
    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View
            style={{
              backgroundColor: colors.bgCard,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 12),
            }}>
            <Pressable
              onPress={onSave}
              disabled={saveDisabled || isSaving}
              style={{
                backgroundColor: saveDisabled || isSaving ? colors.textLight : colors.primary,
                borderRadius: 16,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Label style={{ color: '#fff', fontWeight: '600' }}>{save}</Label>
              )}
            </Pressable>
          </View>
        </BottomSheetFooter>
      ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [onSave, saveDisabled, isSaving, save, colors.bgCard, colors.border, colors.primary, colors.textLight, insets.bottom],
    );

    const useFooter = scrollable && !!onSave;
    // Footer height: paddingTop(12) + button(48) + paddingBottom(max(insets.bottom, 12))
    const footerHeight = useFooter ? 12 + 48 + Math.max(insets.bottom, 12) : 0;

    return (
      <BottomSheetModal
        ref={internalRef}
        enableDynamicSizing={!scrollable}
        snapPoints={scrollable ? snapPoints : undefined}
        enablePanDownToClose
        onDismiss={handleDismiss}
        backdropComponent={renderBackdrop}
        footerComponent={useFooter ? renderFooter : undefined}
        keyboardBehavior={scrollable ? 'extend' : 'interactive'}
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
        backgroundStyle={{ backgroundColor: colors.bgCard }}
      >
        {/* Header */}
        {showHeader && (
          icon ? (
            /* Icon + title + subtitle style — row layout (no Cancel/Save) */
            <View className="flex-row items-center gap-4 px-5 py-4 border-b border-border dark:border-darkBorder">
              <View className="w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.primaryMuted }}>
                {icon && React.createElement(icon, { size: 24, color: colors.primary, strokeWidth: 1.5 })}
              </View>
              <View className="flex-1">
                <Heading size="sm" className="text-textDark dark:text-darkTextDark">{title}</Heading>
                {subtitle ? (
                  <Body className="text-textMid dark:text-darkTextMid mt-0.5">{subtitle}</Body>
                ) : null}
              </View>
              {actionLabel ? (
                <Pressable
                  onPress={onAction}
                  disabled={actionDisabled || actionLoading}
                  className="items-end"
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Label className="font-semibold" style={{ color: actionDisabled ? colors.textLight : colors.primary }}>
                      {actionLabel}
                    </Label>
                  )}
                </Pressable>
              ) : null}
            </View>
          ) : (
            /* Classic Cancel / Title / Save style */
            <View className="flex-row items-center px-5 py-3 border-b border-border dark:border-darkBorder">
              <Pressable onPress={handleCancel} className="w-[60px]">
                <Body className="text-textMid dark:text-darkTextMid">{cancel}</Body>
              </Pressable>
              <Label className="flex-1 text-center font-semibold text-textDark dark:text-darkTextDark">
                {title}
              </Label>
              {/* Save in header only for non-scrollable sheets; scrollable sheets use sticky footer */}
              {useFooter ? (
                <View className="w-[60px]" />
              ) : (
                <Pressable
                  onPress={onSave}
                  disabled={saveDisabled || isSaving}
                  className="w-[60px] items-end"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Label className="font-semibold" style={{ color: saveDisabled ? colors.textLight : colors.primary }}>
                      {save}
                    </Label>
                  )}
                </Pressable>
              )}
            </View>
          )
        )}

        {/* Content */}
        {scrollable ? (
          <BottomSheetScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableFooterMarginAdjustment={useFooter}
            contentContainerStyle={kbVisible && footerHeight ? { paddingBottom: footerHeight } : undefined}
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView>
            <View style={{ paddingTop }}>{children}</View>
          </BottomSheetView>
        )}
      </BottomSheetModal>
    );
  },
);

AppBottomSheet.displayName = 'AppBottomSheet';
export default AppBottomSheet;
