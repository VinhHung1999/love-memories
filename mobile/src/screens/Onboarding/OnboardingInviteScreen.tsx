import React from 'react';
import { Pressable, StatusBar, View } from 'react-native';
import { Body, Caption, Heading } from '../../components/Typography';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { OnboardingStackParamList } from '../../navigation/index';
import { ChevronLeft, UserPlus } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SpringPressable from '../../components/SpringPressable';
import t from '../../locales/en';

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="rounded-full"
          style={{
            width: i === step ? 20 : 8,
            height: 8,
            backgroundColor: i === step ? '#E8788A' : '#E8788A40',
          }}
        />
      ))}
    </View>
  );
}

export default function OnboardingInviteScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const route = useRoute<RouteProp<OnboardingStackParamList, 'OnboardingInvite'>>();
  const { coupleName, anniversaryDate } = route.params;

  const handleNext = () => {
    navigation.navigate('OnboardingAvatar', { coupleName, anniversaryDate });
  };

  return (
    <LinearGradient colors={['#FFF0F3', '#FFF8F6', '#FFFFFF']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View className="flex-1 px-6 pt-16 pb-10">

        {/* Back + dots */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} className="flex-row items-center justify-between mb-8">
          <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#E8788A15' }}>
            <ChevronLeft size={20} color="#E8788A" strokeWidth={2} />
          </Pressable>
          <ProgressDots step={2} total={4} />
          <View className="w-10" />
        </Animated.View>

        {/* Icon + heading */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} className="items-center mb-8">
          <View className="w-20 h-20 rounded-3xl items-center justify-center mb-4" style={{ backgroundColor: '#E8788A15' }}>
            <UserPlus size={36} color="#E8788A" strokeWidth={1.5} />
          </View>
          <Heading size="xl" className="text-textDark text-center" style={{ fontSize: 26, lineHeight: 34 }}>
            {t.onboarding.invite.title}
          </Heading>
          <Caption className="text-textMid text-center mt-2">{t.onboarding.invite.subtitle}</Caption>
        </Animated.View>

        {/* Info card */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} className="flex-1 items-center justify-center">
          <View className="w-full rounded-3xl border border-primary/20 bg-primary/5 px-6 py-8 items-center gap-3">
            <UserPlus size={28} color="#E8788A" strokeWidth={1.5} />
            <Body size="md" className="text-textMid text-center" style={{ lineHeight: 22 }}>
              {t.onboarding.invite.afterSetupNote}
            </Body>
          </View>
        </Animated.View>

        {/* Continue button */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} className="gap-3">
          <SpringPressable onPress={handleNext} className="w-full h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: '#E8788A' }}>
            <Body size="lg" className="font-semibold" style={{ color: '#fff', letterSpacing: 0.3 }}>
              {t.onboarding.invite.continueBtn}  →
            </Body>
          </SpringPressable>
        </Animated.View>

      </View>
    </LinearGradient>
  );
}
