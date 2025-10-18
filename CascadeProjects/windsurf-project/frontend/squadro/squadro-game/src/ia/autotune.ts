import type { EvalParams } from './evalTypes';
import type { Features12 } from './evaluate';

export type ClipRanges = Partial<{
  w_race: [number, number];
  w_clash: [number, number];
  w_sprint: [number, number];
  w_block: [number, number];
  done_bonus: [number, number];
  w_chain: [number, number];
  w_parity: [number, number];
  w_struct: [number, number];
  w_ones: [number, number];
  w_return: [number, number];
  w_waste: [number, number];
  w_mob: [number, number];
}>;

export interface TuneParams {
  lr: number;   // learning rate
  reg: number;  // L2 regularization
  clip?: ClipRanges;
  // Optional objective: 'mse' (default), 'huber', or 'logistic'
  objective?: 'mse' | 'huber' | 'logistic';
  // Huber loss delta (if objective==='huber')
  huberDelta?: number;
  // Logistic scaling (z = yhat / logisticK), and y is treated as probability in [0,1]
  logisticK?: number;
  // Per-coordinate gradient clipping (absolute value)
  gradClip?: number;
}

export function predictScore(w: EvalParams, f: Features12): number {
  return (
    (w.w_race) * f.race +
    (w.done_bonus) * f.done +
    (w.w_clash) * f.clash +
    ((w.w_chain ?? 1) * f.chain) +
    (w.w_sprint) * f.sprint +
    (w.w_block) * f.block +
    ((w.w_parity ?? 1) * f.parity) +
    ((w.w_struct ?? 1) * f.struct) +
    ((w.w_ones ?? 1) * f.ones) +
    ((w.w_return ?? 1) * f.ret) +
    ((w.w_waste ?? 1) * f.waste) +
    ((w.w_mob ?? 1) * f.mob)
  );
}

function clipVal(v: number, range?: [number, number]): number {
  if (!range) return v;
  const [a, b] = range;
  return Math.max(a, Math.min(b, v));
}

export function updateWeights(w: EvalParams, f: Features12, y: number, params: TuneParams): EvalParams {
  const { lr, reg, clip } = params;
  const obj = params.objective ?? 'mse';
  const gradClip = typeof params.gradClip === 'number' && params.gradClip > 0 ? params.gradClip : undefined;

  const yhat = predictScore(w, f);

  // Helpers
  const huber = (e: number, delta: number): number => {
    const d = Math.max(1, delta);
    if (Math.abs(e) <= d) return e; // same as MSE in small errors
    return d * Math.sign(e); // clipped gradient for large residuals
  };
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
  const clipGrad = (g: number): number => gradClip ? Math.max(-gradClip, Math.min(gradClip, g)) : g;

  // Compute per-feature gradient term g_i (without regularization), then apply: w_i += lr * (-reg*w_i [+/-] g_i)
  const gRace = (() => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      // grad of CE wrt w: (pHat - p) * (f_i / K)
      return - (pHat - p) * (f.race / K);
    } else if (obj === 'huber') {
      const e = y - yhat;
      const d = params.huberDelta ?? 100;
      return huber(e, d) * f.race;
    } else {
      const e = y - yhat;
      return e * f.race;
    }
  })();
  const gDone = ((): number => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      return - (pHat - p) * (f.done / K);
    } else if (obj === 'huber') {
      const e = y - yhat; const d = params.huberDelta ?? 100; return huber(e, d) * f.done;
    } else {
      const e = y - yhat; return e * f.done;
    }
  })();
  const gClash = ((): number => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      return - (pHat - p) * (f.clash / K);
    } else if (obj === 'huber') {
      const e = y - yhat; const d = params.huberDelta ?? 100; return huber(e, d) * f.clash;
    } else {
      const e = y - yhat; return e * f.clash;
    }
  })();
  const gSprint = ((): number => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      return - (pHat - p) * (f.sprint / K);
    } else if (obj === 'huber') {
      const e = y - yhat; const d = params.huberDelta ?? 100; return huber(e, d) * f.sprint;
    } else {
      const e = y - yhat; return e * f.sprint;
    }
  })();
  const gBlock = ((): number => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      return - (pHat - p) * (f.block / K);
    } else if (obj === 'huber') {
      const e = y - yhat; const d = params.huberDelta ?? 100; return huber(e, d) * f.block;
    } else {
      const e = y - yhat; return e * f.block;
    }
  })();
  const gChain = ((): number => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      return - (pHat - p) * (f.chain / K);
    } else if (obj === 'huber') {
      const e = y - yhat; const d = params.huberDelta ?? 100; return huber(e, d) * f.chain;
    } else {
      const e = y - yhat; return e * f.chain;
    }
  })();
  const gParity = ((): number => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      return - (pHat - p) * (f.parity / K);
    } else if (obj === 'huber') {
      const e = y - yhat; const d = params.huberDelta ?? 100; return huber(e, d) * f.parity;
    } else {
      const e = y - yhat; return e * f.parity;
    }
  })();
  const gStruct = ((): number => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      return - (pHat - p) * (f.struct / K);
    } else if (obj === 'huber') {
      const e = y - yhat; const d = params.huberDelta ?? 100; return huber(e, d) * f.struct;
    } else {
      const e = y - yhat; return e * f.struct;
    }
  })();
  const gOnes = ((): number => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      return - (pHat - p) * (f.ones / K);
    } else if (obj === 'huber') {
      const e = y - yhat; const d = params.huberDelta ?? 100; return huber(e, d) * f.ones;
    } else {
      const e = y - yhat; return e * f.ones;
    }
  })();
  const gRet = ((): number => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      return - (pHat - p) * (f.ret / K);
    } else if (obj === 'huber') {
      const e = y - yhat; const d = params.huberDelta ?? 100; return huber(e, d) * f.ret;
    } else {
      const e = y - yhat; return e * f.ret;
    }
  })();
  const gWaste = ((): number => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      return - (pHat - p) * (f.waste / K);
    } else if (obj === 'huber') {
      const e = y - yhat; const d = params.huberDelta ?? 100; return huber(e, d) * f.waste;
    } else {
      const e = y - yhat; return e * f.waste;
    }
  })();
  const gMob = ((): number => {
    if (obj === 'logistic') {
      const K = Math.max(1, Math.round(params.logisticK ?? 400));
      const pHat = sigmoid(yhat / K);
      const p = Math.max(0, Math.min(1, y));
      return - (pHat - p) * (f.mob / K);
    } else if (obj === 'huber') {
      const e = y - yhat; const d = params.huberDelta ?? 100; return huber(e, d) * f.mob;
    } else {
      const e = y - yhat; return e * f.mob;
    }
  })();

  const next: EvalParams = { ...w };
  const step = (val: number, g: number, rng?: [number, number]) => {
    const gg = clipGrad(g);
    return clipVal(val + lr * (gg - reg * val), rng);
  };
  next.w_race = step(next.w_race, gRace, clip?.w_race);
  next.done_bonus = step(next.done_bonus, gDone, clip?.done_bonus);
  next.w_clash = step(next.w_clash, gClash, clip?.w_clash);
  next.w_sprint = step(next.w_sprint, gSprint, clip?.w_sprint);
  next.w_block = step(next.w_block, gBlock, clip?.w_block);
  next.w_chain = step((next.w_chain ?? 1), gChain, clip?.w_chain);
  next.w_parity = step((next.w_parity ?? 1), gParity, clip?.w_parity);
  next.w_struct = step((next.w_struct ?? 1), gStruct, clip?.w_struct);
  next.w_ones = step((next.w_ones ?? 1), gOnes, clip?.w_ones);
  next.w_return = step((next.w_return ?? 1), gRet, clip?.w_return);
  next.w_waste = step((next.w_waste ?? 1), gWaste, clip?.w_waste);
  next.w_mob = step((next.w_mob ?? 1), gMob, clip?.w_mob);
  return next;
}

export const DEFAULT_CLIP: ClipRanges = {
  w_race: [0, 3],
  w_clash: [0, 4],
  w_sprint: [0, 20],
  w_block: [0, 20],
  done_bonus: [0, 400],
  w_chain: [0, 2],
  w_parity: [0, 2],
  w_struct: [0, 2],
  w_ones: [0, 2],
  w_return: [0, 2],
  w_waste: [0, 2],
  w_mob: [0, 2],
};
