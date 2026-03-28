import { describe, it, expect } from 'vitest';
import { updateWeights, DEFAULT_CLIP } from '../src/ia/autotune';
import type { EvalParams } from '../src/ia/evalTypes';
import type { Features12 } from '../src/ia/evaluate';

function baseEval(): EvalParams {
  return {
    w_race: 1.0,
    w_clash: 50.0,
    w_sprint: 8.0,
    w_block: 10.0,
    done_bonus: 200.0,
    sprint_threshold: 2,
    w_chain: 1.0,
    w_parity: 1.0,
    w_struct: 1.0,
    w_ones: 1.0,
    w_return: 1.0,
    w_waste: 1.0,
    w_mob: 1.0,
  };
}

describe('autotune.updateWeights', () => {
  it('should increase w_clash when target is larger than prediction and feature clash is positive', () => {
    const w0 = baseEval();
    const phi: Features12 = {
      race: 0, done: 0, clash: 10, chain: 0, sprint: 0, block: 0, parity: 0, struct: 0, ones: 0, ret: 0, waste: 0, mob: 0,
    };
    const y = 1000; // large positive target
    const w1 = updateWeights(w0, phi, y, { lr: 1e-3, reg: 1e-5, clip: DEFAULT_CLIP });
    expect(w1.w_clash).toBeGreaterThan(w0.w_clash);
  });

  it('should decrease w_clash when target is smaller than prediction and feature clash is positive', () => {
    const w0 = baseEval();
    const phi: Features12 = {
      race: 0, done: 0, clash: 10, chain: 0, sprint: 0, block: 0, parity: 0, struct: 0, ones: 0, ret: 0, waste: 0, mob: 0,
    };
    const y = -1000; // large negative target
    const w1 = updateWeights(w0, phi, y, { lr: 1e-3, reg: 1e-5, clip: DEFAULT_CLIP });
    expect(w1.w_clash).toBeLessThan(w0.w_clash);
  });

  it('should respect clipping ranges', () => {
    const w0 = baseEval();
    const phi: Features12 = {
      race: 10000, done: 0, clash: 0, chain: 0, sprint: 0, block: 0, parity: 0, struct: 0, ones: 0, ret: 0, waste: 0, mob: 0,
    };
    const y = 1e9; // huge target to push w_race upward
    const w1 = updateWeights(w0, phi, y, { lr: 1e-1, reg: 0, clip: DEFAULT_CLIP });
    expect(w1.w_race).toBeLessThanOrEqual(DEFAULT_CLIP.w_race![1]);
  });
});
