// Shared control helpers for sliders and step adjustments

export const decimalsOf = (n: number): number => {
  const s = n.toString();
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
};

export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export const roundByStep = (v: number, step: number): number => Number(v.toFixed(decimalsOf(step)));

export const nextVal = (current: number, step: number, min: number, max: number, dir: 1 | -1): number =>
  clamp(roundByStep(current + dir * step, step), min, max);
