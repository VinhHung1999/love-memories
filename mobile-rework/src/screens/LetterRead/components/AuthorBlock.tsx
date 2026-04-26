import { Image, Text, View } from 'react-native';

import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

// T422 (Sprint 65) — centered author block: 56px circle (real avatar OR
// gradient initial) with a 3px white border + soft shadow + caption "Từ
// {Name} · viết lúc {time}". Rendered over the gradient hero, so caption
// uses `text-ink` to keep contrast against the lower fade band of the
// gradient (which mostly has cleared into bg by then). Prototype
// `letters.jsx` L325-341.

type Props = {
  authorName: string;
  authorAvatarUrl: string | null;
  caption: string;
};

export function AuthorBlock({ authorName, authorAvatarUrl, caption }: Props) {
  const c = useAppColors();
  const initial = authorName.trim().charAt(0).toUpperCase() || '·';

  return (
    <View className="items-center mt-7">
      <View
        className="w-14 h-14 rounded-full overflow-hidden border-[3px] border-white shadow-elevated"
        style={{ backgroundColor: c.primarySoft }}
      >
        {authorAvatarUrl ? (
          <Image
            source={{ uri: authorAvatarUrl }}
            resizeMode="cover"
            className="w-full h-full"
          />
        ) : (
          <LinearGradient
            colors={[c.secondary, c.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-full h-full items-center justify-center"
          >
            <Text className="font-displayMedium text-white text-[22px]">
              {initial}
            </Text>
          </LinearGradient>
        )}
      </View>
      <Text className="font-bodyBold text-ink text-[13px] mt-2">
        {caption}
      </Text>
    </View>
  );
}
