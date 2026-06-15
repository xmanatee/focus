const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is required for store metadata. Set it as a CI secret or in your local .env before running eas metadata commands.`,
    );
  }
  return value;
};

const screenshotPaths = (size) =>
  ['01.png', '02.png', '03.png', '04.png', '05.png'].map(
    (name) => `assets/screenshots/final/${size}/${name}`,
  );

const screenshots = {
  APP_IPHONE_67: screenshotPaths('6.9'),
  APP_IPHONE_65: screenshotPaths('6.5'),
  APP_IPAD_PRO_3GEN_129: screenshotPaths('iPad-13'),
  APP_IPAD_PRO_129: screenshotPaths('iPad-12.9'),
};

const supportUrl = 'https://focus.nemi.love/support/';
const privacyPolicyUrl = 'https://focus.nemi.love/privacy/';

const englishDescription =
  "Focus Blocks is an app blocker for iPhone and iPad that puts distracting apps out of reach during the time you set aside to focus.\n\nChoose the apps. Choose the rule. Block during focus hours, allow only inside chosen windows, or set a daily app budget. When a rule applies, selected apps are hidden system-wide until they are allowed again. No willpower games, no streaks, no social layer — just one clear setting that gives you your attention back.\n\nBuilt on Apple's Screen Time APIs, Focus Blocks works entirely on your device. It has no backend and no account. Your rules sync between your own devices through iCloud, under your own Apple ID. Screen Time app selections are private device-local tokens, so each device asks you to confirm the apps it should block.\n\nWHAT YOU CAN DO\n• Create as many focus blocks as you want — mornings, weekdays, deep-work afternoons\n• Pick specific apps and whole categories in one tap\n• Block during a schedule, allow only during a schedule, or set a daily limit\n• Choose whether a rule applies to all devices or only this device\n• Add a weekly setup window so blocks cannot be edited on impulse\n• Enable or disable any inactive block from one screen\n\nPRIVACY BY DEFAULT\n• No sign-up, no account\n• No analytics, no ads, no third-party SDKs\n• Uses Apple's Screen Time framework — selections and usage stay on-device\n• iCloud Key-Value Store is the only remote storage, and it lives in your own Apple ID\n\nFocus Blocks is self-directed. It is not a parental-control product and does not monitor or manage other people's devices.\n\nRequires iOS 18 or later.";

const englishInfo = {
  description: englishDescription,
  keywords: [
    'youtube',
    'study focus',
    'digital detox',
    'self control',
    'social media',
    'website',
    'budget',
    'strict',
    'habits',
  ],
  promoText:
    'Block distracting apps, set Screen Time limits, and keep app selections private on each device. No account, ads, or analytics.',
  releaseNotes:
    'Adds daily app budgets, schedule plus budget rules, and clearer per-device setup for synced blocks.',
  supportUrl,
  title: 'Focus Blocks: App Blocker',
  subtitle: 'Screen time app limits',
  privacyPolicyUrl,
  screenshots,
};

const russianInfo = {
  description:
    'Focus Blocks помогает убрать отвлекающие приложения именно на то время, когда нужно сосредоточиться.\n\nВыберите приложения, сайты или категории и задайте правило: блокировать по расписанию, разрешать только в выбранные часы или поставить дневной лимит. Когда правило активно, выбранные приложения скрываются системно через Screen Time.\n\nПриложение работает на устройстве и не требует аккаунта. Нет аналитики, рекламы, сервера и сторонних SDK. Правила синхронизируются между вашими устройствами через iCloud под вашим Apple ID, а выбор приложений Screen Time остается локальным для каждого устройства.\n\nЧТО МОЖНО ДЕЛАТЬ\n• Создавать блоки для работы, учебы, вечера или выходных\n• Выбирать приложения, сайты и категории\n• Использовать расписание, дневной бюджет или оба ограничения вместе\n• Применять блок на всех устройствах или только на текущем\n• Включать окно настроек, чтобы не менять блоки импульсивно\n\nFocus Blocks предназначен для личного самоконтроля. Это не родительский контроль и приложение не управляет чужими устройствами.\n\nТребуется iOS 18 или новее.',
  keywords: [
    'экранное время',
    'блокировка',
    'соцсети',
    'лимит',
    'учеба',
    'продуктивность',
    'детокс',
    'ютуб',
    'привычки',
  ],
  promoText:
    'Блокируйте отвлекающие приложения по расписанию, задавайте дневные лимиты и храните выбор Screen Time локально на каждом устройстве.',
  releaseNotes:
    'Добавлены дневные лимиты, правила расписание плюс бюджет и более понятная настройка синхронизированных блоков на новом устройстве.',
  supportUrl,
  title: 'Focus Blocks: блок приложений',
  subtitle: 'Фокус без отвлечений',
  privacyPolicyUrl,
  screenshots,
};

module.exports = () => ({
  configVersion: 0,
  apple: {
    version: '1.0.2',
    copyright: '© 2026 nemi.love',
    release: {
      automaticRelease: true,
    },
    info: {
      'en-GB': englishInfo,
      'en-US': englishInfo,
      ru: russianInfo,
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
