---
id: "0425-xnge"
title: "Tamper-resistance v3: FocusBlock.strict + protection module + wizard + emergency exit"
status: "in_progress"
current_phase: 5
phase_name: "Complete"
max_phases: 5
use_worktree: false
worktree_dir: ""
created_at: "2026-04-25T02:56:16.731984"
completion_promise: "<promise>DO_COMPLETE</promise>"
---



# Requirements

Implement the tamper-resistance v3 plan agreed in conversation. The 7 open calls go with the recommended defaults below; proceed.

## Locked decisions (do not re-litigate)

1. **Strict shield expansion: dropped.** No native/Swift changes. The library already shields the user's selection during an active block — that's what suppresses Delete App on the blocked apps. We do not synthesize broader category tokens.
2. **Emergency model: Jomo-style ratcheting code.** No partner approval, no server.
3. **Code storage: plaintext, in iCloud-backed Zustand store**, generated and shown exactly once at setup time and after each successful use. No `expo-crypto`, no hashing — the threat model is the user fighting themselves and the friction is the code length, not crypto.
4. **Strict gating: soft-block.** If the user toggles `strict: true` while tamper setup is incomplete, an Alert offers "Set up first" or "Turn on anyway".
5. **`weeklyLimit: 0`: available**, with an explicit confirm step in the wizard ("This means no in-app escape hatch — the only way out will be the Screen Time passcode or uninstall.").
6. **iCloud-hosted .shortcut: deferred.** Not part of this implementation.
7. **iOS floor: keep 18.0**; wizard intro banner recommends 26.4+ for strongest passcode-revoke gate (copy only, no runtime check).

## Architecture

### New feature module: `src/features/protection/`

```
types.ts                  TamperSetup, EmergencyMode, EmergencyQuota, ProtectionPosture, Defense
copy.ts                   wizard strings — single source of truth
codeChallenge.ts          pure: generateCode(length: number): string
useTamperSetupStore.ts    zustand persisted (iCloud) — wizard check-offs
useEmergencyStore.ts      zustand persisted (iCloud) — budget, history, current code, ratchet
useEmergencyQuota.ts      derived hook: ready | cooldown | exhausted | disabled, ticking
useProtectionPosture.ts   derived hook: 4 defenses + score (none/partial/full)
```

### Existing files — surgical edits

```
src/features/schedule/types.ts            + strict: boolean on FocusBlock and FocusBlockInput
src/features/schedule/validation.ts       + if input.strict, require selectionHasBlockedTargets
src/features/schedule/useActiveBlock.ts   return { active, isStrict, now }
src/features/schedule/useFocusBlockStore.ts  no change (assertNotActive already handles strict)
```

### New shared primitives — `src/shared/components/`

```
Checklist.tsx               tap-to-confirm rows (Pressable + Typography + Icon)
StepHeader.tsx              wizard top: Step N of M · title · close
InfoBanner.tsx              variant: info | warn | success
CountdownPill.tsx           "Unlocks in 3h 12m" — uses existing days.ts formatRelative-style logic
CodeInput.tsx               segmented monospace char-grid for code entry
ProtectionStatusCard.tsx    main-feed posture summary; tap to open wizard
```

### New routes — `app/protection/`

```
_layout.tsx       Stack, presentation: 'formSheet' (matches existing modals)
index.tsx         Intro + posture summary + entry into substeps
passcode.tsx      Screen Time Passcode (self / trusted-friend paths)
restrictions.tsx  Don't-Allow-Delete + Don't-Allow-Install (single iOS round-trip)
emergency.tsx     Budget config + one-shot code reveal
confirm.tsx       Summary + honest disclosures
```

### New runtime modal — `app/emergency.tsx`

Reachable only when `isStrict && quota.kind === 'ready'`. Code entry; on success: ratchet length up, generate next plaintext code (shown once), record usage, and toggle the active block off. Wrong entry: haptic.abandon + shake.

### Refactor in same commit

Extract `<ActiveSessionCard />` from `app/index.tsx:117–130` into
`src/features/schedule/components/ActiveSessionCard.tsx`. Strict variant adds an Emergency-exit ghost button row.

### Composition rule

`disabled = isAdminLocked || isStrict` — apply to: the "+" button, every `FocusBlockRow.locked`, the Settings entry tile (when strict), and the add-focus-block form (which already auto-`router.back()` on `isAdminLocked` via `useEffect`; extend the same effect to also bail on `isStrict`).

## Type sketches

```ts
// src/features/schedule/types.ts (delta)
export interface FocusBlock {
  // ...existing fields...
  strict: boolean;
}
// FocusBlockInput grows the same field.

// src/features/protection/types.ts
export type Ack = { kind: 'unset' } | { kind: 'set'; at: number };

export interface TamperSetup {
  passcode: Ack;
  deleteLock: Ack;
  installLock: Ack;
  completedAt: number | null;
}

export type EmergencyMode =
  | { kind: 'disabled' }
  | { kind: 'enabled';
      weeklyLimit: 1 | 2 | 3;
      codeLength: number;          // monotonic; ratchets +4 per use
      cooldownMinutes: number;
      currentCode: string;          // plaintext; never re-displayed after first reveal
      history: readonly { usedAt: number }[]; };

export type EmergencyQuota =
  | { kind: 'disabled' }
  | { kind: 'exhausted'; resetsAt: Date }
  | { kind: 'cooldown'; unlocksAt: Date }
  | { kind: 'ready'; remainingThisWeek: number; codeLength: number };

export interface Defense {
  id: 'passcode' | 'deleteLock' | 'installLock';
  ok: boolean;
}
export interface ProtectionPosture {
  defenses: readonly Defense[];
  score: 'none' | 'partial' | 'full';
}
```

## Validation rules

In `src/features/schedule/validation.ts`:
- `if (input.strict && !selectionHasBlockedTargets(input.selection)) throw new Error('A strict block must block at least one app or site.');`

That's the only new validation. The store's existing `assertNotActive` already prevents:
- toggling the block off mid-active
- editing it mid-active (including flipping `strict` off)
- deleting it mid-active

## Honest scope (must show in UI copy)

What strict mode reliably prevents:
- in-app edit/disable/delete of any block during a strict session
- uninstall **iff** Don't-Allow-Delete is set
- reinstall of blocked apps **iff** Don't-Allow-Install is set
- revoking Family Controls **iff** iOS 26.4+ + Screen Time passcode set

What it cannot prevent (must say so):
- a determined user who knows the Screen Time passcode
- the Apple-reserved Forgot-Passcode recovery flow
- uninstall without Content & Privacy Restrictions
- apps not added to a block

## Constraints to respect

- File-size cap: 300 lines TS / 150 shell.
- Discriminated unions for state with distinct shapes (per CLAUDE.md "Strict by Default").
- No `?` field optionality unless genuinely absent.
- No `??` swallowing of zero/empty/false unless that's the intent.
- No comments explaining WHAT the code does. Only non-obvious WHY.
- No new deps. No Swift edits. No new tickers (reuse `useActiveBlock().now`).
- iCloud-backed Zustand stores follow the existing pattern in `useSettingsStore.ts` and `useFocusBlockStore.ts`.
- Wizard strings live in `src/features/protection/copy.ts` (single source).
- All shared components reuse existing primitives (Typography, Icon, Button, Screen, NotifyRow, theme, haptics).
- Tests in vitest where pure logic exists: `codeChallenge.test.ts`, quota-derivation test, `validation.test.ts` extension.

## Phased build order

| Phase | Scope |
|---|---|
| A | protection module scaffold + wizard intro/passcode/restrictions/confirm + `useTamperSetupStore` + `<ProtectionStatusCard />` on feed + Settings entry |
| B | `FocusBlock.strict` + validation + `useActiveBlock.isStrict` + UI guards on feed/add-form/settings + `<ActiveSessionCard />` extraction + `<LockInCard />` in add-focus-block |
| C | Emergency: `useEmergencyStore`, ratcheting code, `useEmergencyQuota`, `/emergency` modal, wizard emergency step |

Implement all three phases together — they are interdependent for a coherent UX.

## Progress
