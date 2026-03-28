export const coerceBool = (v: unknown, def: boolean): boolean => (typeof v === 'boolean' ? v : def);

export const coerceNum = (v: unknown, def: number, min?: number, max?: number): number => {
  let n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) n = def;
  if (typeof min === 'number') n = Math.max(min, n);
  if (typeof max === 'number') n = Math.min(max, n);
  return n;
};
