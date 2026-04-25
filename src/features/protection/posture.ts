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

export function resolveProtectionPosture(
  setup: TamperSetup,
): ProtectionPosture {
  const defenses: Defense[] = DEFENSE_IDS.map((id) => ({
    id,
    ok: setup.acks[id].kind === 'set',
  }));
  const okCount = defenses.filter((d) => d.ok).length;
  const completedAt =
    okCount === DEFENSE_IDS.length
      ? Math.max(
          ...DEFENSE_IDS.map((id) => {
            const ack = setup.acks[id];
            return ack.kind === 'set' ? ack.at : 0;
          }),
        )
      : null;
  return {
    defenses,
    score: scoreFor(okCount),
    completedAt,
  };
}
