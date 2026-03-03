/**
 * Single source of truth for all UI strings.
 *
 * Usage:  import t from '@/locales/en';
 *         <Text>{t.login.signIn}</Text>
 */
const en = {
  app: {
    name: 'Love Scrum',
  },

  login: {
    welcomeBack: 'Welcome back',
    createAccount: 'Create account',
    continueWithGoogle: 'Continue with Google',
    signUpWithGoogle: 'Sign up with Google',
    or: 'or',
    signIn: 'Sign in',
    noAccount: "Don't have an account? Register",
    hasAccount: 'Already have an account? Sign in',
    back: '← Back',

    labels: {
      name: 'Name',
      couple: 'Couple',
      email: 'Email',
      password: 'Password',
    },

    placeholders: {
      name: 'Your name',
      email: 'you@example.com',
      password: '••••••••',
      coupleName: 'Couple name (e.g. Hung & Nhu)',
      inviteCode: 'Invite code from your partner',
    },

    couple: {
      createNew: 'Create new',
      joinExisting: 'Join existing',
    },

    googleSetup: {
      subtitle: 'One more step — set up your couple',
    },

    errors: {
      emailRequired: 'Please enter your email',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Please enter your password',
      passwordTooShort: 'Password must be at least 6 characters',
      nameRequired: 'Please enter your name',
      coupleModeRequired: 'Please select create or join a couple',
      coupleNameRequired: 'Please enter couple name',
      inviteCodeRequired: 'Please enter invite code',
      googleNoToken: 'Google Sign-In failed: no ID token',
      coupleModeRequiredShort: 'Please select create or join',
      somethingWrong: 'Something went wrong',
      googleSignInFailed: 'Google Sign-In failed',
      googleSignupFailed: 'Google signup failed',
    },
  },

  profile: {
    title: 'Profile',
    edit: 'Edit',
    editName: 'Edit Name',
    cancel: 'Cancel',
    save: 'Save',
    logout: 'Log out',
    logoutMessage: 'Are you sure?',

    google: {
      title: 'Google Account',
      linked: '✓ Google account linked',
      linkHint: 'Link your Google account for easier sign-in',
      linkButton: 'Link Google Account',
    },

    couple: {
      title: '❤️ Couple',
      name: 'Couple name',
      partner: 'Partner',
      inviteCode: 'Invite code',
      generateInvite: 'Generate invite code',
      shareHint: 'Share this code with your partner',
    },

    labels: {
      name: 'Name',
    },

    errors: {
      noGoogleToken: 'No ID token from Google',
      googleLinkFailed: 'Google linking failed',
    },
  },

  dashboard: {
    title: 'Love Scrum',
    subtitle: 'Dashboard — Sprint 35',
  },

  common: {
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
  },
} as const;

export default en;
