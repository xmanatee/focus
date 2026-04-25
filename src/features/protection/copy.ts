export const PROTECTION_WIZARD_STEPS = 4;

export const protectionCopy = {
  intro: {
    title: 'Tamper protection.',
    body: 'iOS limits what an app can lock down on your behalf. Two settings inside iOS Screen Time, set with a passcode you do not know, are what give Focus Blocks any teeth.',
    timeEstimate: 'Best on iOS 26.4 or later. About 3 minutes.',
    primary: 'Start setup',
    skip: 'Maybe later',
  },
  screenTimeLock: {
    title: 'Lock Screen Time Settings.',
    body: 'Open Settings → Screen Time → scroll down → tap Lock Screen Time Settings → set a 4-digit passcode. On iOS 26.4+ this passcode is also required to revoke Focus Blocks’ Screen Time access. That is the iron lock — without it, anything below can be undone with your phone passcode.',
    trustedFriendTitle: 'Have a friend set the passcode',
    trustedFriendBody:
      'Hand the phone over. They tap Lock Screen Time Settings, pick a passcode, and walk away without telling you. You cannot undo what you cannot remember.',
    open: 'Open Settings',
    confirm: 'Screen Time Settings is locked with a passcode',
    continue: 'Continue',
  },
  appDeletion: {
    title: 'Block app deletion.',
    body: 'Open Settings → Screen Time → Content & Privacy Restrictions → enter the Screen Time passcode → turn the toggle on → tap iTunes & App Store Purchases → set Deleting Apps to Don’t Allow. This stops Focus Blocks from being uninstalled with a long-press on its icon.',
    open: 'Open Settings',
    confirm: 'Deleting apps is set to Don’t Allow',
    continue: 'Continue',
  },
  confirm: {
    title: 'You’re set.',
    body: 'While a strict block is active, Focus Blocks cannot be edited or disabled in-app, and cannot be deleted from the home screen. The only way out is to wait for it to end, or to enter the Screen Time passcode.',
    bypassTitle: 'The single bypass path',
    bypass:
      'Anyone with the Screen Time passcode can revoke Focus Blocks’ access in Settings and then delete the app. That is by design — and the reason a friend should set the passcode.',
    done: 'Done',
  },
  statusCard: {
    title: 'Tamper protection',
    none: 'Not set up. Strict mode has nothing to lean on.',
    partial: 'Partial protection. Finish setup for full coverage.',
    full: 'iOS defenses configured.',
  },
  strictMode: {
    title: 'Strict mode',
    body: 'While this block is active, you cannot disable, edit, or delete it. The only way out is to wait, or to enter the Screen Time passcode.',
    needsSetup: 'Set up tamper protection first to make this meaningful.',
    softBlockTitle: 'Tamper protection isn’t set up',
    softBlockBody:
      'Strict mode works without it, but it relies on iOS settings you haven’t configured yet. Set up first?',
    softBlockSetup: 'Set up first',
    softBlockAnyway: 'Turn on anyway',
  },
  settingsRow: {
    title: 'Tamper protection',
    none: 'Not set up',
    partial: (n: number, total: number): string =>
      `${n} of ${total} defenses active`,
    full: 'Full protection',
  },
} as const;
