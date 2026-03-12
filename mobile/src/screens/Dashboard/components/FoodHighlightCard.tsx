import React from 'react';
import { Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ChevronRight, Star, Utensils } from 'lucide-react-native';
import { useAppColors } from '../../../navigation/theme';
import type { FoodSpot } from '../../../types';

interface FoodHighlightCardProps {
  spot: FoodSpot;
  onPress: () => void;
}

export function FoodHighlightCard({ spot, onPress }: FoodHighlightCardProps) {
  const colors = useAppColors();
  const coverPhoto = spot.photos[0];

  return (
    <Pressable onPress={onPress} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-borderSoft flex-row">
      <View className="w-[80px] h-[80px] bg-secondary/10 items-center justify-center flex-shrink-0">
        {coverPhoto ? (
          <FastImage source={{ uri: coverPhoto.url, priority: FastImage.priority.normal }} style={{ width: '100%', height: '100%' }} resizeMode={FastImage.resizeMode.cover} />
        ) : (
          <Utensils size={24} color={colors.secondary} strokeWidth={1.5} />
        )}
      </View>
      <View className="flex-1 px-3 py-3 justify-center">
        <Text className="text-sm font-headingSemi text-textDark mb-0.5" numberOfLines={1}>
          {spot.name}
        </Text>
        <View className="flex-row items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              size={10}
              color={colors.starRating}
              strokeWidth={1.5}
              fill={i <= Math.round(spot.rating) ? colors.starRating : 'none'}
            />
          ))}
          <Text className="text-[10px] font-bodyLight text-textLight ml-0.5">{spot.rating}/5</Text>
        </View>
        {spot.location ? (
          <Text className="text-[10px] font-bodyLight text-textLight mt-0.5" numberOfLines={1}>
            📍 {spot.location}
          </Text>
        ) : null}
      </View>
      <View className="items-center justify-center pr-3">
        <ChevronRight size={16} color={colors.textLight} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
}
