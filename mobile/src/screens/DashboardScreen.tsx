import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <View className="flex-1 items-center justify-center">
        <Text className="text-4xl mb-3">❤️</Text>
        <Text className="text-2xl font-bold text-gray-900">Love Scrum</Text>
        <Text className="text-sm text-gray-400 mt-2">Dashboard — Sprint 35</Text>
      </View>
    </SafeAreaView>
  );
}
