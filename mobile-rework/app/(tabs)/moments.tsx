import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeScreen } from '@/components';

export default function Moments() {
  const { t } = useTranslation();
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center">
        <Text className="font-displayMedium text-2xl text-ink">{t('tabs.moments')}</Text>
      </View>
    </SafeScreen>
  );
}
