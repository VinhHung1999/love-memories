import { Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

// T376 — empty-state block shown when the couple has 0 moments. Three-frame
// polaroid illustration (tilted ±7° outer, centered ♡ big) + headline +
// subtitle + single pill CTA that opens the Camera action sheet (T377).

type Props = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
};

export function MomentsEmpty({ title, subtitle, ctaLabel, onCta }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-10 pt-6">
      <View className="w-[200px] h-[140px] items-center justify-center mb-6">
        {/* Left frame — tilted -7° */}
        <View className="absolute left-0 top-3 w-[76px] h-[96px] rounded-xl bg-surface border border-line-on-surface -rotate-6 items-center justify-center">
          <Text className="font-displayMedium text-ink-mute text-[26px]">+</Text>
        </View>
        {/* Right frame — tilted +7° */}
        <View className="absolute right-0 top-3 w-[76px] h-[96px] rounded-xl bg-surface border border-line-on-surface rotate-6 items-center justify-center">
          <Text className="font-displayMedium text-ink-mute text-[26px]">+</Text>
        </View>
        {/* Centered elevated frame with heart */}
        <View className="absolute left-[50px] top-0 w-[100px] h-[120px] rounded-2xl bg-surface border border-line-on-surface items-center justify-center shadow-lg">
          <Text className="text-primary text-[40px]">♡</Text>
        </View>
      </View>

      <Text className="font-displayMedium text-ink text-[22px] leading-[28px] text-center max-w-[260px]">
        {title}
      </Text>
      <Text className="font-body text-ink-mute text-[13.5px] leading-[21px] text-center mt-3 max-w-[280px]">
        {subtitle}
      </Text>

      <Pressable
        onPress={onCta}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        className="mt-7 flex-row items-center px-6 h-12 rounded-full bg-primary shadow-lg active:bg-primary-deep"
      >
        <Plus size={18} strokeWidth={2.5} color="#ffffff" />
        <Text className="font-bodySemibold text-white text-[15px] ml-2">
          {ctaLabel}
        </Text>
      </Pressable>
    </View>
  );
}
