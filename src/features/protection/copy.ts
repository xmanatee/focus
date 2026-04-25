export const PROTECTION_WIZARD_STEPS = 5;

export const protectionCopy = {
  intro: {
    title: 'Tamper protection.',
    body: 'iOS limits what an app can lock down on your behalf. The wizard walks you through three iOS settings that, together, make Focus Blocks much harder to disable in a moment of weakness.',
    timeEstimate: '3–5 minutes.',
    iosVersionNote: 'For the strongest protection, run iOS 26.4 or later.',
    cannotPreventTitle: 'What this cannot prevent',
    cannotPrevent: [
      'Anyone who knows your Screen Time passcode.',
      'The Apple-provided "Forgot Passcode" recovery flow.',
      'Uninstalling Focus Blocks if you skip the restrictions step.',
      'Apps you have not added to a focus block.',
    ],
    primary: 'Start setup',
    skip: 'Maybe later',
  },
  passcode: {
    title: 'Set a Screen Time passcode.',
    body: 'On iOS 26.4+, this passcode also gates revoking Focus Blocks’ permission. Without it, any in-app guarantee can be turned off in iOS Settings.',
    selfPrimary: 'Set it myself',
    friendPrimary: 'Have a trusted friend set it',
    friendBody:
      'Hand the phone to someone you trust. They set the passcode, do not tell you, and walk away. You cannot undo what you cannot remember.',
    open: 'Open iOS Settings',
    confirm: 'I have set the Screen Time passcode',
    continue: 'Continue',
  },
  restrictions: {
    title: 'Lock app deletion.',
    body: 'Two switches in Content & Privacy Restrictions stop Focus Blocks (and the apps it shields) from being uninstalled or reinstalled mid-session.',
    open: 'Open iOS Settings',
    deleteConfirm: 'Don’t Allow Deleting Apps is on',
    installConfirm: 'Don’t Allow Installing Apps is on',
    continue: 'Continue',
  },
  emergency: {
    title: 'Configure emergency exit.',
    body: 'A challenge code lets you end a strict session early when you really need to. Each use makes the next code longer.',
    weeklyLabel: 'Uses per week',
    cooldownLabel: 'Cooldown before unblock',
    zeroWarnTitle: 'No in-app exit',
    zeroWarn:
      'With zero uses per week, the only way to end a strict session early is the Screen Time passcode flow or uninstalling Focus Blocks. Choose this only if you mean it.',
    save: 'Save',
    revealTitle: 'Write this down.',
    revealBody:
      'This is the only time you will see this code. If you lose it, your only options are to wait for the weekly window, or use the Screen Time passcode flow.',
    continue: 'Continue',
  },
  confirm: {
    title: 'You’re set.',
    cannotPreventTitle: 'Final reminder',
    done: 'Done',
  },
  statusCard: {
    title: 'Tamper protection',
    none: 'Not set up. Strict mode has nothing to lean on.',
    partial: 'Partial protection. Finish setup for full coverage.',
    full: 'All three iOS defenses recorded.',
  },
  lockInCard: {
    title: 'Strict mode',
    body: 'While this block is active, you cannot disable, edit, or delete it. The only way out is your emergency code or the Screen Time passcode.',
    needsSetup: 'Set up tamper protection first to make this meaningful.',
    softBlockTitle: 'Tamper protection isn’t set up',
    softBlockBody:
      'Strict mode works without it, but it relies on iOS settings you haven’t configured yet. Set up first?',
    softBlockSetup: 'Set up first',
    softBlockAnyway: 'Turn on anyway',
  },
  emergencyModal: {
    title: 'Emergency exit',
    body: 'Type the code to end this strict session. Each use grows the code longer.',
    placeholder: 'Code',
    confirm: 'Confirm',
    wrong: 'That doesn’t match. Try again.',
    notReadyDisabled: 'Emergency exit is disabled for this account.',
    notReadyExhausted: 'You’ve used your weekly quota.',
    notReadyCooldown: 'Cooldown after your last exit.',
    successTitle: 'Session ended.',
    successBody:
      'Here’s your next code. Write it down — you won’t see it again.',
    successContinue: 'I’ve saved it, close',
    close: 'Close',
  },
  settingsRow: {
    title: 'Tamper protection',
    none: 'Not set up',
    partial: (n: number, total: number): string =>
      `${n} of ${total} defenses active`,
    full: 'Full protection',
  },
} as const;
