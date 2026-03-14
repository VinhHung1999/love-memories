import React from 'react';
import { Pressable, View } from 'react-native';
import { Caption, Label } from '../../../components/Typography';
import FastImage from 'react-native-fast-image';
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
        <View
          className="absolute inset-0"
          style={{ backgroundColor: colors.primaryLighter }}
        />
      )}
      {/* Dark scrim for text legibility — only when there's a photo */}
      {coverPhoto ? (
        <View
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
        />
      ) : null}
      <View className="absolute top-2.5 right-2.5 bg-black/30 rounded-lg px-2 py-0.5">
        <Caption className="font-heading" style={{ color: '#FFFFFF', fontSize: 9 }}>{dateLabel}</Caption>
      </View>
      <View className="absolute bottom-0 left-0 right-0 px-3.5 pb-3">
        <Label className="font-headingSemi" style={{ color: '#FFFFFF', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
          {moment.title}
        </Label>
        {moment.tags.length > 0 ? (
          <Caption className="font-bodyLight mt-0.5" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }} numberOfLines={1}>
            {moment.tags[0]}
          </Caption>
        ) : null}
      </View>
    </Pressable>
  );
}
