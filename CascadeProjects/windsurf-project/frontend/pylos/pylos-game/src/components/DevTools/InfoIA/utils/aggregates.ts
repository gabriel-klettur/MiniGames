import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';

export type AggRow = { depth: number; avgSec: number; minSec: number; maxSec: number };

export function computeAggregates(list: InfoIAGameRecord[]): AggRow[] {
  const map = new Map<number, { count: number; sumAvg: number; min: number; max: number }>();
  for (const r of list) {
    const d = r.depth;
    const recAvg = (r.avgThinkMs ?? 0) / 1000;
    // Compute per-record min/max over moves
    let recMin = Number.POSITIVE_INFINITY;
    let recMax = 0;
    for (const pm of r.perMove || []) {
      const v = (pm.elapsedMs ?? 0) / 1000;
      if (v < recMin) recMin = v;
      if (v > recMax) recMax = v;
    }
    if (!isFinite(recMin)) recMin = 0;
    const prev = map.get(d) ?? { count: 0, sumAvg: 0, min: Number.POSITIVE_INFINITY, max: 0 };
    prev.count += 1;
    prev.sumAvg += recAvg;
    if (recMin < prev.min) prev.min = recMin;
    if (recMax > prev.max) prev.max = recMax;
    map.set(d, prev);
  }
  const out: AggRow[] = [];
  for (const [d, v] of map.entries()) {
    const avgSec = v.count > 0 ? v.sumAvg / v.count : 0;
    const minSec = isFinite(v.min) ? v.min : 0;
    const maxSec = v.max;
    out.push({ depth: d, avgSec, minSec, maxSec });
  }
  out.sort((a, b) => a.depth - b.depth);
  return out;
}
