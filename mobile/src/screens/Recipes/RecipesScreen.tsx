import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { AppTheme } from '../../navigation/theme';

export default function RecipesScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator color={AppTheme.colors.primary} />
      <Text className="text-textMid mt-2">Loading Recipes...</Text>
    </View>
  );
}
