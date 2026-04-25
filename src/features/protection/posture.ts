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
    ok: setup[id].kind === 'set',
  }));
  return {
    defenses,
    score: scoreFor(defenses.filter((d) => d.ok).length),
  };
}
