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
  const yhat = predictScore(w, f);
  const e = y - yhat;
  // Gradient step: w_i += lr * (e * f_i - reg * w_i)
  const next: EvalParams = { ...w };
  next.w_race = clipVal(next.w_race + lr * (e * f.race - reg * next.w_race), clip?.w_race);
  next.done_bonus = clipVal(next.done_bonus + lr * (e * f.done - reg * next.done_bonus), clip?.done_bonus);
  next.w_clash = clipVal(next.w_clash + lr * (e * f.clash - reg * next.w_clash), clip?.w_clash);
  next.w_sprint = clipVal(next.w_sprint + lr * (e * f.sprint - reg * next.w_sprint), clip?.w_sprint);
  next.w_block = clipVal(next.w_block + lr * (e * f.block - reg * next.w_block), clip?.w_block);
  next.w_chain = clipVal((next.w_chain ?? 1) + lr * (e * f.chain - reg * (next.w_chain ?? 1)), clip?.w_chain);
  next.w_parity = clipVal((next.w_parity ?? 1) + lr * (e * f.parity - reg * (next.w_parity ?? 1)), clip?.w_parity);
  next.w_struct = clipVal((next.w_struct ?? 1) + lr * (e * f.struct - reg * (next.w_struct ?? 1)), clip?.w_struct);
  next.w_ones = clipVal((next.w_ones ?? 1) + lr * (e * f.ones - reg * (next.w_ones ?? 1)), clip?.w_ones);
  next.w_return = clipVal((next.w_return ?? 1) + lr * (e * f.ret - reg * (next.w_return ?? 1)), clip?.w_return);
  next.w_waste = clipVal((next.w_waste ?? 1) + lr * (e * f.waste - reg * (next.w_waste ?? 1)), clip?.w_waste);
  next.w_mob = clipVal((next.w_mob ?? 1) + lr * (e * f.mob - reg * (next.w_mob ?? 1)), clip?.w_mob);
  return next;
}

export const DEFAULT_CLIP: ClipRanges = {
  w_race: [0, 2],
  w_clash: [0, 100],
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
