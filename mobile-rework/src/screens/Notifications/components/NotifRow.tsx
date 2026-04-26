import {
  Bell,
  Camera,
  Flame,
  Heart,
  HelpCircle,
  Mail,
  MessageCircle,
  Sparkles,
  UserPlus,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

import type { NotifKind, NotificationView } from '../useNotificationsViewModel';

// T425 (Sprint 65) — single notification row. Prototype
// `notifications.jsx` L289-381. Two visual flavours:
//
//   • Has avatar (the BE row carries an actor-style notification) → 42×42
//     gradient avatar with the actor's initial + small kind icon overlay
//     bottom-right. Used for moment / letter / reaction / comment / place.
//   • No avatar (system event) → 42×42 soft-tinted icon circle.
//
// Currently the BE row shape doesn't carry an actor (Notification table
// in prisma is { type, title, message, link }), so this component
// falls back to the system-event variant for every kind unless the
// caller wires actor info later. The avatar branch is kept ready for
// when the BE adds it.

type IconForKind = (
  kind: NotifKind,
) => { Icon: typeof Bell; tone: 'primary' | 'secondary' | 'accent' };

const PICK: IconForKind = (kind) => {
  switch (kind) {
    case 'letter':
      return { Icon: Mail, tone: 'secondary' };
    case 'moment':
      return { Icon: Camera, tone: 'primary' };
    case 'reaction':
      return { Icon: Heart, tone: 'primary' };
    case 'comment':
      return { Icon: MessageCircle, tone: 'secondary' };
    case 'recap':
      return { Icon: Sparkles, tone: 'accent' };
    case 'daily':
      return { Icon: HelpCircle, tone: 'accent' };
    // T438 (Sprint 66) — Daily Q&A reminder + partner-answered share the
    // HelpCircle ? glyph; tone keeps the calm accent surface so it sits
    // naturally beside the existing 'daily' plan-reminder row.
    case 'qna':
      return { Icon: HelpCircle, tone: 'accent' };
    case 'streak':
      return { Icon: Flame, tone: 'secondary' };
    case 'invite':
      return { Icon: UserPlus, tone: 'primary' };
    case 'place':
      return { Icon: Sparkles, tone: 'accent' };
    case 'anniv':
      return { Icon: Heart, tone: 'primary' };
    case 'fallback':
    default:
      return { Icon: Bell, tone: 'accent' };
  }
};

type Props = {
  notification: NotificationView;
  agoLabel: string;
  onPress: () => void;
};

export function NotifRow({ notification, agoLabel, onPress }: Props) {
  const c = useAppColors();
  const { Icon, tone } = PICK(notification.kind);
  const accentColor =
    tone === 'primary'
      ? c.primary
      : tone === 'secondary'
        ? c.secondary
        : c.accent;
  const softColor =
    tone === 'primary'
      ? c.primarySoft
      : tone === 'secondary'
        ? c.secondarySoft
        : c.accentSoft;

  return (
    // D72b (Sprint 65 Build 95 hot-fix): added `mb-1.5` between rows so
    // unread cards don't dính dính nhau visually. D72c — bumped unread
    // background to a soft `shadow-card` lift so the card pops against
    // the bg without needing a heavier shadow on every row.
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-start gap-3 mx-5 px-3.5 py-3 rounded-2xl mb-1.5 active:opacity-90"
      style={{
        backgroundColor: notification.read ? 'transparent' : c.surface,
        borderWidth: 1,
        borderColor: notification.read ? 'transparent' : c.lineOnSurface,
      }}
    >
      <View
        className="w-[42px] h-[42px] rounded-full items-center justify-center"
        style={{ backgroundColor: softColor }}
      >
        <Icon size={18} strokeWidth={2.1} color={accentColor} />
      </View>

      <View className="flex-1 min-w-0">
        <Text
          className="font-bodySemibold text-ink text-[13px] leading-[18px]"
          numberOfLines={2}
        >
          {notification.title}
        </Text>
        {notification.message ? (
          <Text
            className="mt-0.5 font-body text-ink-mute text-[12px] leading-[17px]"
            numberOfLines={2}
          >
            {notification.message}
          </Text>
        ) : null}
        <Text
          className="mt-1.5 font-bodyBold text-ink-mute text-[10px] tracking-[1px] uppercase"
        >
          {agoLabel}
        </Text>
      </View>

      {!notification.read ? (
        // D72c — unread dot now sits inside a soft primary-soft halo so
        // it reads as a "fresh" pip rather than a stray bullet point.
        <View
          className="w-3 h-3 rounded-full mt-3 items-center justify-center"
          style={{ backgroundColor: c.primarySoft }}
        >
          <View
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: c.primary }}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

// LinearGradient initials avatar variant — kept as exported helper for
// when the BE row gains an `actor` field. Not used today.
export function NotifAvatar({
  initial,
  kind,
}: {
  initial: string;
  kind: NotifKind;
}) {
  const c = useAppColors();
  const { Icon } = PICK(kind);
  return (
    <View className="w-[42px] h-[42px] rounded-full items-center justify-center">
      <LinearGradient
        colors={[c.heroA, c.heroB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-full h-full rounded-full items-center justify-center"
      >
        <Text className="font-displayMedium text-white text-[16px]">
          {initial}
        </Text>
      </LinearGradient>
      <View
        className="absolute -right-0.5 -bottom-0.5 w-5 h-5 rounded-full items-center justify-center"
        style={{
          backgroundColor: c.primary,
          borderWidth: 2,
          borderColor: c.bg,
        }}
      >
        <Icon size={10} strokeWidth={2.2} color="#ffffff" />
      </View>
    </View>
  );
}
