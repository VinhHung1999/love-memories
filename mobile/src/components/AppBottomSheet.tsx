import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useAppColors } from '../navigation/theme';
import t from '../locales/en';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AppBottomSheetProps {
  title: string;
  subtitle?: string;      // subtitle below title (triggers icon-style header when set)
  icon?: string;          // MaterialCommunityIcons name — enables icon+title+subtitle header style
  iconBgClass?: string;   // className for icon background, default 'bg-primary/10'
  scrollable?: boolean; // false=BottomSheetView+dynamicSizing, true=BottomSheetScrollView+snapPoints
  snapPoints?: string[]; // default ['92%'], only used when scrollable=true
  showHeader?: boolean; // default true
  cancelLabel?: string; // default t.common.cancel
  saveLabel?: string; // default t.common.save
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
      iconBgClass = 'bg-primary/10',
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
    const colors = useAppColors();
    const internalRef = useRef<BottomSheetModal>(null);

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

    const cancel = cancelLabel ?? t.common.cancel;
    const save = saveLabel ?? t.common.save;
    const paddingTop = useMemo(() => {
      return showHeader ? HEADER_HEIGHT : 0;
    }, [showHeader]);

    return (
      <BottomSheetModal
        ref={internalRef}
        enableDynamicSizing={!scrollable}
        snapPoints={scrollable ? snapPoints : undefined}
        enablePanDownToClose
        onDismiss={handleDismiss}
        backdropComponent={renderBackdrop}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
        backgroundStyle={{ backgroundColor: '#ffffff' }}
      >
        {/* Header */}
        {showHeader && (
          icon ? (
            /* Icon + title + subtitle style (no Cancel/Save) */
            <View className="items-center px-5 pt-4 pb-3 border-b border-border">
              <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-3 ${iconBgClass}`}>
                <Icon name={icon} size={24} color={colors.primary} />
              </View>
              <Text className="text-base font-bold text-textDark">{title}</Text>
              {subtitle ? (
                <Text className="text-sm text-textMid mt-0.5 text-center">{subtitle}</Text>
              ) : null}
            </View>
          ) : (
            /* Classic Cancel / Title / Save style */
            <View className="flex-row items-center px-5 py-3 border-b border-border">
              <Pressable onPress={handleCancel} className="w-[60px]">
                <Text className="text-sm text-textMid">{cancel}</Text>
              </Pressable>
              <Text className="flex-1 text-center font-semibold text-textDark">
                {title}
              </Text>
              <Pressable
                onPress={onSave}
                disabled={saveDisabled || isSaving}
                className="w-[60px] items-end"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    className={`font-semibold text-sm ${
                      saveDisabled ? 'text-textLight' : 'text-primary'
                    }`}
                  >
                    {save}
                  </Text>
                )}
              </Pressable>
            </View>
          )
        )}

        {/* Content */}
        {scrollable ? (
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
