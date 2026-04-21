import { MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

// T399 (Sprint 63) — inline pill that sits in the Compose tag row next to
// the `+ tag` chip. Two visual states:
//   - empty  → dashed border, muted MapPin, "Thêm địa điểm" copy
//   - picked → solid surface + line border, ink MapPin, place name (1-line
//              ellipsis at 140px to keep the row compact on small phones)
// Tap on either state opens the LocationPickerSheet. Clearing happens from
// inside the sheet (spec §4), not on the pill itself.

type Props = {
  value: string | null;
  onPress: () => void;
};

export function LocationPill({ value, onPress }: Props) {
  const c = useAppColors();
  const { t } = useTranslation();

  const hasValue = !!value && value.trim().length > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        hasValue
          ? t('compose.momentCreate.location.editLabel', { name: value })
          : t('compose.momentCreate.location.addLabel')
      }
      className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border active:opacity-70"
      style={{
        backgroundColor: hasValue ? c.surface : 'transparent',
        borderColor: c.lineOnSurface,
        borderStyle: hasValue ? 'solid' : 'dashed',
      }}
    >
      <MapPin
        size={11}
        strokeWidth={2.3}
        color={hasValue ? c.ink : c.inkMute}
      />
      <Text
        numberOfLines={1}
        className="font-bodySemibold text-ink text-[12px] leading-[16px] max-w-[140px]"
      >
        {hasValue ? value : t('compose.momentCreate.location.addLabel')}
      </Text>
    </Pressable>
  );
}
