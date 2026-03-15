import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { Body, Caption, Heading } from '../../components/Typography';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { OnboardingStackParamList } from '../../navigation/index';
import { Heart } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import SpringPressable from '../../components/SpringPressable';
import t from '../../locales/en';

// Reuse confetti pattern from Avatar screen
const CONFETTI_PIECES = [
  { x: -90, y: -140, color: '#E8788A', size: 10 },
  { x: 90,  y: -140, color: '#F4A261', size: 8  },
  { x: -50, y: -160, color: '#7EC8B5', size: 7  },
  { x: 50,  y: -160, color: '#E8788A', size: 9  },
  { x: -130,y: -80,  color: '#F4A261', size: 6  },
  { x: 130, y: -80,  color: '#7EC8B5', size: 8  },
  { x: -140,y: -120, color: '#E8788A', size: 7  },
  { x: 140, y: -120, color: '#F4A261', size: 9  },
  { x: -60, y: -180, color: '#7EC8B5', size: 6  },
  { x: 60,  y: -180, color: '#E8788A', size: 8  },
  { x: -110,y: -50,  color: '#F4A261', size: 7  },
  { x: 110, y: -50,  color: '#7EC8B5', size: 6  },
];

function ConfettiParticle({ tx, ty, color, size, delay }: { tx: number; ty: number; color: string; size: number; delay: number }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    x.value = withDelay(delay, withTiming(tx, { duration: 800 }));
    y.value = withDelay(delay, withTiming(ty, { duration: 800 }));
    opacity.value = withDelay(delay + 400, withTiming(0, { duration: 600 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    opacity: opacity.value,
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  }));

  return <Animated.View style={style} />;
}

export default function OnboardingCelebrationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const route = useRoute<RouteProp<OnboardingStackParamList, 'OnboardingCelebration'>>();
  const { coupleId, partnerName } = route.params;

  const heartScale = useSharedValue(1);

  useEffect(() => {
    heartScale.value = withDelay(300, withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ),
      -1, true,
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const handleContinue = () => {
    navigation.navigate('OnboardingAvatar', { coupleId });
  };

  useEffect(() => {
    const timer = setTimeout(handleContinue, 2000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtitle = partnerName
    ? t.onboarding.celebration.subtitle.replace('{name}', partnerName)
    : t.onboarding.celebration.subtitleNoName;

  return (
    <LinearGradient colors={['#FFF0F3', '#FFF8F6', '#FFFFFF']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View className="flex-1 px-6 pt-16 pb-10 items-center justify-center">

        {/* Confetti burst */}
        <View style={{ position: 'absolute', top: '50%', left: '50%' }}>
          {CONFETTI_PIECES.map((p, i) => (
            <ConfettiParticle key={i} tx={p.x} ty={p.y} color={p.color} size={p.size} delay={i * 30} />
          ))}
        </View>

        {/* Heart */}
        <Animated.View entering={FadeIn.duration(400)} style={heartStyle} className="mb-6">
          <Heart size={72} color="#E8788A" fill="#E8788A" strokeWidth={0} />
        </Animated.View>

        {/* Text */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} className="items-center gap-3 mb-12">
          <Heading size="xl" className="text-textDark text-center" style={{ fontSize: 28, lineHeight: 36 }}>
            {t.onboarding.celebration.title}
          </Heading>
          <Caption className="text-textMid text-center" style={{ lineHeight: 20 }}>
            {subtitle}
          </Caption>
        </Animated.View>

        {/* Continue button */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} className="w-full">
          <SpringPressable
            onPress={handleContinue}
            className="w-full h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: '#E8788A' }}>
            <Body size="lg" className="font-semibold" style={{ color: '#fff', letterSpacing: 0.3 }}>
              {t.onboarding.celebration.continueBtn}
            </Body>
          </SpringPressable>
        </Animated.View>

      </View>
    </LinearGradient>
  );
}
