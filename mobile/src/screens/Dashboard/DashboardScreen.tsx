import React from 'react';
import { Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useDashboardViewModel } from './useDashboardViewModel';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import t from '../../locales/en';

export default function DashboardScreen() {
  useDashboardViewModel();
  // Static scrollY — dashboard has no scroll content yet, header stays expanded
  const scrollY = useSharedValue(0);

  return (
    <View className="flex-1 bg-rose-50">
      <CollapsibleHeader
        title={t.dashboard.title}
        subtitle={t.dashboard.headerSubtitle}
        expandedHeight={100}
        collapsedHeight={56}
        scrollY={scrollY}
      />
      <View className="flex-1 items-center justify-center" style={{ paddingTop: 44 }}>
        <Text className="text-4xl mb-3">❤️</Text>
        <Text className="text-sm text-gray-400 mt-2">{t.dashboard.subtitle}</Text>
      </View>
    </View>
  );
}
