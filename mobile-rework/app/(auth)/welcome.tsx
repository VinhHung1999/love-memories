import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeScreen } from '@/components';

export default function Welcome() {
  const { t } = useTranslation();
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-displayMedium text-3xl text-ink">{t('auth.welcomeTitle')}</Text>
        <Text className="font-body text-base text-ink-soft mt-3 text-center">
          {t('auth.welcomeSub')}
        </Text>
      </View>
    </SafeScreen>
  );
}
