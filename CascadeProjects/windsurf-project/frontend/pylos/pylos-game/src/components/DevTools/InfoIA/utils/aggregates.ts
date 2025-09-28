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

export type DifficultyGroup = {
  depth: number;
  records: InfoIAGameRecord[];
  stats: {
    count: number;
    winsL: number;
    winsD: number;
    winRateL: number; // 0..1
    winRateR: number; // 0..1 (complement or winsD/count)
    avgMoves: number;
    avgSec: number; // mean of per-record avgThinkMs
    minSec: number; // min across all moves in group
    maxSec: number; // max across all moves in group
    totalSec: number; // sum of totalThinkMs across group
  };
};

export function computeDifficultyGroups(list: InfoIAGameRecord[]): DifficultyGroup[] {
  const map = new Map<number, InfoIAGameRecord[]>();
  for (const r of list) {
    const d = r.depth;
    const arr = map.get(d) ?? [];
    arr.push(r);
    map.set(d, arr);
  }
  const groups: DifficultyGroup[] = [];
  for (const [depth, recs] of map.entries()) {
    const count = recs.length;
    let winsL = 0;
    let winsD = 0;
    let sumMoves = 0;
    let sumAvgSec = 0;
    let minSec = Number.POSITIVE_INFINITY;
    let maxSec = 0;
    let totalSec = 0;
    for (const r of recs) {
      if (r.winner === 'L') winsL++;
      else if (r.winner === 'D') winsD++;
      sumMoves += (r.moves ?? 0);
      sumAvgSec += (r.avgThinkMs ?? 0) / 1000;
      totalSec += (r.totalThinkMs ?? 0) / 1000;
      for (const pm of r.perMove || []) {
        const v = (pm.elapsedMs ?? 0) / 1000;
        if (v < minSec) minSec = v;
        if (v > maxSec) maxSec = v;
      }
    }
    if (!isFinite(minSec)) minSec = 0;
    const stats = {
      count,
      winsL,
      winsD,
      winRateL: count > 0 ? winsL / count : 0,
      winRateR: count > 0 ? winsD / count : 0,
      avgMoves: count > 0 ? sumMoves / count : 0,
      avgSec: count > 0 ? sumAvgSec / count : 0,
      minSec,
      maxSec,
      totalSec,
    };
    groups.push({ depth, records: recs.slice().sort((a, b) => b.createdAt - a.createdAt), stats });
  }
  groups.sort((a, b) => b.depth - a.depth);
  return groups;
}
