/** Compute a "nice" tick step for an axis using 1-2-5 multiples. */
export function niceStep(min: number, max: number, desiredTicks = 5): number {
  const span = Math.abs(max - min);
  if (!(span > 0)) return 1;
  const raw = span / Math.max(1, desiredTicks);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / pow;
  let mult = 1;
  if (frac <= 1) mult = 1;
  else if (frac <= 2) mult = 2;
  else if (frac <= 5) mult = 5;
  else mult = 10;
  return mult * pow;
}
