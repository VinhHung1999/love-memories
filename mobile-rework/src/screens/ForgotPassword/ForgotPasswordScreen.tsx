import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBigBtn, AuthField, LinearGradient, ScreenBackBtn } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { useForgotPasswordViewModel } from './useForgotPasswordViewModel';

// Ports `ForgotPwScreen` from docs/design/prototype/memoura-v2/auth.jsx:290.
// Two-state UI: form (secondarySoft top wash) → success (accentSoft full wash
// with checkmark badge). BE always returns 200, so we treat any non-error
// response as "sent" — no email-enumeration leak.

export function ForgotPasswordScreen() {
  const vm = useForgotPasswordViewModel();
  if (vm.sent) return <SentView email={vm.sentEmail} onBack={vm.onBackToLogin} />;
  return <FormView vm={vm} />;
}

function FormView({ vm }: { vm: ReturnType<typeof useForgotPasswordViewModel> }) {
  const { t } = useTranslation();
  const c = useAppColors();
  const formErrorText = vm.formError
    ? vm.formError.kind === 'rateLimited'
      ? t('onboarding.auth.errors.rateLimited')
      : t('onboarding.auth.errors.network')
    : null;

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[220px]">
        <LinearGradient
          colors={[c.secondarySoft, c.bg]}
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
                {t('onboarding.auth.forgot.title')}
              </Text>
              <Text className="mt-1.5 font-body text-ink-mute text-[13px]">
                {t('onboarding.auth.forgot.subtitle')}
              </Text>
            </View>

            <View className="px-5 pt-7 pb-10">
              <Text className="font-body text-ink-soft text-[14.5px] leading-[22px] mb-5 max-w-[330px]">
                {t('onboarding.auth.forgot.instructions')}
              </Text>

              <AuthField
                label={t('onboarding.auth.forgot.emailLabel')}
                placeholder={t('onboarding.auth.forgot.emailPlaceholder')}
                value={vm.email}
                onChangeText={vm.setEmail}
                icon="✉"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={vm.onSubmit}
                error={
                  vm.emailError ? t('onboarding.auth.errors.emailInvalid') : undefined
                }
              />

              {formErrorText ? (
                <Text className="mb-3 font-body text-primary-deep text-[13px] text-center">
                  {formErrorText}
                </Text>
              ) : null}

              <View className="mt-5">
                <AuthBigBtn
                  label={t('onboarding.auth.forgot.cta')}
                  disabled={!vm.canSubmit}
                  loading={vm.submitting}
                  onPress={vm.onSubmit}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function SentView({ email, onBack }: { email: string; onBack: () => void }) {
  const { t } = useTranslation();
  const c = useAppColors();
  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute inset-0">
        <LinearGradient
          colors={[c.accentSoft, c.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          className="absolute inset-0"
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="px-2 pt-2">
          <ScreenBackBtn onPress={onBack} />
        </View>

        <View className="flex-1 px-5 items-center justify-center">
          <View className="w-[88px] h-[88px] rounded-full overflow-hidden items-center justify-center shadow-lg mb-6">
            <LinearGradient
              colors={[c.accent, c.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute inset-0"
            />
            <Text className="font-bodyBold text-white text-[40px]">✓</Text>
          </View>

          <Text className="font-displayMediumItalic text-ink text-[32px] leading-[36px] text-center mb-3">
            {t('onboarding.auth.forgot.sentTitle')}
          </Text>
          <Text className="font-body text-ink-soft text-[15px] leading-[22px] text-center max-w-[300px]">
            {t('onboarding.auth.forgot.sentBody', { email })}
          </Text>

          <View className="w-full mt-8 px-2">
            <AuthBigBtn
              label={t('onboarding.auth.forgot.backToLogin')}
              trailing=""
              onPress={onBack}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
