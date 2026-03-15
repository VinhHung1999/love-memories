import React, { useState } from 'react';
import { Pressable, StatusBar, View } from 'react-native';
import { Body, Caption, Heading } from '../../components/Typography';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { OnboardingStackParamList } from '../../navigation/index';
import { ChevronLeft, Heart } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import SpringPressable from '../../components/SpringPressable';
import t from '../../locales/en';
import { useAppColors } from '../../navigation/theme';

function ProgressDots({ step, total }: { step: number; total: number }) {
  const colors = useAppColors();
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="rounded-full"
          style={{
            width: i === step ? 20 : 8,
            height: 8,
            backgroundColor: i === step ? colors.primary : colors.primary + '40',
          }}
        />
      ))}
    </View>
  );
}

export default function OnboardingAnniversaryScreen() {
  const colors = useAppColors();
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const route = useRoute<RouteProp<OnboardingStackParamList, 'OnboardingAnniversary'>>();
  const { coupleName } = route.params;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleChange = (_: DateTimePickerEvent, date?: Date) => {
    if (date) setSelectedDate(date);
  };

  const handleSkip = () => {
    navigation.navigate('OnboardingAvatar', { coupleName });
  };

  const handleConfirm = () => {
    navigation.navigate('OnboardingAvatar', {
      coupleName,
      anniversaryDate: selectedDate.toISOString(),
    });
  };

  return (
    <LinearGradient
      colors={['#FFF0F3', '#FFF8F6', '#FFFFFF']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View className="flex-1 px-6 pt-16 pb-10">

        {/* Back + dots */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} className="flex-row items-center justify-between mb-8">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primaryMuted }}>
            <ChevronLeft size={20} color="#E8788A" strokeWidth={2} />
          </Pressable>
          <ProgressDots step={1} total={4} />
          <View className="w-10" />
        </Animated.View>

        {/* Heart icon */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} className="items-center mb-6">
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center"
            style={{ backgroundColor: colors.primaryMuted }}>
            <Heart size={40} color="#E8788A" fill="#E8788A" strokeWidth={0} />
          </View>
        </Animated.View>

        {/* Heading */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="items-center mb-2">
          <Heading size="xl" className="text-textDark dark:text-darkTextDark text-center" style={{ fontSize: 26, lineHeight: 34 }}>
            {t.onboarding.anniversary.title}
          </Heading>
          <Caption className="text-textMid dark:text-darkTextMid text-center mt-2" style={{ lineHeight: 18 }}>
            {t.onboarding.anniversary.subtitle}
          </Caption>
        </Animated.View>

        {/* Inline date picker */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} className="items-center flex-1">
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="inline"
            maximumDate={new Date()}
            onChange={handleChange}
            accentColor="#E8788A"
            style={{ width: '100%', height: 320 }}
          />
        </Animated.View>

        {/* Buttons */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} className="gap-3">
          <SpringPressable
            onPress={handleConfirm}
            className="w-full h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}>
            <Body size="lg" className="font-semibold" style={{ color: colors.white, letterSpacing: 0.3 }}>
              {t.onboarding.anniversary.confirmBtn}
            </Body>
          </SpringPressable>

          <Pressable onPress={handleSkip} className="items-center py-3">
            <Body size="sm" className="text-textLight dark:text-darkTextLight">{t.onboarding.anniversary.skipBtn}</Body>
          </Pressable>
        </Animated.View>

      </View>
    </LinearGradient>
  );
}
