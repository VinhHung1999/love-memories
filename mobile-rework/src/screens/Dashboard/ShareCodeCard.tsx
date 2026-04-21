import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Card } from '@/components';
import { env } from '@/config/env';
import { ApiError, apiClient } from '@/lib/apiClient';
import { formatInviteCode, toInvitePayload } from '@/lib/formatInviteCode';
import { useAuthStore } from '@/stores/authStore';
import { useAppColors } from '@/theme/ThemeProvider';

// T307 (Sprint 60 Bundle 4) — home-tab widget for a user who has created a
// couple but hasn't paired yet. Renders only when coupleId is set AND partner
// is still null; once the partner joins (poll on /api/couple every 3s) the
// card unmounts itself. Buttons:
//   Chia sẻ     → react-native Share.share (OS share sheet)
//   Sao chép    → expo-clipboard, ephemeral "Đã sao chép ✓" state
//   Tạo mã mới  → POST /api/couple/generate-invite with an Alert confirm,
//                 mirrors the Sprint-60 PairCreate flow.
//
// Invite policy (Boss 2026-04-19): 1 active invite per couple — regenerating
// invalidates the prior code. BE enforcement is B41 backlog; the widget just
// trusts whatever code /api/couple/generate-invite returns.

type InviteMeResponse = {
  inviteCode: string;
  createdAt: string;
  couple: { id: string; name: string | null };
};

type CoupleResponse = {
  partner: { name: string | null; avatar: string | null } | null;
  memberCount: number;
};

type RegenerateResponse = { inviteCode: string };

const POLL_INTERVAL_MS = 3000;
const COPIED_RESET_MS = 1600;

export function ShareCodeCard() {
  const user = useAuthStore((s) => s.user);
  const coupleId = user?.coupleId ?? null;
  const { t } = useTranslation();
  const c = useAppColors();

  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [partnerJoined, setPartnerJoined] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial code fetch. /api/invite/me throws 409 ALREADY_PAIRED if the
  // partner joined between signup and this screen — collapse that into the
  // same partnerJoined=true state so we hide the card.
  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<InviteMeResponse>('/api/invite/me');
        if (!cancelled) setCode(res.inviteCode);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 409) {
          setPartnerJoined(true);
        }
        // Network / other failure — leave code=null; the !loading && !ready
        // branch below surfaces the retry hint to the user.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coupleId]);

  // Partner-flip poll. Only runs while we still think we're unpaired — the
  // moment /api/couple surfaces a partner we stop polling + unmount the card
  // on the next render.
  useEffect(() => {
    if (!coupleId || partnerJoined) return;
    const id = setInterval(async () => {
      try {
        const res = await apiClient.get<CoupleResponse>('/api/couple');
        if (res.partner) setPartnerJoined(true);
      } catch {
        // Silent — next tick retries. Transient network is expected here.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [coupleId, partnerJoined]);

  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    },
    [],
  );

  const qrPayload = code ? `${env.appBaseUrl}/join/${toInvitePayload(code)}` : null;

  const onShare = useCallback(async () => {
    if (!code) return;
    const payload = toInvitePayload(code);
    const message = t('home.shareCode.shareMessage', {
      code: payload,
      url: `${env.appBaseUrl}/join/${payload}`,
    });
    try {
      await Share.share({ message });
    } catch {
      // user cancel or system fail — swallow
    }
  }, [code, t]);

  const onCopy = useCallback(async () => {
    if (!code) return;
    await Clipboard.setStringAsync(toInvitePayload(code));
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, [code]);

  const doRegenerate = useCallback(async () => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      const res = await apiClient.post<RegenerateResponse>('/api/couple/generate-invite');
      setCode(res.inviteCode);
    } catch {
      // Silent — old code still renders. User can retry.
    } finally {
      setRegenerating(false);
    }
  }, [regenerating]);

  const onRegenerate = useCallback(() => {
    if (regenerating || !code) return;
    Alert.alert(
      t('home.shareCode.regenerateTitle'),
      t('home.shareCode.regenerateBody'),
      [
        { text: t('home.shareCode.regenerateCancel'), style: 'cancel' },
        {
          text: t('home.shareCode.regenerateConfirm'),
          style: 'destructive',
          onPress: () => {
            void doRegenerate();
          },
        },
      ],
    );
  }, [regenerating, code, t, doRegenerate]);

  // Hidden states: no couple yet (shouldn't happen on dashboard, defensive),
  // partner already joined (post-pair), or irrecoverable 409 from the probe.
  if (!coupleId || partnerJoined) return null;

  const ready = !!code;

  return (
    <Card variant="elevated" className="px-5 py-7 mx-5 mt-4">
      <Text className="font-displayBold text-ink text-[20px] leading-[26px] text-center">
        {t('home.shareCode.title')}
      </Text>
      <Text className="mt-2 font-body text-ink-mute text-[13px] leading-[19px] text-center">
        {t('home.shareCode.subtitle')}
      </Text>

      <View className="mt-5 items-center">
        <Text className="font-displayItalic uppercase text-primary-deep text-[11px] tracking-[2px] mb-2">
          {t('home.shareCode.codeLabel')}
        </Text>
        {loading ? (
          <View className="h-[44px] justify-center">
            <ActivityIndicator />
          </View>
        ) : ready ? (
          <Text className="font-displayBold text-ink text-[36px] leading-[42px] tracking-[3px]">
            {formatInviteCode(code)}
          </Text>
        ) : (
          <Text className="font-body text-primary-deep text-[13px]">
            {t('home.shareCode.error')}
          </Text>
        )}

        <View className="mt-5 rounded-2xl bg-bg p-3">
          {qrPayload ? (
            <QRCode
              value={qrPayload}
              size={160}
              color={c.ink}
              backgroundColor={c.bg}
              quietZone={6}
              ecl="M"
            />
          ) : (
            <View className="w-[172px] h-[172px] items-center justify-center">
              <ActivityIndicator />
            </View>
          )}
        </View>
      </View>

      <View className="mt-5 flex-row gap-2">
        <Pressable
          onPress={ready ? onShare : undefined}
          accessibilityRole="button"
          disabled={!ready}
          className="flex-1 flex-row items-center justify-center rounded-full py-3 active:opacity-90"
          style={{ backgroundColor: ready ? c.ink : c.surfaceAlt }}
        >
          <Text
            className="font-bodyBold text-[14px]"
            style={{ color: ready ? c.bg : c.inkMute }}
          >
            {t('home.shareCode.shareCta')}
          </Text>
        </Pressable>
        <Pressable
          onPress={ready ? onCopy : undefined}
          accessibilityRole="button"
          disabled={!ready}
          className="flex-1 flex-row items-center justify-center rounded-full py-3 border bg-surface border-line-on-surface active:opacity-90"
        >
          <Text
            className="font-bodyBold text-[14px]"
            style={{ color: ready ? c.ink : c.inkMute }}
          >
            {copied ? t('home.shareCode.copied') : t('home.shareCode.copyCta')}
          </Text>
        </Pressable>
      </View>

      <View className="mt-3 items-center">
        <Pressable
          onPress={ready && !regenerating ? onRegenerate : undefined}
          accessibilityRole="button"
          disabled={!ready || regenerating}
          hitSlop={8}
          className="py-2"
        >
          <Text className="font-bodyMedium text-primary-deep text-[13px] underline">
            {regenerating
              ? t('home.shareCode.regenerating')
              : t('home.shareCode.regenerateCta')}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
