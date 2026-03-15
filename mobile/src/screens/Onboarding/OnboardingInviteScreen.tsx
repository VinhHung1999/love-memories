import React, { useEffect, useState } from 'react';
import { Pressable, Share, StatusBar, View } from 'react-native';
import { Body, Caption, Heading, Label } from '../../components/Typography';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { OnboardingStackParamList } from '../../navigation/index';
import { ChevronLeft, Copy, Share2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SpringPressable from '../../components/SpringPressable';
import { coupleApi } from '../../lib/api';
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
  const { coupleId, anniversaryDate } = route.params;

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coupleApi.generateInvite()
      .then(({ inviteCode: code }) => setInviteCode(code))
      .catch(() => setInviteCode(null))
      .finally(() => setLoading(false));
  }, []);

  const handleShare = async () => {
    if (!inviteCode) return;
    await Share.share({
      message: `Join me on Love Memories! Use invite code: ${inviteCode}`,
      title: 'Love Memories Invite',
    });
  };

  const handleNext = () => {
    navigation.navigate('OnboardingAvatar', { coupleId, anniversaryDate });
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
            <Share2 size={36} color="#E8788A" strokeWidth={1.5} />
          </View>
          <Heading size="xl" className="text-textDark text-center" style={{ fontSize: 26, lineHeight: 34 }}>
            {t.onboarding.invite.title}
          </Heading>
          <Caption className="text-textMid text-center mt-2">{t.onboarding.invite.subtitle}</Caption>
        </Animated.View>

        {/* Invite code card */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} className="flex-1 items-center justify-center">
          <View className="w-full rounded-3xl border-2 border-primary/30 bg-primary/5 px-6 py-8 items-center gap-3">
            <Caption className="text-textLight">{t.onboarding.invite.inviteCode}</Caption>
            {loading ? (
              <Body size="lg" className="text-textMid">{t.onboarding.invite.generating}</Body>
            ) : (
              <View className="flex-row items-center gap-3">
                <Label className="text-primary" style={{ fontSize: 28, letterSpacing: 6, fontWeight: '700' }}>
                  {inviteCode ?? '------'}
                </Label>
                <Copy size={18} color="#E8788A" strokeWidth={1.5} />
              </View>
            )}
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} className="gap-3">
          <SpringPressable onPress={handleShare} disabled={!inviteCode} className="w-full h-14 rounded-2xl items-center justify-center flex-row gap-2" style={{ backgroundColor: inviteCode ? '#E8788A' : '#E8788A60' }}>
            <Share2 size={18} color="#fff" strokeWidth={1.5} />
            <Body size="lg" className="font-semibold" style={{ color: '#fff', letterSpacing: 0.3 }}>
              {t.onboarding.invite.shareBtn}
            </Body>
          </SpringPressable>
          <SpringPressable onPress={handleNext} className="w-full h-14 rounded-2xl items-center justify-center border border-primary/40" style={{ backgroundColor: '#fff' }}>
            <Body size="lg" className="font-semibold text-primary">{t.onboarding.invite.continueBtn}</Body>
          </SpringPressable>
          <Pressable onPress={handleNext} className="items-center py-2">
            <Body size="sm" className="text-textLight">{t.onboarding.invite.skipBtn}</Body>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}
