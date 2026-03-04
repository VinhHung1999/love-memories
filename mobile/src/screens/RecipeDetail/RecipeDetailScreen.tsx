import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AppTheme } from '../../navigation/theme';

export default function RecipeDetailScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator color={AppTheme.colors.primary} />
    </View>
  );
}
