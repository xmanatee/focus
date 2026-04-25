export const PROTECTION_WIZARD_STEPS = 4;

export const protectionCopy = {
  intro: {
    title: 'Tamper protection.',
    body: 'iOS limits what an app can lock down on your behalf. This setup walks you through two iOS settings that, together, make Focus Blocks much harder to disable in a moment of weakness.',
    timeEstimate: '3–5 minutes. iOS 26.4 or later recommended.',
    primary: 'Start setup',
    skip: 'Maybe later',
  },
  passcode: {
    title: 'Set a Screen Time passcode.',
    body: 'In Settings, go to Screen Time → Lock Screen Time Settings, then tap "Use Screen Time Passcode" and pick a 4-digit code. On iOS 26.4+ this passcode also gates revoking Focus Blocks’ permission.',
    trustedFriendTitle: 'Better: have a friend set it',
    trustedFriendBody:
      'Hand the phone to someone you trust. They tap through the steps, pick a code, and walk away without telling you. You can’t undo what you can’t remember.',
    open: 'Open Settings',
    confirm: 'I have set the Screen Time passcode',
    continue: 'Continue',
  },
  restrictions: {
    title: 'Lock app deletion.',
    body: 'In Settings, go to Screen Time → Content & Privacy Restrictions, turn it on, then under iTunes & App Store Purchases set both "Deleting Apps" and "Installing Apps" to "Don’t Allow". This stops Focus Blocks (and the apps it shields) from being uninstalled mid-session.',
    open: 'Open Settings',
    deleteConfirm: 'Deleting apps is blocked',
    installConfirm: 'Installing apps is blocked',
    continue: 'Continue',
  },
  confirm: {
    title: 'You’re set.',
    body: 'Strict focus blocks now have something to lean on. While a strict block is active, the only way out is to wait for it to end — or to enter the Screen Time passcode in iOS Settings.',
    done: 'Done',
  },
  statusCard: {
    title: 'Tamper protection',
    none: 'Not set up. Strict mode has nothing to lean on.',
    partial: 'Partial protection. Finish setup for full coverage.',
    full: 'iOS defenses configured.',
  },
  lockInCard: {
    title: 'Strict mode',
    body: 'While this block is active, you cannot disable, edit, or delete it. The only way out is to wait, or to revoke Focus Blocks’ permission with the Screen Time passcode.',
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
