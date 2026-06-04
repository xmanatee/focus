import { describe, expect, it } from 'vitest';
import { PRESETS } from './presets';

describe('PRESETS', () => {
  it('includes quick starts for study, social budgets, and YouTube limits', () => {
    expect(PRESETS.study.name).toBe('Study Focus');
    expect(PRESETS.socialBudget.rule).toEqual({
      kind: 'dailyBudget',
      minutes: 15,
    });
    expect(PRESETS.youtube.rule).toEqual({ kind: 'dailyBudget', minutes: 10 });
  });

  it('keeps every preset useful with a name, days, and website defaults', () => {
    for (const preset of Object.values(PRESETS)) {
      expect(preset.name).not.toBe('');
      expect(preset.days.length).toBeGreaterThan(0);
      expect(preset.webDomains.length).toBeGreaterThan(0);
    }
  });
});
