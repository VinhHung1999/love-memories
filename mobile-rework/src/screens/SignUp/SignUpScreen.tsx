import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBigBtn, AuthField, DividerWith, LinearGradient, ScreenBackBtn, SocialRow } from '@/components';
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
    confirmPassword,
    showPassword,
    showConfirmPassword,
    errors,
    formError,
    submitting,
    socialLoading,
    canSubmit,
    setName,
    setEmail,
    setPassword,
    setConfirmPassword,
    onToggleShow,
    onToggleShowConfirm,
    onSubmit,
    onSwitchLogin,
    onSocial,
  } = useSignUpViewModel();
  const formErrorText = formError
    ? formError.kind === 'emailTaken'
      ? t('onboarding.auth.errors.emailTaken')
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
                returnKeyType="next"
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

              <AuthField
                label={t('onboarding.auth.signup.confirmPasswordLabel')}
                placeholder={t('onboarding.auth.signup.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icon="⌂"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                error={
                  errors.confirmPassword
                    ? t('onboarding.auth.errors.passwordMismatch')
                    : undefined
                }
                trailing={
                  <Pressable
                    onPress={onToggleShowConfirm}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Text className="font-bodySemibold text-ink-soft text-xs">
                      {showConfirmPassword
                        ? t('onboarding.auth.signup.hide')
                        : t('onboarding.auth.signup.show')}
                    </Text>
                  </Pressable>
                }
              />

              <Text className="mt-1.5 font-body text-ink-mute text-xs leading-[18px]">
                {t('onboarding.auth.signup.terms')}
              </Text>

              {formErrorText ? (
                <Text className="mt-3 font-body text-primary-deep text-[13px] text-center">
                  {formErrorText}
                </Text>
              ) : null}

              <View className="mt-6">
                <AuthBigBtn
                  label={t('onboarding.auth.signup.cta')}
                  disabled={!canSubmit}
                  loading={submitting}
                  onPress={onSubmit}
                />
              </View>

              <DividerWith label={t('onboarding.auth.or')} />

              <SocialRow
                loading={socialLoading}
                onApple={() => onSocial('apple')}
                onGoogle={() => onSocial('google')}
              />

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

