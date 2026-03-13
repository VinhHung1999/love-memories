import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { X, Heart, Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation';
import { useAppColors } from '../../navigation/theme';
import { PLANS, usePaywallViewModel, type PlanKey } from './usePaywallViewModel';
import t from '../../locales/en';

// ── Feature comparison rows ─────────────────────────────────────────────────

const COMPARISON_ROWS: Array<{
  feature: string;
  free: string;
  plus: string;
  plusIsCheck?: boolean;
}> = [
  { feature: t.paywall.features.moments,     free: t.paywall.freeVal.moments,     plus: t.paywall.plusVal.moments,     plusIsCheck: true },
  { feature: t.paywall.features.foodspots,   free: t.paywall.freeVal.foodspots,   plus: t.paywall.plusVal.foodspots,   plusIsCheck: true },
  { feature: t.paywall.features.expenses,    free: t.paywall.freeVal.expenses,    plus: t.paywall.plusVal.expenses,    plusIsCheck: true },
  { feature: t.paywall.features.recipes,     free: t.paywall.freeVal.recipes,     plus: t.paywall.plusVal.recipes,     plusIsCheck: true },
  { feature: t.paywall.features.letters,     free: t.paywall.freeVal.letters,     plus: t.paywall.plusVal.letters,     plusIsCheck: true },
  { feature: t.paywall.features.datePlanner, free: t.paywall.freeVal.datePlanner, plus: t.paywall.plusVal.datePlanner, plusIsCheck: true },
  { feature: t.paywall.features.monthlyRecap,free: t.paywall.freeVal.monthlyRecap,plus: t.paywall.plusVal.monthlyRecap,plusIsCheck: true },
  { feature: t.paywall.features.achievements,free: t.paywall.freeVal.achievements,plus: t.paywall.plusVal.achievements,plusIsCheck: true },
];

// ── Animated pricing card ──────────────────────────────────────────────────

interface PricingCardProps {
  plan: typeof PLANS[number];
  isSelected: boolean;
  index: number;
  onPress: (key: PlanKey) => void;
}

function PricingCard({ plan, isSelected, index, onPress }: PricingCardProps) {
  const colors = useAppColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSpring(0.96, { mass: 0.3, stiffness: 300 }, () => {
      scale.value = withSpring(1, { mass: 0.3, stiffness: 300 });
    });
    onPress(plan.key);
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(80 * index).springify().damping(18)}
      style={animStyle}
      className="mb-3"
    >
      {/* BEST VALUE badge — floats above card */}
      {plan.isBestValue ? (
        <View className="absolute -top-2.5 right-4 z-10">
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
              {t.paywall.bestValue}
            </Text>
          </LinearGradient>
        </View>
      ) : null}

      <Pressable onPress={handlePress}>
        <View
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: isSelected ? '#FFF0F2' : '#FFFFFF',
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? colors.primary : colors.border,
            // 4pt left accent bar via shadow workaround — use borderLeftWidth
          }}
        >
          {/* Left accent bar */}
          {isSelected ? (
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                backgroundColor: colors.primary,
                borderTopLeftRadius: 14,
                borderBottomLeftRadius: 14,
              }}
            />
          ) : null}

          <View className="flex-row items-center px-5 py-4">
            {/* Plan name + per-month note */}
            <View className="flex-1">
              <Text
                className="text-base font-semibold"
                style={{ color: isSelected ? colors.primary : colors.textDark }}
              >
                {plan.label}
              </Text>
              {plan.perMonth ? (
                <Text className="text-[11px] mt-0.5" style={{ color: colors.primary }}>
                  {plan.perMonth}
                </Text>
              ) : null}
            </View>

            {/* VND price (primary) + USD (secondary) */}
            <View className="items-end">
              <View className="flex-row items-baseline gap-0.5">
                <Text
                  className="text-xl font-bold"
                  style={{ color: isSelected ? colors.primary : colors.textDark }}
                >
                  {plan.price}
                </Text>
                <Text className="text-xs" style={{ color: colors.textMid }}>
                  {plan.period}
                </Text>
              </View>
              <Text className="text-[11px]" style={{ color: colors.textLight }}>
                {plan.priceUsd}
              </Text>
            </View>

            {/* Selection indicator */}
            <View
              className="ml-3 w-5 h-5 rounded-full items-center justify-center"
              style={{
                backgroundColor: isSelected ? colors.primary : 'transparent',
                borderWidth: isSelected ? 0 : 1.5,
                borderColor: colors.textLight,
              }}
            >
              {isSelected ? <Check size={12} color="#FFFFFF" strokeWidth={2.5} /> : null}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Feature comparison table ───────────────────────────────────────────────

function FeatureTable() {
  const colors = useAppColors();
  return (
    <Animated.View entering={FadeInDown.delay(360).springify().damping(18)}>
      <View className="rounded-2xl overflow-hidden" style={{ borderWidth: 1, borderColor: colors.border }}>
        {/* Header */}
        <View className="flex-row" style={{ backgroundColor: colors.primaryMuted }}>
          <Text className="flex-1 text-xs font-semibold py-2.5 px-4" style={{ color: colors.textDark }}>
            Feature
          </Text>
          <Text className="w-20 text-xs font-semibold py-2.5 text-center" style={{ color: colors.textMid }}>
            {t.paywall.free}
          </Text>
          <Text className="w-20 text-xs font-semibold py-2.5 text-center" style={{ color: colors.primary }}>
            {t.paywall.plus}
          </Text>
        </View>

        {COMPARISON_ROWS.map((row, i) => (
          <View
            key={row.feature}
            className="flex-row items-center"
            style={{
              backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FDFAF9',
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="flex-1 text-xs py-2.5 px-4" style={{ color: colors.textDark }}>
              {row.feature}
            </Text>

            {/* Free value */}
            <View className="w-20 items-center py-2.5">
              <Text
                className="text-xs text-center"
                style={{ color: row.free === '—' ? colors.textLight : colors.textMid }}
              >
                {row.free}
              </Text>
            </View>

            {/* Plus value */}
            <View className="w-20 items-center py-2.5">
              {row.plusIsCheck ? (
                <View
                  className="w-5 h-5 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#FFF0F2' }}
                >
                  <Check size={11} color={colors.primary} strokeWidth={2.5} />
                </View>
              ) : (
                <Text
                  className="text-xs font-semibold text-center"
                  style={{ color: colors.primary }}
                >
                  {row.plus}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AppStackParamList, 'Paywall'>;

export default function PaywallScreen({ navigation, route }: Props) {
  const colors = useAppColors();
  const trigger = route.params?.trigger ?? 'browse';
  const blockedFeature = route.params?.blockedFeature;

  const vm = usePaywallViewModel(() => navigation.goBack());

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF8F6' }}>
      {/* ── Top bar ── */}
      <View className="flex-row items-center px-4 pt-2 pb-1">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primaryMuted }}
        >
          <X size={18} color={colors.primary} strokeWidth={2} />
        </Pressable>
        <Text
          className="flex-1 text-center text-base font-semibold"
          style={{ color: colors.textDark }}
        >
          {t.paywall.title}
        </Text>
        {/* Spacer to balance X button */}
        <View className="w-9" />
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      >
        {/* Limit trigger banner */}
        {trigger === 'limit' && blockedFeature ? (
          <Animated.View entering={FadeInDown.delay(0).springify().damping(18)}>
            <View
              className="flex-row items-center gap-2 rounded-2xl px-4 py-3 mb-4 mt-2"
              style={{ backgroundColor: '#FFF0F2', borderWidth: 1, borderColor: colors.primaryLighter }}
            >
              <Text className="text-xs" style={{ color: colors.primary }}>
                {t.paywall.limitBanner}{' '}
                <Text className="font-semibold">{blockedFeature}</Text>.
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Hero */}
        <Animated.View
          entering={FadeInDown.delay(40).springify().damping(18)}
          className="items-center py-6"
        >
          {/* Overlapping hearts motif */}
          <View className="flex-row items-center mb-4" style={{ gap: -8 }}>
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primaryLighter }}
            >
              <Heart size={22} color={colors.primary} strokeWidth={0} fill={colors.primary} />
            </View>
            <View
              className="w-16 h-16 rounded-full items-center justify-center z-10"
              style={{ backgroundColor: colors.primaryMuted, borderWidth: 3, borderColor: '#FFF8F6' }}
            >
              <Heart size={30} color={colors.primary} strokeWidth={0} fill={colors.primary} />
            </View>
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primaryLighter }}
            >
              <Heart size={22} color={colors.primary} strokeWidth={0} fill={colors.primary} />
            </View>
          </View>

          <Text
            className="text-3xl font-bold text-center"
            style={{ color: colors.textDark, letterSpacing: -0.5, lineHeight: 38 }}
          >
            {t.paywall.headline}
          </Text>
          <Text className="text-sm text-center mt-2" style={{ color: colors.textMid, lineHeight: 20 }}>
            {t.paywall.subtitle}
          </Text>
        </Animated.View>

        {/* Pricing cards */}
        <View className="mt-2 mb-6">
          {PLANS.map((plan, i) => (
            <PricingCard
              key={plan.key}
              plan={plan}
              isSelected={vm.selectedPlan === plan.key}
              index={i}
              onPress={vm.setSelectedPlan}
            />
          ))}
        </View>

        {/* Feature comparison */}
        <Text
          className="text-sm font-semibold mb-3"
          style={{ color: colors.textDark }}
        >
          What's included
        </Text>
        <FeatureTable />

        {/* Restore purchases */}
        <Pressable
          onPress={vm.handleRestore}
          disabled={vm.isRestoring || vm.isPurchasing}
          className="mt-6 items-center py-3"
        >
          <Text className="text-xs" style={{ color: colors.textLight }}>
            {vm.isRestoring ? t.paywall.restoring : t.paywall.restore}
          </Text>
        </Pressable>
      </ScrollView>

      {/* ── Fixed bottom CTA bar ── */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3"
        style={{ backgroundColor: '#FFF8F6', borderTopWidth: 1, borderColor: colors.border }}
      >
        <Pressable
          onPress={vm.handlePurchase}
          disabled={vm.isPurchasing || vm.isRestoring}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: 'rgba(232,120,138,0.35)',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 1,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {vm.isPurchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
                {t.paywall.cta}
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
