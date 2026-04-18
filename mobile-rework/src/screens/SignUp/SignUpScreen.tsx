import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBigBtn, AuthField, DividerWith, LinearGradient, ScreenBackBtn } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { PASSWORD_MIN, useSignUpViewModel } from './useSignUpViewModel';

// Ports `SignUpScreen` from docs/design/prototype/memoura-v2/auth.jsx:95.
// Soft top wash (primarySoft → bg). Header + accent line + form + terms + CTA
// + DividerWith + disabled SocialRow stub + switch-to-login link.

export function SignUpScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const {
    name,
    email,
    password,
    showPassword,
    errors,
    canSubmit,
    setName,
    setEmail,
    setPassword,
    onToggleShow,
    onSubmit,
    onSwitchLogin,
  } = useSignUpViewModel();

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[220px]">
        <LinearGradient
          colors={[c.primarySoft, c.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="px-2 pt-2">
            <ScreenBackBtn />
          </View>

          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-5 pt-3">
              <Text className="font-displayMediumItalic text-ink text-[28px] leading-[32px]">
                {t('onboarding.auth.signup.title')}
              </Text>
              <Text className="mt-1.5 font-body text-ink-mute text-[13px]">
                {t('onboarding.auth.signup.subtitle')}
              </Text>
            </View>

            <View className="px-5 pt-7 pb-10">
              <Text className="font-displayItalic uppercase text-primary-deep text-[12px] tracking-[2px] mb-5">
                {t('onboarding.auth.signup.accent')}
              </Text>

              <AuthField
                label={t('onboarding.auth.signup.nameLabel')}
                placeholder={t('onboarding.auth.signup.namePlaceholder')}
                value={name}
                onChangeText={setName}
                icon="✶"
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                error={errors.name ? t('onboarding.auth.errors.nameRequired') : undefined}
              />

              <AuthField
                label={t('onboarding.auth.signup.emailLabel')}
                placeholder={t('onboarding.auth.signup.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                icon="✉"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                error={errors.email ? t('onboarding.auth.errors.emailInvalid') : undefined}
              />

              <AuthField
                label={t('onboarding.auth.signup.passwordLabel')}
                placeholder={t('onboarding.auth.signup.passwordPlaceholder', { min: PASSWORD_MIN })}
                value={password}
                onChangeText={setPassword}
                icon="⌂"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                error={
                  errors.password
                    ? t('onboarding.auth.errors.passwordTooShort', { min: PASSWORD_MIN })
                    : undefined
                }
                trailing={
                  <Pressable
                    onPress={onToggleShow}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Text className="font-bodySemibold text-ink-soft text-xs">
                      {showPassword
                        ? t('onboarding.auth.signup.hide')
                        : t('onboarding.auth.signup.show')}
                    </Text>
                  </Pressable>
                }
              />

              <Text className="mt-1.5 font-body text-ink-mute text-xs leading-[18px]">
                {t('onboarding.auth.signup.terms')}
              </Text>

              <View className="mt-6">
                <AuthBigBtn
                  label={t('onboarding.auth.signup.cta')}
                  disabled={!canSubmit}
                  onPress={onSubmit}
                />
              </View>

              <DividerWith label={t('onboarding.auth.or')} />

              <SocialRowStub />

              <View className="mt-7 flex-row justify-center items-center">
                <Text className="font-body text-ink-soft text-[13px]">
                  {t('onboarding.auth.signup.switchPrompt')}
                </Text>
                <Pressable onPress={onSwitchLogin} accessibilityRole="link" hitSlop={6}>
                  <Text className="font-bodyBold text-primary-deep text-[13px] underline">
                    {t('onboarding.auth.signup.switchAction')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Stubbed disabled row — real OAuth wiring lands in T283.
function SocialRowStub() {
  const { t } = useTranslation();
  const items: readonly { key: string; icon: string; label: string; classes: string; textClass: string }[] = [
    {
      key: 'apple',
      icon: '',
      label: t('onboarding.auth.signup.socialApple'),
      classes: 'bg-ink',
      textClass: 'text-bg',
    },
    {
      key: 'google',
      icon: 'G',
      label: t('onboarding.auth.signup.socialGoogle'),
      classes: 'bg-bg-elev border border-line',
      textClass: 'text-ink',
    },
    {
      key: 'phone',
      icon: '☎',
      label: t('onboarding.auth.signup.socialPhone'),
      classes: 'bg-surface border border-line',
      textClass: 'text-ink',
    },
  ];
  return (
    <View className="flex-row gap-2 opacity-50">
      {items.map((it) => (
        <View
          key={it.key}
          className={`flex-1 flex-row items-center justify-center py-3.5 rounded-2xl ${it.classes}`}
        >
          {it.icon ? (
            <Text className={`font-bodyBold text-[15px] mr-2 ${it.textClass}`}>{it.icon}</Text>
          ) : null}
          <Text className={`font-bodyBold text-sm ${it.textClass}`}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}
