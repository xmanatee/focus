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
    version: '1.0.1',
    copyright: '© 2026 nemi.love',
    release: {
      automaticRelease: true,
    },
    info: {
      'en-GB': {
        description:
          "Focus Blocks is the simplest way to put distracting apps out of reach during the time you set aside to focus.\n\nChoose the apps. Choose the rule. Block during focus hours, allow only inside chosen windows, or set a daily app budget. When a rule applies, selected apps are hidden system-wide until they are allowed again. No willpower games, no streaks, no social layer — just one clear setting that gives you your attention back.\n\nBuilt on Apple's Screen Time APIs, Focus Blocks works entirely on your device. It has no backend and no account. Your rules sync between your own devices through iCloud, under your own Apple ID. Screen Time app selections are private device-local tokens, so each device asks you to confirm the apps it should block.\n\nWHAT YOU CAN DO\n• Create as many focus blocks as you want — mornings, weekdays, deep-work afternoons\n• Pick specific apps and whole categories in one tap\n• Block during a schedule, allow only during a schedule, or set a daily limit\n• Choose whether a rule applies to all devices or only this device\n• Add a weekly setup window so blocks cannot be edited on impulse\n• Enable or disable any inactive block from one screen\n\nPRIVACY BY DEFAULT\n• No sign-up, no account\n• No analytics, no ads, no third-party SDKs\n• Uses Apple's Screen Time framework — selections and usage stay on-device\n• iCloud Key-Value Store is the only remote storage, and it lives in your own Apple ID\n\nFocus Blocks is self-directed. It is not a parental-control product and does not monitor or manage other people's devices.\n\nRequires iOS 18 or later.",
        keywords: [
          'distractions',
          'digital wellness',
          'deep work',
          'concentration',
          'study',
          'detox',
          'self control',
          'phone',
          'habits',
        ],
        promoText:
          'Pick the apps that pull you in. Pick when you want to focus. Focus Blocks hides them for exactly that long — then gives them back. No tracking. No account.',
        supportUrl: 'https://xmanatee.github.io/focus/support/',
        title: 'Focus Blocks: App Blocker',
        subtitle: 'Reduce screen time',
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
        "Focus Blocks is a personal focus app. It uses Apple's Screen Time frameworks (FamilyControls, DeviceActivity, ManagedSettings) under the Family Controls distribution entitlement that Apple has granted to our team (569HBLNQPC) for bundle ID love.nemi.focus.\n\nDATA MODEL\n- Fully on-device. No backend, no analytics, no account, no third-party SDKs.\n- Only remote storage: Apple's iCloud Key-Value Store (container iCloud.love.nemi.focus) — used to sync user-defined rules and non-private metadata between the user's own Apple devices under their own Apple ID.\n- Screen Time app selections and usage stay on-device. FamilyActivitySelection tokens are device-local; synced all-device rules ask each device to confirm its own local app selection before app shields are applied there.\n\nHOW TO REVIEW\n1. Launch the app. Approve the Screen Time authorization prompt (NSFamilyControlsUsageDescription — the rationale is shown on-screen).\n2. Tap \"Add block\" → pick a few apps via the FamilyActivityPicker → choose a rule → Save.\n3. The app supports blocking during a schedule, allowing only during a schedule, daily usage budgets, and schedule plus budget rules.\n4. When a rule applies, selected apps are shielded system-wide via ManagedSettingsStore. Tapping a shielded app shows the shield UI provided by our ShieldConfiguration extension.\n5. Rule metadata is persisted locally and mirrored to iCloud KV for cross-device sync; app selection tokens are confirmed per device.\n\nEXTENSIONS BUNDLED\n- love.nemi.focus.ActivityMonitorExtension — DeviceActivityMonitor; flips shields on/off at schedule boundaries and daily budget thresholds.\n- love.nemi.focus.ShieldConfiguration — shield UI shown when a user taps a blocked app.\n- love.nemi.focus.ShieldAction — included for ShieldAction service compatibility.\n\nCONTACT\nsupport@nemi.love — happy to walk through any flow or answer questions same-day.",
    },
  },
});
