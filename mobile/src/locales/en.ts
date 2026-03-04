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
      linkedSuccess: 'Google account linked!',
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
    subtitle: 'Dashboard',
    headerSubtitle: 'HOME ♥',
    couple: {
      togetherFor: 'Together for',
      noAnniversary: 'Set your anniversary ♥',
      years: 'y',
      months: 'mo',
      days: 'd',
    },
    stats: {
      moments: 'Moments',
      foodSpots: 'Food Spots',
    },
    sections: {
      recentMoments: 'Recent Moments',
      quickActions: 'Quick Access',
      foodHighlights: 'Food Highlights',
      seeAll: 'See all',
    },
    quickActions: {
      moments: 'Moments',
      food: 'Food',
      map: 'Map',
      profile: 'Profile',
    },
    noMomentsYet: 'No moments yet\nAdd your first memory together',
    noFoodYet: 'No food spots yet',
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
      deleteCommentTitle: 'Remove Comment',
      deleteCommentMessage: 'Remove this comment?',
      deleteCommentConfirm: 'Remove',
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
      addLocation: 'Search or paste Google Maps link...',
      gettingLocation: 'Getting location...',
      resolvingUrl: 'Resolving...',
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
      locationFailed: 'Could not get your location',
      maxPhotos: 'Maximum 10 photos allowed',
      micPermissionDenied: 'Microphone permission denied',
      recordFailed: 'Failed to start recording',
    },
  },

  foodSpots: {
    title: 'Food Spots',
    subtitle: '🍜 Our Places',
    allFilter: 'All',
    emptyTitle: 'No food spots yet',
    emptySubtitle: 'Save your favorite restaurants and cafes together',
    emptyAction: 'Add First Spot',

    detail: {
      photos: 'Photos',
      viewGallery: 'View all photos',
      mapsLink: 'Get Directions',
      deleteTitle: 'Delete Food Spot',
      deleteMessage: 'Are you sure you want to delete this food spot? This cannot be undone.',
      deleteConfirm: 'Delete',
    },

    create: {
      newTitle: 'New Food Spot',
      editTitle: 'Edit Food Spot',
      save: 'Save',
      saving: 'Saving...',
      photos: 'Photos',
      addPhoto: 'Add',
      details: 'Details',
      tags: 'Tags',
    },

    labels: {
      name: 'Name',
      description: 'Notes',
      location: 'Location',
      rating: 'Rating',
      priceRange: 'Price Range',
      tags: 'Tags',
    },

    placeholders: {
      name: 'Restaurant or cafe name...',
      description: 'What did you love about it?',
    },

    errors: {
      nameRequired: 'Name is required',
      saveFailed: 'Failed to save food spot',
      deleteFailed: 'Failed to delete food spot',
      photoUploadFailed: 'Failed to upload photo',
    },
  },

  map: {
    title: 'Our Map',
    subtitle: '📍 Places we\'ve been',
    filterAll: 'All',
    filterMoments: 'Moments',
    filterFoodSpots: 'Food Spots',
    setupRequired: 'Map requires native setup',
    setupDescription: 'Install @rnmapbox/maps and rebuild to enable the interactive map.',
    pinsLoaded: 'pins loaded',
    viewDetails: 'View Details',
    emojiPickerTitle: 'Icon for',
    emojiPickerCustomPlaceholder: 'Custom emoji...',
    emojiCategoryFood: 'Food',
    emojiCategoryPlaces: 'Places',
    emojiCategoryActivities: 'Activities',
    emojiCategoryNature: 'Nature',
  },

  common: {
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    ok: 'OK',
    loading: 'Loading...',
    uploading: 'Uploading',
    uploadComplete: 'Upload complete',
  },
} as const;

export default en;
