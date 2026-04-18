import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, SafeScreen } from '@/components';
import { env } from '@/config/env';
import { setAppLang } from '@/locales/i18n';
import { useThemeControls } from '@/theme/ThemeProvider';
import {
  DensityId,
  Mode,
  PaletteId,
  TypeSystemId,
} from '@/theme/tokens';

type HealthState = 'idle' | 'loading' | 'ok' | 'err';

export default function Sprint59Demo() {
  const { t, i18n } = useTranslation();
  const controls = useThemeControls();
  const [health, setHealth] = useState<HealthState>('idle');
  const [healthMsg, setHealthMsg] = useState('');

  async function pingHealth() {
    setHealth('loading');
    setHealthMsg('');
    try {
      const res = await fetch(`${env.apiUrl}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setHealth('ok');
      setHealthMsg(text.slice(0, 120));
    } catch (e) {
      setHealth('err');
      setHealthMsg(String(e));
    }
  }

  const PALETTES: PaletteId[] = ['brand', 'evolve'];
  const MODES: ('system' | Mode)[] = ['system', 'light', 'dark'];
  const TYPES: TypeSystemId[] = ['sans', 'serif', 'script'];
  const DENSITIES: DensityId[] = ['airy', 'compact'];

  return (
    <SafeScreen>
      <ScrollView className="flex-1">
        <View className="px-5 py-6">
          <Text className="font-displayMedium text-3xl text-ink">Sprint 59 — Smoke</Text>
          <Text className="font-body text-sm text-ink-soft mt-1">
            {env.isDev ? 'dev' : 'prod'} · {env.apiUrl}
          </Text>
        </View>

        {/* Font showcase in Vietnamese — 3 families */}
        <View className="px-5">
          <Card>
            <Text className="font-bodyMedium text-xs text-ink-mute uppercase mb-3">Typography</Text>
            <Text className="font-displayMedium text-2xl text-ink mb-2">
              Fraunces — Mưa chiều Đà Lạt
            </Text>
            <Text className="font-body text-base text-ink mb-2">
              Be Vietnam Pro — Khoảnh khắc bé nhỏ của hai đứa.
            </Text>
            <Text className="font-scriptBold text-3xl text-primary-deep">
              Dancing Script — Gửi em
            </Text>
          </Card>
        </View>

        {/* Theme toggles */}
        <View className="px-5 mt-5">
          <Text className="font-bodySemibold text-ink text-base mb-3">
            {t('profile.palette')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PALETTES.map((p) => (
              <Button
                key={p}
                label={t(`settings.palette.${p}`)}
                variant={controls.palette === p ? 'primary' : 'outline'}
                size="sm"
                onPress={() => controls.setPalette(p)}
              />
            ))}
          </View>
        </View>

        <View className="px-5 mt-5">
          <Text className="font-bodySemibold text-ink text-base mb-3">{t('profile.mode')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {MODES.map((m) => (
              <Button
                key={m}
                label={t(`settings.mode.${m}`)}
                variant={controls.mode === m ? 'primary' : 'outline'}
                size="sm"
                onPress={() => controls.setMode(m)}
              />
            ))}
          </View>
        </View>

        <View className="px-5 mt-5">
          <Text className="font-bodySemibold text-ink text-base mb-3">
            {t('profile.typeSystem')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {TYPES.map((ty) => (
              <Button
                key={ty}
                label={t(`settings.type.${ty}`)}
                variant={controls.type === ty ? 'primary' : 'outline'}
                size="sm"
                onPress={() => controls.setType(ty)}
              />
            ))}
          </View>
        </View>

        <View className="px-5 mt-5">
          <Text className="font-bodySemibold text-ink text-base mb-3">{t('profile.density')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {DENSITIES.map((d) => (
              <Button
                key={d}
                label={t(`settings.density.${d}`)}
                variant={controls.density === d ? 'primary' : 'outline'}
                size="sm"
                onPress={() => controls.setDensity(d)}
              />
            ))}
          </View>
        </View>

        <View className="px-5 mt-5">
          <Text className="font-bodySemibold text-ink text-base mb-3">
            {t('profile.language')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(['vi', 'en'] as const).map((lng) => (
              <Button
                key={lng}
                label={t(`settings.language.${lng}`)}
                variant={i18n.language === lng ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setAppLang(lng)}
              />
            ))}
          </View>
        </View>

        {/* API health ping */}
        <View className="px-5 mt-6 mb-10">
          <Card>
            <Text className="font-bodySemibold text-ink text-base mb-3">API health</Text>
            <Button
              label={health === 'loading' ? '…' : 'Ping /api/health'}
              loading={health === 'loading'}
              onPress={pingHealth}
              fullWidth
            />
            {health === 'ok' ? (
              <Text className="font-body text-sm text-accent mt-3">OK · {healthMsg}</Text>
            ) : null}
            {health === 'err' ? (
              <Text className="font-body text-sm text-primary-deep mt-3">
                {healthMsg}
              </Text>
            ) : null}
          </Card>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
