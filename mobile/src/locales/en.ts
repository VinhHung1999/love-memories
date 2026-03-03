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
    editCouple: 'Edit Couple',
    cancel: 'Cancel',
    save: 'Save',
    logout: 'Log out',
    logoutMessage: 'Are you sure?',
    changePhoto: 'Change photo',

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
      partnerEmail: 'Email',
      inviteCode: 'Invite code',
      generateInvite: 'Generate new code',
      shareHint: 'Share this code with your partner to connect',
      anniversary: 'Anniversary',
      noAnniversary: 'Set your anniversary date',
      setDate: 'Pick date',
      copy: 'Copy',
      copied: 'Copied!',
      noCode: 'No code yet',
    },

    labels: {
      name: 'Your name',
      coupleName: 'Couple name',
      anniversary: 'Anniversary date',
    },

    errors: {
      noGoogleToken: 'No ID token from Google',
      googleLinkFailed: 'Google linking failed',
      avatarFailed: 'Failed to upload photo',
      coupleSaveFailed: 'Failed to save couple info',
    },
  },

  dashboard: {
    title: 'Love Scrum',
    subtitle: 'Dashboard — Sprint 35',
    headerSubtitle: 'HOME',
  },

  moments: {
    title: 'Our Moments',
    subtitle: '♥ Our Story',
    allFilter: 'All',
    emptyTitle: 'No moments yet',
    emptySubtitle: 'Start capturing your memories together',
    emptyAction: 'Add First Moment',

    detail: {
      photos: 'Photos',
      voiceMemo: 'Voice Memo',
      reactions: 'Reactions',
      comments: 'Comments',
      spotifyLink: 'Spotify',
      mapsLink: 'View on Maps',
      viewGallery: 'View all photos',
      addComment: 'Add a comment...',
      noComments: 'No comments yet — be first!',
      noVoiceMemos: 'No voice memos',
      deleteTitle: 'Delete Moment',
      deleteMessage: 'Are you sure you want to delete this moment? This cannot be undone.',
      deleteConfirm: 'Delete',
    },

    create: {
      newTitle: 'New Moment',
      editTitle: 'Edit Moment',
      save: 'Save',
      saving: 'Saving...',
      photos: 'Photos',
      addPhoto: 'Add',
      details: 'Details',
      tags: 'Tags',
      songAndMemo: 'Song & Voice Memo',
      recordMemo: 'Record Voice Memo',
      recordHint: 'Tap to start · Max 5 minutes',
      recording: 'Recording...',
      stopRecording: 'Tap to stop',
      deleteAudio: 'Delete',
      addLocation: 'Add a location...',
      pickDate: 'Pick date',
      typeTag: 'Type tag + Enter...',
    },

    labels: {
      title: 'Title',
      caption: 'Caption',
      date: 'Date',
      location: 'Location',
      tags: 'Tags',
      spotifyUrl: 'Spotify URL',
    },

    placeholders: {
      title: 'Give this moment a title...',
      caption: 'Describe this moment...',
      spotifyUrl: 'Paste Spotify link...',
    },

    gallery: {
      close: 'Close',
      share: 'Share',
    },

    errors: {
      titleRequired: 'Title is required',
      titleTooLong: 'Title must be under 200 characters',
      spotifyInvalid: 'Please enter a valid Spotify URL',
      saveFailed: 'Failed to save moment',
      deleteFailed: 'Failed to delete moment',
      photoUploadFailed: 'Failed to upload photo',
      audioUploadFailed: 'Failed to upload voice memo',
      commentFailed: 'Failed to add comment',
      reactionFailed: 'Failed to update reaction',
    },
  },

  common: {
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    ok: 'OK',
    loading: 'Loading...',
  },
} as const;

export default en;
