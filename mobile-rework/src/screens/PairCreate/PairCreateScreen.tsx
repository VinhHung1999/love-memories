import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { usePairCreateViewModel } from './usePairCreateViewModel';

// Sprint 68 D2prime — PairChoice 1:1 with prototype `pairing.jsx` L5-162.
// Soft heroA → bg wash (height 320, opacity 0.35), standalone back-circle
// in place of ScreenHeader, hero text block (Dancing-Script kicker +
// display-italic title), then two PairOptionCards: primary (Create) is a
// gradient hero with envelope icon and white text; secondary (Join) is
// a surface card with keypad-dots icon. Quiet privacy line at bottom.

export function PairCreateScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();
  const { onCreate, onJoin } = usePairCreateViewModel();

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[320px] opacity-[0.35]">
        <LinearGradient
          colors={[c.heroA, c.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 h-14 flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              hitSlop={8}
              className="w-9 h-9 rounded-full bg-surface border border-line items-center justify-center active:opacity-80"
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 6l-6 6 6 6"
                  stroke={c.ink}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>

          <View className="px-7 pt-5">
            <Text className="font-script text-[22px] leading-[22px]" style={{ color: c.primary }}>
              {t('onboarding.pairing.choice.kicker')}
            </Text>
            <Text
              className="mt-2 font-displayItalic text-ink text-[38px] leading-[40px]"
              style={{ letterSpacing: -0.025 * 38 }}
            >
              {t('onboarding.pairing.choice.title')}
            </Text>
            <Text className="mt-2.5 font-body text-ink-soft text-[13.5px] leading-[20px] max-w-[300px]">
              {t('onboarding.pairing.choice.body')}
            </Text>
          </View>

          <View className="px-6 pt-7">
            <PairOptionCard
              primary
              kicker={t('onboarding.pairing.choice.create.kicker')}
              title={t('onboarding.pairing.choice.create.title')}
              desc={t('onboarding.pairing.choice.create.desc')}
              onPress={onCreate}
            />
            <View className="h-3" />
            <PairOptionCard
              primary={false}
              kicker={t('onboarding.pairing.choice.join.kicker')}
              title={t('onboarding.pairing.choice.join.title')}
              desc={t('onboarding.pairing.choice.join.desc')}
              onPress={onJoin}
            />
          </View>

          <View className="px-6 pt-7 pb-9 items-center">
            <Text className="font-body text-ink-mute text-[11.5px] leading-[18px] text-center">
              {t('onboarding.pairing.choice.privacy')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// PairOptionCard — primary is gradient hero (envelope), secondary is
// surface tint card (keypad dots). BUG-3 hot-fix: shadow lives on an
// OUTER wrapper View so iOS doesn't clip it via the inner Pressable's
// `overflow-hidden`. The Pressable owns the rounded clip + the entire
// tap target so the chevron, icon disc, and gradient layer all forward
// presses to the same handler.
function PairOptionCard({
  primary,
  kicker,
  title,
  desc,
  onPress,
}: {
  primary: boolean;
  kicker: string;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  const c = useAppColors();
  const tint = primary ? c.primary : c.accent;
  return (
    <View
      className="rounded-[22px]"
      style={
        primary
          ? {
              shadowColor: c.primary,
              shadowOpacity: 0.45,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 18 },
              elevation: 8,
            }
          : {
              shadowColor: '#000000',
              shadowOpacity: 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 2,
            }
      }
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        hitSlop={4}
        className="rounded-[22px] overflow-hidden flex-row items-center px-5 py-5 active:opacity-90"
        style={
          primary
            ? null
            : {
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.line,
              }
        }
      >
        {primary ? (
          <View pointerEvents="none" className="absolute inset-0">
            <LinearGradient
              colors={[c.primary, c.heroB ?? c.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute inset-0"
            />
          </View>
        ) : null}

        <View
          pointerEvents="none"
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={
            primary
              ? {
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                }
              : { backgroundColor: tint + '1a' }
          }
        >
          {primary ? (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Rect x={3} y={6} width={18} height={13} rx={2} stroke="#FFFFFF" strokeWidth={1.8} />
              <Path
                d="M3 7l9 7 9-7"
                stroke="#FFFFFF"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : (
            <Svg width={18} height={18} viewBox="0 0 18 18" fill={tint}>
              <Circle cx={3} cy={3} r={1.6} />
              <Circle cx={9} cy={3} r={1.6} />
              <Circle cx={15} cy={3} r={1.6} />
              <Circle cx={3} cy={9} r={1.6} />
              <Circle cx={9} cy={9} r={1.6} />
              <Circle cx={15} cy={9} r={1.6} />
              <Circle cx={3} cy={15} r={1.6} opacity={0.4} />
              <Circle cx={9} cy={15} r={1.6} opacity={0.4} />
              <Circle cx={15} cy={15} r={1.6} opacity={0.4} />
            </Svg>
          )}
        </View>

        <View pointerEvents="none" className="flex-1 min-w-0">
          <Text
            className="font-script text-[16px] leading-[16px]"
            style={{ color: primary ? 'rgba(255,255,255,0.92)' : tint }}
          >
            {kicker}
          </Text>
          <Text
            className="mt-1 font-displayItalic text-[20px] leading-[24px]"
            style={{
              color: primary ? '#FFFFFF' : c.ink,
              letterSpacing: -0.015 * 20,
            }}
          >
            {title}
          </Text>
          <Text
            className="mt-1 font-body text-[12.5px] leading-[17px]"
            style={{ color: primary ? 'rgba(255,255,255,0.78)' : c.inkSoft }}
          >
            {desc}
          </Text>
        </View>

        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 6l6 6-6 6"
            stroke={primary ? 'rgba(255,255,255,0.8)' : c.inkMute}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
    </View>
  );
}
