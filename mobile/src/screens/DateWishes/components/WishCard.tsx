import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check, CheckCircle, Pencil, Trash2 } from 'lucide-react-native';
import { useAppColors } from '../../../navigation/theme';
import type { DateWish } from '../../../types';
import { WISH_CATEGORIES } from '../useWishesViewModel';

export default function WishCard({
  wish,
  onMarkDone,
  onEdit,
  onDelete,
}: {
  wish: DateWish;
  onMarkDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = useAppColors();
  const cat = WISH_CATEGORIES.find(c => c.key === wish.category);
  const emoji = cat?.emoji ?? '⭐';

  return (
    <View
      className="bg-white rounded-3xl px-4 py-3.5 mb-3 shadow-sm"
      style={{ opacity: wish.done ? 0.6 : 1 }}>
      <View className="flex-row items-center gap-3">
        {/* Category emoji */}
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center mt-0.5"
          style={{ backgroundColor: wish.done ? colors.gray100 : colors.primaryMuted }}>
          <Text className="text-2xl">{emoji}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-[14px] font-semibold flex-1"
              style={{
                color: colors.textDark,
                textDecorationLine: wish.done ? 'line-through' : 'none',
              }}>
              {wish.title}
            </Text>
            {wish.done ? (
              <CheckCircle size={16} color={colors.accent} strokeWidth={1.5} />
            ) : null}
          </View>
          {wish.description ? (
            <Text className="text-[12px] text-textLight mt-0.5" numberOfLines={2}>
              {wish.description}
            </Text>
          ) : null}
          {wish.tags?.length > 0 ? (
            <View className="flex-row flex-wrap gap-1 mt-1.5">
              {wish.tags.slice(0, 3).map(tag => (
                <View key={tag} className="rounded-full px-2 py-0.5 bg-gray-100">
                  <Text className="text-[11px] text-textMid">{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Actions — horizontal row */}
        <View className="flex-row gap-1.5 ml-1">
          {!wish.done ? (
            <Pressable
              onPress={onMarkDone}
              className="w-8 h-8 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.accentMuted }}>
              <Check size={15} color={colors.accent} strokeWidth={1.5} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onEdit}
            className="w-8 h-8 rounded-xl items-center justify-center bg-gray-100">
            <Pencil size={15} color={colors.textMid} strokeWidth={1.5} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            className="w-8 h-8 rounded-xl items-center justify-center bg-gray-100">
            <Trash2 size={15} color={colors.textLight} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
