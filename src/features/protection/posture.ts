import {
  DEFENSE_IDS,
  type Defense,
  type ProtectionPosture,
  type TamperSetup,
} from './types';

function scoreFor(okCount: number): ProtectionPosture['score'] {
  if (okCount === 0) return 'none';
  if (okCount === DEFENSE_IDS.length) return 'full';
  return 'partial';
}

function latestAckTimestamp(setup: TamperSetup): number {
  let latest = 0;
  for (const id of DEFENSE_IDS) {
    const ack = setup.acks[id];
    if (ack.kind === 'set' && ack.at > latest) latest = ack.at;
  }
  return latest;
}

export function resolveProtectionPosture(
  setup: TamperSetup,
): ProtectionPosture {
  const defenses: Defense[] = DEFENSE_IDS.map((id) => ({
    id,
    ok: setup.acks[id].kind === 'set',
  }));
  const okCount = defenses.filter((d) => d.ok).length;
  return {
    defenses,
    score: scoreFor(okCount),
    completedAt:
      okCount === DEFENSE_IDS.length ? latestAckTimestamp(setup) : null,
  };
}
