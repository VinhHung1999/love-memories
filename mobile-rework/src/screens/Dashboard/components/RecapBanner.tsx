// Sprint 67 T455 — Dashboard pin for the editorial Monthly Recap.
//
// Render window: last 3 days of the current month (when this month is the
// "live" recap to look back at) AND first 3 days of the next month (when
// the previous month is freshly closable). Otherwise hidden — the
// dashboard reverts to its baseline.
//
// Tap target month:
//   • Days 1-3 of MM → recap of MM-1 (previous full month)
//   • Last 3 days of MM → recap of MM (current month, finishing soon)

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

type Props = {
  monthStr: string;       // YYYY-MM target
  kicker: string;         // 'RECAP · Tháng 3' / 'RECAP · March'
  title: string;          // 'Tháng 3 của mình' / 'Our March'
  sub: string;            // 'Nhìn lại tháng vừa qua' / 'Look back at this month'
};

// Return the YYYY-MM string the banner should target on a given date, or
// null when the banner is outside its render window.
export function recapBannerTarget(now: Date = new Date()): string | null {
  const day = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days 1-3 → previous month.
  if (day <= 3) {
    let py = year;
    let pm = month - 1; // 0-based
    if (pm < 0) {
      py -= 1;
      pm = 11;
    }
    return `${py}-${String(pm + 1).padStart(2, '0')}`;
  }

  // Last 3 days of current month → current month.
  if (day >= daysInMonth - 2) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  }

  return null;
}

export function RecapBanner({ monthStr, kicker, title, sub }: Props) {
  const c = useAppColors();
  const router = useRouter();

  const onPress = () => {
    router.push({
      pathname: '/(modal)/recap/monthly',
      params: { month: monthStr },
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mx-5 mt-6 overflow-hidden rounded-3xl active:opacity-90"
    >
      <LinearGradient
        colors={[c.primaryDeep, c.heroC]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="flex-row items-center gap-3 px-5 py-5">
          <View className="flex-1">
            <Text className="font-bodyBold text-[10px] uppercase tracking-widest text-white/80">
              {kicker}
            </Text>
            <Text className="mt-1.5 font-displayMedium text-[22px] leading-[26px] text-white">
              {title}
            </Text>
            <Text className="mt-1 font-body text-[13px] text-white/85">{sub}</Text>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
