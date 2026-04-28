// Sprint 67 T453 — Section header wrapper. Ports prototype `recap.jsx`
// L699-720 RecapSection() to RN. Used by every section 01-09 of the
// Monthly editorial scroll (and reused by Weekly via the shared primitives
// folder).
//
// Renders: kicker number ("01" — primary color, display font) + flex-1
// horizontal divider line + title (display font, 26px) + children block.
// 28px top margin to space sections apart.

import { Text, View } from 'react-native';

type Props = {
  kicker: string;
  title: string;
  children?: React.ReactNode;
};

export function RecapSection({ kicker, title, children }: Props) {
  return (
    <View className="mx-4 mt-7">
      <View className="flex-row items-baseline gap-2.5">
        <Text className="font-displayBold text-[14px] tracking-wider text-primary">
          {kicker}
        </Text>
        <View className="h-px flex-1 bg-line" />
      </View>
      <Text className="mt-2.5 font-displayMedium text-[26px] leading-[28px] text-ink">
        {title}
      </Text>
      {children}
    </View>
  );
}
