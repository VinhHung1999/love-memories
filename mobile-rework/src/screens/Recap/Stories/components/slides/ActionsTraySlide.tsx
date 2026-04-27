// Sprint 67 T459 placeholder — full ActionsTray implementation lands in
// T461. For now we render the three CTAs minimally so the shell can
// preview a 9-slide deck end-to-end during T459 demo.

import { ChevronRight, Mail, Notebook, Video } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { Slide } from '../../types';

type ActionsTraySlide = Extract<Slide, { kind: 'actionsTray' }>;

type Props = { slide: ActionsTraySlide };

export function ActionsTraySlide({ slide }: Props) {
  const c = useAppColors();
  return (
    <View className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-7" style={{ gap: 14 }}>
        <Pressable
          accessibilityRole="button"
          onPress={slide.onSave}
          className="w-full flex-row items-center gap-3 rounded-2xl bg-ink px-5 py-4 active:opacity-80"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <Video size={16} color={c.bg} strokeWidth={2.2} />
          </View>
          <Text className="flex-1 font-bodyBold text-[14px] text-bg">
            {slide.saveLabel}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={slide.onShare}
          className="w-full flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4 active:opacity-70"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
            <Mail size={16} color={c.primary} strokeWidth={2.2} />
          </View>
          <Text className="flex-1 font-bodyBold text-[14px] text-ink">
            {slide.shareLabel}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={slide.onDetail}
          className="w-full flex-row items-center gap-3 rounded-2xl border border-dashed border-line bg-transparent px-5 py-4 active:opacity-70"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
            <Notebook size={16} color={c.accent} strokeWidth={2.2} />
          </View>
          <Text className="flex-1 font-bodySemibold text-[13px] text-ink-soft">
            {slide.detailLabel}
          </Text>
          <ChevronRight size={16} color={c.inkMute} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}
