import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBigBtn, AuthField, DividerWith, LinearGradient, ScreenHeader, SocialRow } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { useLoginViewModel } from './useLoginViewModel';

// Ports `LogInScreen` from docs/design/prototype/memoura-v2/auth.jsx:191.
// Soft top wash (accentSoft → bg). Avatar pair visual + form + forgot link
// + CTA + DividerWith + disabled SocialRow + switch-to-signup link.

export function LoginScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const {
    email,
    password,
    showPassword,
    errors,
    formError,
    submitting,
    socialLoading,
    canSubmit,
    setEmail,
    setPassword,
    onToggleShow,
    onSubmit,
    onSwitchSignup,
    onForgot,
    onSocial,
  } = useLoginViewModel();

  const formErrorText = formError
    ? formError.kind === 'invalidCredentials'
      ? t('onboarding.auth.errors.invalidCredentials')
      : formError.kind === 'rateLimited'
        ? t('onboarding.auth.errors.rateLimited')
        : formError.kind === 'socialFailed'
          ? t('onboarding.auth.errors.socialFailed')
          : t('onboarding.auth.errors.network')
    : null;

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[220px]">
        <LinearGradient
          colors={[c.accentSoft, c.bg]}
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
          {/* T290 (bug #14): no back button — login is an entry point. */}
          <ScreenHeader
            title={t('onboarding.auth.login.title')}
            subtitle={t('onboarding.auth.login.subtitle')}
          />

          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-5 pt-3 pb-10">
              <AvatarPair />

              <AuthField
                label={t('onboarding.auth.login.emailLabel')}
                placeholder={t('onboarding.auth.login.emailPlaceholder')}
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
                label={t('onboarding.auth.login.passwordLabel')}
                placeholder={t('onboarding.auth.login.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                icon="⌂"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                error={
                  errors.password ? t('onboarding.auth.errors.passwordRequired') : undefined
                }
                trailing={
                  <Pressable onPress={onToggleShow} accessibilityRole="button" hitSlop={8}>
                    <Text className="font-bodySemibold text-ink-soft text-xs">
                      {showPassword
                        ? t('onboarding.auth.signup.hide')
                        : t('onboarding.auth.signup.show')}
                    </Text>
                  </Pressable>
                }
              />

              <View className="-mt-1 mb-4 flex-row justify-end">
                <Pressable onPress={onForgot} accessibilityRole="link" hitSlop={6}>
                  <Text className="font-bodySemibold text-primary-deep text-[13px]">
                    {t('onboarding.auth.login.forgot')}
                  </Text>
                </Pressable>
              </View>

              {formErrorText ? (
                <Text className="mb-3 font-body text-primary-deep text-[13px] text-center">
                  {formErrorText}
                </Text>
              ) : null}

              <AuthBigBtn
                label={t('onboarding.auth.login.cta')}
                disabled={!canSubmit}
                loading={submitting}
                onPress={onSubmit}
              />

              <DividerWith label={t('onboarding.auth.or')} />

              <SocialRow
                loading={socialLoading}
                onApple={() => onSocial('apple')}
                onGoogle={() => onSocial('google')}
              />

              <View className="mt-7 flex-row justify-center items-center">
                <Text className="font-body text-ink-soft text-[13px]">
                  {t('onboarding.auth.login.switchPrompt')}
                </Text>
                <Pressable onPress={onSwitchSignup} accessibilityRole="link" hitSlop={6}>
                  <Text className="font-bodyBold text-primary-deep text-[13px] underline">
                    {t('onboarding.auth.login.switchAction')}
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

// Two overlapping circular gradient avatars per prototype:222-238.
function AvatarPair() {
  const c = useAppColors();
  return (
    <View className="flex-row justify-center items-center mb-6">
      {/* T291 (bug #4-5): pair-avatar separator was `border-white`, which
          looked harsh on the cream `bg-bg`. Using `border-bg` matches the
          PairCreate PairedHearts convention — ring picks up the page colour
          so the avatars feel carved out rather than outlined in pure white. */}
      <View className="w-14 h-14 rounded-full overflow-hidden items-center justify-center border-2 border-bg shadow-lg z-10">
        <LinearGradient
          colors={[c.primary, c.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <Text className="font-displayMediumItalic text-white text-[22px]">L</Text>
      </View>
      <View className="w-14 h-14 rounded-full overflow-hidden items-center justify-center border-2 border-bg shadow-lg -ml-3.5">
        <LinearGradient
          colors={[c.accent, c.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <Text className="font-displayMediumItalic text-white text-[22px]">M</Text>
      </View>
    </View>
  );
}

