import React from 'react';
import { Pressable, View } from 'react-native';
import { Body, Caption } from '../../../components/Typography';
import { useAppColors } from '../../../navigation/theme';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react-native';

interface UnreadLetterCardProps {
  count: number;
  onPress: () => void;
}

export function UnreadLetterCard({ count, onPress }: UnreadLetterCardProps) {
  const colors = useAppColors();
  const { t } = useTranslation();

  if (count <= 0) return null;

  const message =
    count === 1
      ? t('dashboard.unreadLetters.one')
      : t('dashboard.unreadLetters.many', { n: count });

  return (
    <Pressable onPress={onPress}>
      <View
        className="rounded-2xl px-4 py-4 flex-row items-center gap-3"
        style={{
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: 'rgba(232,120,138,0.25)',
        }}
      >
        {/* Icon with badge */}
        <View className="relative">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(232,120,138,0.12)' }}
          >
            <Mail size={18} color={colors.primary} strokeWidth={1.5} />
          </View>
          {/* Unread count badge */}
          <View
            className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary, minWidth: 18, minHeight: 18 }}
          >
            <Caption className="text-white font-bold" style={{ fontSize: 10 }}>
              {count > 9 ? '9+' : String(count)}
            </Caption>
          </View>
        </View>

        {/* Text */}
        <View className="flex-1">
          <Body size="md" className="font-semibold text-textDark dark:text-darkTextDark">
            {message}
          </Body>
        </View>

        {/* CTA */}
        <Caption className="text-primary font-semibold">
          {t('dashboard.unreadLetters.readNow')}
        </Caption>
      </View>
    </Pressable>
  );
}
