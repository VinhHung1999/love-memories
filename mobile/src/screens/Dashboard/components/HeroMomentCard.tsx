import React from 'react';
import { Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import type { Moment } from '../../../types';

interface HeroMomentCardProps {
  moment: Moment;
  onPress: () => void;
}

export function HeroMomentCard({ moment, onPress }: HeroMomentCardProps) {
  const colors = useAppColors();
  const coverPhoto = moment.photos[0];
  const dateLabel = new Date(moment.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Pressable onPress={onPress} className="w-[230px] h-[185px] rounded-2xl overflow-hidden">
      {coverPhoto ? (
        <FastImage
          source={{ uri: coverPhoto.url, priority: FastImage.priority.normal }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <LinearGradient
          colors={[colors.primaryLight, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.70)']}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
      />
      <View className="absolute top-2.5 right-2.5 bg-black/30 rounded-lg px-2 py-0.5">
        <Text className="text-[9px] font-heading text-white">{dateLabel}</Text>
      </View>
      <View className="absolute bottom-0 left-0 right-0 px-3.5 pb-3">
        <Text className="text-white font-headingSemi text-[13px] leading-snug" numberOfLines={2}>
          {moment.title}
        </Text>
        {moment.tags.length > 0 ? (
          <Text className="text-white/60 font-bodyLight text-[10px] mt-0.5" numberOfLines={1}>
            {moment.tags[0]}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
