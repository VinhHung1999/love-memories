/**
 * NoPartnerBanner — eye-catching rose gradient card shown on Dashboard when
 * the user has no partner yet (couple.memberCount === 1).
 * Shows invite code + share button. Auto-hides once partner joins.
 */
import React, { useState } from 'react';
import { Clipboard, Pressable, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Copy, Send, UserPlus } from 'lucide-react-native';
import { Body, Caption, Heading } from './Typography';
import SpringPressable from './SpringPressable';
import t from '../locales/en';

interface Props {
  inviteCode: string | null;
  onShare: () => Promise<void>;
}

export default function NoPartnerBanner({ inviteCode, onShare }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!inviteCode) return;
    Clipboard.setString(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Animated.View entering={FadeInDown.delay(80).duration(450)}>
      <View
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          shadowColor: '#E8788A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.22,
          shadowRadius: 16,
          elevation: 8,
        }}>
        <LinearGradient
          colors={['#E8788A', '#F4929E', '#F9B4B4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          >
            <View style={{ padding: 20 }}>
            {/* Header row */}
            <View className="flex-row items-center gap-3 mb-3">
              <View
                className="w-10 h-10 rounded-2xl items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                <UserPlus size={20} color="#fff" strokeWidth={1.8} />
              </View>
              <View className="flex-1">
                <Heading size="sm" style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                  {t.dashboard.noPartnerBanner.headline}
                </Heading>
                <Caption style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 16, marginTop: 2 }} numberOfLines={2}>
                  {t.dashboard.noPartnerBanner.subline}
                </Caption>
              </View>
            </View>

            {/* Code row */}
            <View
              className="flex-row items-center rounded-2xl overflow-hidden mb-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
              <View className="flex-1 px-4 py-3">
                <Caption style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 }}>
                  {t.dashboard.noPartnerBanner.codeLabel}
                </Caption>
                <Body
                  size="lg"
                  style={{ color: '#fff', fontWeight: '700', letterSpacing: 5, fontSize: 20, fontVariant: ['tabular-nums'] }}>
                  {inviteCode ?? t.dashboard.noPartnerBanner.generatingCode}
                </Body>
              </View>
              <Pressable
                onPress={handleCopy}
                disabled={!inviteCode}
                className="px-4 py-3 items-center justify-center gap-1"
                style={{ borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' }}>
                <Copy size={16} color={copied ? '#fff' : 'rgba(255,255,255,0.75)'} strokeWidth={2} />
                <Caption style={{ color: copied ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 9 }}>
                  {copied ? t.onboarding.invite.copied : t.onboarding.invite.copyHint}
                </Caption>
              </Pressable>
            </View>

            {/* Share button */}
            <SpringPressable
              onPress={onShare}
              disabled={!inviteCode}
              className="flex-row items-center justify-center gap-2 rounded-2xl py-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
              <Send size={15} color="#fff" strokeWidth={1.8} />
              <Body size="sm" style={{ color: '#fff', fontWeight: '600', letterSpacing: 0.3 }}>
                {t.dashboard.noPartnerBanner.shareBtn}
              </Body>
            </SpringPressable>
          </View>

        </LinearGradient>
      </View>
    </Animated.View>
  );
}
