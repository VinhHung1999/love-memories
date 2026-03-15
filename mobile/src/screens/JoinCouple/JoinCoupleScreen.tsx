import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { useAppColors } from '../../navigation/theme';
import { Heading, Body } from '../../components/Typography';
import Button from '../../components/Button';
import { useJoinCoupleViewModel } from './useJoinCoupleViewModel';
import ScreenHeader from '../../components/ScreenHeader';
import { Heart } from 'lucide-react-native';
import t from '../../locales/en';

export default function JoinCoupleScreen() {
  const colors = useAppColors();
  const vm = useJoinCoupleViewModel();
  const scrollY = useSharedValue(0);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.baseBg }}>
      <ScreenHeader
        title={t.joinCouple.title}
        onBack={vm.handleBack}
        scrollY={scrollY}
        fadeStart={0}
        fadeEnd={0}
      />

      <View className="flex-1 items-center justify-center px-8">
        {/* Icon */}
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: colors.primaryMuted }}
        >
          <Heart size={36} color={colors.primary} strokeWidth={1.5} />
        </View>

        {vm.isJoining ? (
          <>
            <ActivityIndicator size="large" color={colors.primary} className="mb-4" />
            <Body size="md" className="text-textMid text-center">
              {t.joinCouple.joining}
            </Body>
          </>
        ) : vm.error ? (
          <>
            <Heading size="lg" className="text-textDark text-center mb-2">
              {t.joinCouple.errorTitle}
            </Heading>
            <Body size="md" className="text-textMid text-center mb-6">
              {vm.error}
            </Body>
            <Button label={t.joinCouple.tryAgain} onPress={vm.handleJoin} variant="primary" />
          </>
        ) : vm.isSuccess ? (
          <>
            <Heading size="xl" className="text-textDark text-center mb-2">
              {t.joinCouple.successTitle}
            </Heading>
            <Body size="md" className="text-textMid text-center mb-6">
              {t.joinCouple.successDesc}
            </Body>
          </>
        ) : (
          <>
            <Heading size="xl" className="text-textDark text-center mb-2">
              {t.joinCouple.title}
            </Heading>
            <Body size="md" className="text-textMid text-center mb-2">
              {t.joinCouple.desc}
            </Body>
            <Body size="sm" className="text-textLight text-center mb-6">
              {t.joinCouple.code}: <Body size="sm" className="font-bold text-primary">{vm.code}</Body>
            </Body>
            <Button label={t.joinCouple.joinBtn} onPress={vm.handleJoin} variant="primary" />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
