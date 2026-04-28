const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is required for store metadata. Set it as a CI secret or in your local .env before running eas metadata commands.`,
    );
  }
  return value;
};

module.exports = () => ({
  configVersion: 0,
  apple: {
    version: '1.0',
    copyright: '© 2026 nemi.love',
    release: {
      automaticRelease: false,
    },
    info: {
      'en-GB': {
        description:
          "Focus Blocks is the simplest way to put distracting apps out of reach during the time you set aside to focus.\n\nChoose the apps. Choose the schedule. When your focus block begins, those apps are hidden system-wide until the block ends. No willpower games, no streaks, no social layer — just one clear setting that gives you your attention back.\n\nBuilt on Apple's Screen Time APIs, Focus Blocks works entirely on your device. It has no backend and no account. Your app selections and your schedules sync between your own devices through iCloud, under your own Apple ID. Nothing else leaves your phone.\n\nWHAT YOU CAN DO\n• Create as many focus blocks as you want — mornings, weekdays, deep-work afternoons\n• Pick specific apps and whole categories in one tap\n• Set a start and end time, or mark a block as always-on\n• Quickly unlock for a short break when you genuinely need it\n• Enable or disable any block from one screen\n\nPRIVACY BY DEFAULT\n• No sign-up, no account\n• No analytics, no ads, no third-party SDKs\n• Uses Apple's Screen Time framework — selections and usage stay on-device\n• iCloud Key-Value Store is the only remote storage, and it lives in your own Apple ID\n\nFocus Blocks is self-directed. It is not a parental-control product and does not monitor or manage other people's devices.\n\nRequires iOS 18 or later.",
        keywords: [
          'schedule',
          'productivity',
          'screen time',
          'distraction',
          'digital wellness',
          'deep work',
          'concentration',
          'study',
        ],
        promoText:
          'Pick the apps that pull you in. Pick when you want to focus. Focus Blocks hides them for exactly that long — then gives them back. No tracking. No account.',
        supportUrl: 'https://xmanatee.github.io/focus/support/',
        title: 'Focus Blocks: Apps Blocker',
        subtitle: 'Schedule your focus time',
        privacyPolicyUrl: 'https://xmanatee.github.io/focus/privacy',
      },
    },
    categories: ['PRODUCTIVITY', 'LIFESTYLE'],
    advisory: {
      ageRatingOverride: 'NONE',
      alcoholTobaccoOrDrugUseOrReferences: 'NONE',
      contests: 'NONE',
      gambling: false,
      gamblingSimulated: 'NONE',
      horrorOrFearThemes: 'NONE',
      kidsAgeBand: null,
      koreaAgeRatingOverride: 'NONE',
      lootBox: false,
      matureOrSuggestiveThemes: 'NONE',
      medicalOrTreatmentInformation: 'NONE',
      profanityOrCrudeHumor: 'NONE',
      sexualContentGraphicAndNudity: 'NONE',
      sexualContentOrNudity: 'NONE',
      unrestrictedWebAccess: false,
      violenceCartoonOrFantasy: 'NONE',
      violenceRealistic: 'NONE',
      violenceRealisticProlongedGraphicOrSadistic: 'NONE',
      advertising: false,
      ageAssurance: false,
      ageRatingOverrideV2: 'NONE',
      developerAgeRatingInfoUrl: null,
      gunsOrOtherWeapons: 'NONE',
      healthOrWellnessTopics: false,
      messagingAndChat: false,
      parentalControls: false,
      userGeneratedContent: false,
    },
    review: {
      firstName: required('APPLE_REVIEW_FIRST_NAME'),
      lastName: required('APPLE_REVIEW_LAST_NAME'),
      email: required('APPLE_REVIEW_EMAIL'),
      phone: required('APPLE_REVIEW_PHONE'),
      demoRequired: false,
      notes:
        "Focus Blocks is a personal focus app. It uses Apple's Screen Time frameworks (FamilyControls, DeviceActivity, ManagedSettings) under the Family Controls distribution entitlement that Apple has granted to our team (569HBLNQPC) for bundle ID love.nemi.focus.\n\nDATA MODEL\n- Fully on-device. No backend, no analytics, no account, no third-party SDKs.\n- Only remote storage: Apple's iCloud Key-Value Store (container iCloud.love.nemi.focus) — used to sync user-defined schedules between the user's own Apple devices under their own Apple ID.\n- Screen Time data (app selections, usage) stays on-device. It is never transmitted anywhere.\n\nHOW TO REVIEW\n1. Launch the app. Approve the Screen Time authorization prompt (NSFamilyControlsUsageDescription — the rationale is shown on-screen).\n2. Tap \"Add block\" → pick a few apps via the FamilyActivityPicker → set a start and end time → Save.\n3. When the current time is inside the block's window, the selected apps are shielded system-wide via ManagedSettingsStore. Outside the window they behave normally.\n4. Tapping a shielded app shows our custom shield (ShieldConfiguration extension) with an optional \"unlock briefly\" action (ShieldAction extension).\n5. Schedule state is persisted locally and mirrored to iCloud KV for cross-device sync.\n\nEXTENSIONS BUNDLED\n- love.nemi.focus.ActivityMonitorExtension — DeviceActivityMonitor; flips shields on/off at schedule boundaries.\n- love.nemi.focus.ShieldConfiguration — custom shield UI shown when a user taps a blocked app.\n- love.nemi.focus.ShieldAction — handles the \"unlock briefly\" button on the shield.\n\nCONTACT\nsupport@nemi.love — happy to walk through any flow or answer questions same-day.",
    },
  },
});
