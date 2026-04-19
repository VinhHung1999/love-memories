import { Heart, Users, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, LinearGradient, ScreenHeader } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { usePairCreateViewModel } from './usePairCreateViewModel';

type PairAccent = 'primary' | 'accent';

// T289 (Sprint 60 polish) — single screen, three rendered states driven by the
// VM's `stage` discriminator:
//   loading → mount-time GET /api/invite/me probe in flight (spinner)
//   choose  → no invite yet, show Create / Join cards (Skip pill removed per
//             bug #7 — Boss didn't want it visible at all even when disabled)
//   invite  → invite ready, show code + QR + Share + Continue + Regenerate

export function PairCreateScreen() {
  const vm = usePairCreateViewModel();

  return (
    <View className="flex-1 bg-bg">
      <TopWash />

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        {vm.stage === 'loading' ? <LoadingState /> : null}
        {vm.stage === 'choose' ? (
          <ChooseState
            creating={vm.creating}
            error={vm.error}
            onCreate={vm.onCreate}
            onJoin={vm.onJoin}
          />
        ) : null}
        {vm.stage === 'invite' ? (
          <InviteState
            code={vm.code}
            formattedCode={vm.formattedCode}
            qrPayload={vm.qrPayload}
            regenerating={vm.regenerating}
            error={vm.error}
            onShare={vm.onShare}
            onContinue={vm.onContinue}
            onRegenerate={vm.onRegenerate}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}

function TopWash() {
  const c = useAppColors();
  return (
    <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[260px]">
      <LinearGradient
        colors={[c.primarySoft, c.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        className="absolute inset-0"
      />
    </View>
  );
}

function LoadingState() {
  return (
    <View className="flex-1">
      {/* T294 (bug #8): no back arrow on the pair flow at all. Once the user
          lands here, going back orphans the invite probe / stale form state.
          See _layout.tsx — gestureEnabled is also disabled on this route. */}
      <ScreenHeader />
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    </View>
  );
}

type ChooseProps = {
  creating: boolean;
  error: { kind: 'network' } | null;
  onCreate: () => void;
  onJoin: () => void;
};

function ChooseState({ creating, error, onCreate, onJoin }: ChooseProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-1">
      {/* T294 (bug #8): no back — see LoadingState for rationale. */}
      <ScreenHeader
        title={t('onboarding.pairing.choice.title')}
        subtitle={t('onboarding.pairing.choice.subtitle')}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PairedHearts />

        <View className="px-5 pt-4 pb-10">
        <PairOption
          accent="primary"
          Icon={Heart}
          title={t('onboarding.pairing.choice.create.title')}
          subtitle={t('onboarding.pairing.choice.create.subtitle')}
          loading={creating}
          onPress={onCreate}
        />
        <PairOption
          accent="accent"
          Icon={Users}
          title={t('onboarding.pairing.choice.join.title')}
          subtitle={t('onboarding.pairing.choice.join.subtitle')}
          disabled={creating}
          onPress={onJoin}
        />

        {error ? (
          <Text className="mt-4 font-body text-primary-deep text-[13px] text-center">
            {t('onboarding.pairing.errors.network')}
          </Text>
        ) : null}

          <View className="mt-7 flex-row items-center gap-2.5 rounded-2xl border border-line border-dashed bg-surface-alt px-4 py-3.5">
            <Text className="text-lg">🔒</Text>
            <Text className="flex-1 font-body text-ink-soft text-[12.5px] leading-[18px]">
              {t('onboarding.pairing.choice.lockNote')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

type InviteProps = {
  code: string | null;
  formattedCode: string;
  qrPayload: string | null;
  regenerating: boolean;
  error: { kind: 'network' } | null;
  onShare: () => void;
  onContinue: () => void;
  onRegenerate: () => void;
};

function InviteState({
  code,
  formattedCode,
  qrPayload,
  regenerating,
  error,
  onShare,
  onContinue,
  onRegenerate,
}: InviteProps) {
  const { t } = useTranslation();
  const c = useAppColors();
  const ready = !!code;

  return (
    <View className="flex-1">
      {/* T292 (bug #2): no back arrow once invite is issued. Boss rule: once
          on the Your Code screen the user has committed; backing out and
          re-entering would just spawn another invite probe. The gate restores
          this state automatically via /api/invite/me on next entry, so kill+
          reopen still lands here without losing the code. */}
      <ScreenHeader
        title={t('onboarding.pairing.invite.title')}
        subtitle={t('onboarding.pairing.invite.subtitle')}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-5 pt-3 pb-10">
        <Card variant="elevated" className="px-5 py-8 items-center">
          <Text className="font-displayItalic uppercase text-primary-deep text-[11px] tracking-[2px] mb-3">
            {t('onboarding.pairing.invite.codeLabel')}
          </Text>
          {ready ? (
            <Text className="font-displayBold text-ink text-[40px] leading-[44px] tracking-[3px]">
              {formattedCode}
            </Text>
          ) : (
            <View className="h-[44px] justify-center">
              <ActivityIndicator />
            </View>
          )}

          <View className="mt-6 rounded-2xl bg-bg p-3">
            {qrPayload ? (
              <QRCode
                value={qrPayload}
                size={192}
                color={c.ink}
                backgroundColor={c.bg}
                quietZone={8}
                ecl="M"
              />
            ) : (
              <View className="w-[208px] h-[208px] items-center justify-center">
                <ActivityIndicator />
              </View>
            )}
          </View>
        </Card>

        <View className="mt-5">
          <Pressable
            onPress={ready ? onShare : undefined}
            accessibilityRole="button"
            disabled={!ready}
            className={`w-full flex-row items-center justify-center rounded-full py-4 px-5 ${
              ready ? 'bg-surface border border-line shadow-chip active:opacity-90' : 'bg-surface'
            }`}
          >
            <Text className={`font-bodyBold text-[15px] ${ready ? 'text-ink' : 'text-ink-mute'}`}>
              {t('onboarding.pairing.invite.shareCta')}
            </Text>
          </Pressable>
        </View>

        <View className="mt-3">
          <Pressable
            onPress={ready ? onContinue : undefined}
            accessibilityRole="button"
            disabled={!ready}
            className={`w-full flex-row items-center justify-center rounded-full py-4 px-5 ${
              ready ? 'bg-ink shadow-hero active:opacity-90' : 'bg-surface'
            }`}
          >
            <Text className={`font-bodyBold text-[15px] ${ready ? 'text-bg' : 'text-ink-mute'}`}>
              {t('onboarding.pairing.invite.continueCta')}
            </Text>
            {ready ? <Text className="ml-2 font-bodyBold text-bg text-[15px]">→</Text> : null}
          </Pressable>
        </View>

        <View className="mt-4 items-center">
          <Pressable
            onPress={ready && !regenerating ? onRegenerate : undefined}
            accessibilityRole="button"
            disabled={!ready || regenerating}
            hitSlop={8}
            className="py-2"
          >
            <Text className="font-bodyMedium text-primary-deep text-[13px] underline">
              {regenerating
                ? t('onboarding.pairing.invite.regenerating')
                : t('onboarding.pairing.invite.regenerate.cta')}
            </Text>
          </Pressable>
        </View>

          {error ? (
            <Text className="mt-3 font-body text-primary-deep text-[13px] text-center">
              {t('onboarding.pairing.errors.network')}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

// L + ? circles overlapping with a 💞 between — quick port of pairing.jsx:31.
function PairedHearts() {
  return (
    <View className="px-6 pt-6">
      <View className="self-center w-[180px] h-[130px] relative">
        <View className="absolute left-2.5 top-5 w-20 h-20 rounded-full bg-primary border-[3px] border-bg shadow-hero items-center justify-center">
          <Text className="font-displayBold text-white text-[32px]">L</Text>
        </View>
        <View className="absolute right-2.5 top-[30px] w-20 h-20 rounded-full bg-accent border-[3px] border-bg shadow-hero items-center justify-center">
          <Text className="font-displayBold text-white text-[32px]">?</Text>
        </View>
        <Text className="absolute left-1/2 top-[55px] -translate-x-1/2 text-2xl">💞</Text>
      </View>
    </View>
  );
}

type OptionProps = {
  accent: PairAccent;
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const ICON_BG: Record<PairAccent, string> = {
  primary: 'bg-primary/15',
  accent: 'bg-accent/15',
};

// T291 (bug #6): emoji glyphs swapped for lucide-react-native vector icons.
// Per-accent stroke colour resolved off the live theme palette so dark mode
// still renders crisp 1.8-stroke icons instead of muddy emoji.
function PairOption({ accent, Icon, title, subtitle, loading, disabled, onPress }: OptionProps) {
  const c = useAppColors();
  const stroke = accent === 'primary' ? c.primary : c.accent;
  const dim = !!disabled || !!loading;
  return (
    <Card
      variant="option"
      onPress={dim ? undefined : onPress}
      accessibilityState={{ disabled: dim, busy: loading }}
      className={`flex-row items-center gap-3.5 px-4 py-[18px] mb-2.5 ${dim ? 'opacity-60' : ''}`}
    >
      <View className={`w-12 h-12 rounded-2xl items-center justify-center ${ICON_BG[accent]}`}>
        <Icon size={24} strokeWidth={1.8} color={stroke} />
      </View>
      <View className="flex-1 min-w-0">
        {/* T294 (bug #1): leading-[21px] (1.17×) clipped dấu mũ on "Tạo lời
            mời" / "Có mã rồi"; bumped to 24px (1.33×). */}
        <Text className="font-displayMedium text-ink text-[18px] leading-[24px]">{title}</Text>
        <Text className="mt-1 font-body text-ink-mute text-[12.5px] leading-[18px]">
          {subtitle}
        </Text>
      </View>
      <Text className="font-bodyMedium text-ink-mute text-lg">→</Text>
    </Card>
  );
}
