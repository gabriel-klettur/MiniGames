import { useCallback, useEffect, useRef, useState } from 'react';
import { initialState } from '../../../../game/rules';
import type { AIMove } from '../../../../ia/moves';
import { computeKey } from '../../../../ia/zobrist';
import { makeSignature } from '../../../../ia/signature';
import { resolveDifficulty } from '../../../../ia/book';
import type { GameState } from '../../../../game/types';
import type { InfoIAGameRecord, InfoIAPerMove } from '../../../../utils/infoiaDb';
import { makeId } from '../../../../utils/infoiaDb';
import { getBestMove, apply as applyAIRunner, checkGameOver } from '../services/aiRunner';
import { useProgress } from './useProgress';
import { readAdvancedCfgByPlayer } from '../../../../utils/iaAdvancedStorage';
import { useAvoidPenalty } from './useAvoidPenalty';
import { useRepetitionLimit } from './useRepetitionLimit';
import type { TimeMode } from '../types';
import { recordStateKey } from '../../../../utils/repetitionDb';

// Persistence for anti-loops (point 9)
const AVOID_PERSIST_KEY = 'pylos.infoia.antiLoop.v1';
type PersistEntry = { hi: number; lo: number; weight: number; ts: number };

function readPersistedAvoid(): PersistEntry[] {
  try {
    const raw = localStorage.getItem(AVOID_PERSIST_KEY);
    if (!raw) return [];
    const arr: any[] = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((e: any) => ({ hi: Number(e?.hi) >>> 0, lo: Number(e?.lo) >>> 0, weight: Math.max(0, Number(e?.weight) || 0), ts: Number(e?.ts) || 0 }))
      .filter((e: any) => Number.isFinite(e.hi) && Number.isFinite(e.lo) && Number.isFinite(e.weight));
  } catch { return []; }
}


function writePersistedAvoid(entries: PersistEntry[], cap: number): void {
  try {
    const pruned = entries
      .filter(e => e.weight > 0)
      .sort((a,b) => b.weight - a.weight)
      .slice(0, Math.max(50, Math.floor(cap))); // cap to avoid unbounded growth
    localStorage.setItem(AVOID_PERSIST_KEY, JSON.stringify(pruned));
  } catch {}
}

function decayEntries(entries: PersistEntry[], halfLifeDays: number): PersistEntry[] {
  const now = Date.now();
  const HALF_LIFE_DAYS = Math.max(1, Math.floor(halfLifeDays || 7)); // half weight each N days
  const msPerDay = 24*60*60*1000;
  return entries.map(e => {
    const ageDays = Math.max(0, (now - (Number(e.ts)||now)) / msPerDay);
    const factor = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    return { ...e, weight: Math.floor(e.weight * factor) };
  }).filter(e => e.weight > 0);
}

export type UseInfoIASimParams = {
  depth: number;
  timeMode: TimeMode;
  timeSeconds: number;
  pliesLimit: number;
  gamesCount: number;
  mirrorBoard: boolean;
  useBook: boolean;
  onMirrorStart?: () => void;
  onMirrorUpdate?: (s: GameState) => void;
  onMirrorEnd?: (s: GameState) => void;
};

export function useInfoIASim(params: UseInfoIASimParams) {
  const { depth, timeMode, timeSeconds, pliesLimit, gamesCount, mirrorBoard, useBook, onMirrorStart, onMirrorUpdate, onMirrorEnd } = params;

  const [running, setRunning] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);
  const { elapsedMs: moveElapsedMs, targetMs: moveTargetMs, start: startProgress, stop: stopProgress } = useProgress();
  const [moveIndex, setMoveIndex] = useState<number>(0);

  const timeMs = useRef<number | undefined>(undefined);
  timeMs.current = timeMode === 'manual' ? Math.max(0, Math.min(30, timeSeconds)) * 1000 : undefined;
  const { getRepeatMax } = useRepetitionLimit();
  const { getAvoidPenalty } = useAvoidPenalty();

  useEffect(() => {
    return () => {
      stopProgress();
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
    };
  }, [stopProgress]);

  const runOneGame = useCallback(async (): Promise<InfoIAGameRecord> => {
    const createdAt = Date.now();
    const id = makeId();
    let state = initialState();
    // Persist initial state key so simulated games contribute to repetition DB
    try { recordStateKey(computeKey(state)); } catch {}
    let moves = 0;
    let totalThinkMs = 0;
    let maxWorkersUsed = 1;
    const perMove: InfoIAPerMove[] = [];
    // No-progress rule: end simulation if no tactical progress in N plies
    const noProgressLimit = 40; // configurable if needed
    let noProgressPlies = 0;

    if (mirrorBoard) {
      try { onMirrorStart?.(); } catch {}
      try { onMirrorUpdate?.(state); } catch {}
    }

    const repeatMax = getRepeatMax();
    const repCounts = new Map<string, number>();
    let repeatHits = 0;
    // Load persisted anti-loop entries (decayed) with a conservative half-life
    const persistedDecayed = decayEntries(readPersistedAvoid(), 7);
    const persistedMap = new Map<string, number>();
    for (const e of persistedDecayed) {
      const key = `${(e.hi>>>0)}:${(e.lo>>>0)}`;
      const w = Math.max(0, Math.floor(e.weight));
      if (w > 0) persistedMap.set(key, Math.max(w, persistedMap.get(key) ?? 0));
    }

    const ac = new AbortController();
    abortRef.current = ac;
    // Track first-seen per-IA configured depths for this game (to display L vs D)
    let depthL: number | undefined;
    let depthD: number | undefined;
    // Snapshot start/book cfg for record-level telemetry
    const advSnapshotL: any = readAdvancedCfgByPlayer('L' as any);
    const gameSeed = (createdAt >>> 0);
    try {
      while (moves < pliesLimit) {
        try {
          const kNow = computeKey(state);
          const keyStrNow = `${(kNow.hi >>> 0)}:${(kNow.lo >>> 0)}`;
          const c = (repCounts.get(keyStrNow) ?? 0) + 1;
          repCounts.set(keyStrNow, c);
          if (c === repeatMax) repeatHits++;
          // Early stop on repetition limit reached: declare draw by repetition
          if (c >= repeatMax) {
            if (mirrorBoard) {
              try { onMirrorEnd?.(state); } catch {}
            }
            return {
              id,
              createdAt,
              version: 'pylos-infoia-v1',
              depth,
              timeMode,
              timeSeconds: timeMode === 'manual' ? timeSeconds : undefined,
              pliesLimit,
              moves,
              avgThinkMs: (moves > 0 ? totalThinkMs / moves : 0),
              totalThinkMs,
              winner: null,
              endedReason: 'repetition-limit',
              repeatMax,
              repeatHits,
              maxWorkersUsed,
              perMove,
              depthL: depthL ?? depth,
              depthD: depthD ?? depth,
              seed: gameSeed,
              startRandomFirstMove: !!advSnapshotL?.startRandomFirstMove,
              startSeed: Number.isFinite(advSnapshotL?.startSeed) ? Math.floor(advSnapshotL.startSeed) : undefined,
              bookEnabled: !!useBook,
            };
          }
        } catch {}
        setMoveIndex(moves + 1);
        // Build avoidKeys and weighted avoidList with positions at/above repetition threshold seen so far
        const avoidKeysArr = Array.from(repCounts.entries())
          .filter(([_, v]) => v >= repeatMax)
          .map(([k]) => {
            const [hiStr, loStr] = k.split(':');
            return { hi: Number(hiStr) >>> 0, lo: Number(loStr) >>> 0 };
          });
        // Per-player advanced settings (read once per move, used across computations)
        const adv = readAdvancedCfgByPlayer(state.currentPlayer as any);
        const basePenalty = getAvoidPenalty();
        const stepFactor = Math.max(0, Number((adv.avoidStepFactor ?? 0.5)));
        const step = Math.max(0, Math.floor(basePenalty * stepFactor));
        const dynamicAvoidList = Array.from(repCounts.entries())
          .filter(([_, v]) => v >= repeatMax)
          .map(([k, v]) => {
            const [hiStr, loStr] = k.split(':');
            const extra = Math.max(0, v - repeatMax);
            const weight = Math.max(0, Math.floor(basePenalty + step * extra));
            return { hi: Number(hiStr) >>> 0, lo: Number(loStr) >>> 0, weight };
          });
        // Persisted avoid list (low-weight) merged in
        const persistedAvoidList = Array.from(persistedMap.entries()).map(([k, w]) => {
          const [hiStr, loStr] = k.split(':');
          // Keep persisted weight small (e.g., 10) to avoid over-biasing
          const weight = Math.max(1, Math.min(20, Math.floor(w)));
          return { hi: Number(hiStr)>>>0, lo: Number(loStr)>>>0, weight };
        });
        const avoidList = [...dynamicAvoidList, ...persistedAvoidList];
        // Novelty bonus support: pass all seen keys so far; search will bonus moves leading to unseen keys
        const noveltyKeysArr = Array.from(repCounts.keys()).map((k) => {
          const [hiStr, loStr] = k.split(':');
          return { hi: Number(hiStr) >>> 0, lo: Number(loStr) >>> 0 };
        });
        // Decide diversification: activate when we already have positions at/above threshold
        const repetitionRisk = avoidKeysArr.length > 0;
        // Resolve per-player basic settings (depth/time) each move
        const depthForMove = Number.isFinite(adv.depth as any) ? Math.max(1, Math.min(20, Number(adv.depth))) : depth;
        if (state.currentPlayer === 'L' && depthL === undefined) depthL = depthForMove;
        if (state.currentPlayer === 'D' && depthD === undefined) depthD = depthForMove;
        const timeModeForMove: TimeMode = (adv.timeMode === 'auto' || adv.timeMode === 'manual') ? adv.timeMode as TimeMode : timeMode;
        const timeSecondsForMove = Number.isFinite(adv.timeSeconds as any) ? Math.max(0, Math.min(30, Number(adv.timeSeconds))) : timeSeconds;
        // Risk-sensitive time management: boost time budget when at repetition risk
        let timeBudgetEffective = timeModeForMove === 'manual' ? (Math.max(0, Math.min(30, timeSecondsForMove)) * 1000) : undefined;
        if ((adv.timeRiskEnabled ?? true) && typeof timeBudgetEffective === 'number') {
          let boost = 1;
          if (repetitionRisk) boost = 1.5;
          if (repeatHits >= 2) boost = 2.0; // stronger boost when repeated hits accumulate
          const maxCapMs = 30_000; // keep upper limit consistent with manual cap
          timeBudgetEffective = Math.min(Math.floor(timeBudgetEffective * boost), maxCapMs);
        }
        startProgress(timeBudgetEffective);
        // Seed based on game creation time and current move index for reproducibility
        const randSeed = (createdAt ^ moves) >>> 0;
        // Anti-stall parameters per player
        const anti = adv;
        const noveltyBonusVal = (typeof anti.noveltyBonus === 'number') ? anti.noveltyBonus! : 5;
        const rootTopKVal = (typeof anti.rootTopK === 'number') ? anti.rootTopK! : 3;
        // Diversification mode (per-player)
        // 'off' => no diversification
        // 'epsilon' => use fixed epsilon/tieDelta from player settings
        // 'adaptive' => use repetition-driven epsilon/tieDelta
        const epsilonAdaptive = Math.max(0, Math.min(0.4, 0.1 + 0.05 * repeatHits));
        const tieDeltaAdaptive = (repeatHits >= 2) ? 30 : 20;
        const diversifyMode = (anti.diversify === 'off' || anti.diversify === 'epsilon' || anti.diversify === 'adaptive') ? anti.diversify : 'adaptive';
        const epsilonFixed = Number.isFinite(anti.epsilon as any) ? Math.max(0, Math.min(1, Number(anti.epsilon))) : 0.1;
        const tieDeltaFixed = Number.isFinite(anti.tieDelta as any) ? Math.max(0, Math.min(100, Math.floor(Number(anti.tieDelta)))) : 20;
        const diversifyFinal = (diversifyMode === 'off')
          ? 'off'
          : (diversifyMode === 'epsilon')
            ? 'epsilon'
            : (repetitionRisk ? 'epsilon' : 'off');
        const epsilonFinal = (diversifyMode === 'epsilon') ? epsilonFixed : epsilonAdaptive;
        const tieDeltaFinal = (diversifyMode === 'epsilon') ? tieDeltaFixed : tieDeltaAdaptive;
        // Workers override per player
        const workersFinal = (anti.workers === 'auto' || Number.isFinite(anti.workers as any)) ? (anti.workers as any) : 'auto';
        // Resolve book URL based on current depth when enabled
        const difficulty = resolveDifficulty(depthForMove);
        const phase: 'aperturas' | 'medio' | 'cierres' = 'aperturas';
        const basePath = '/books';
        const bookUrl = `${basePath}/${difficulty}/${difficulty}_${phase}_book.json`;

        // Snapshot 'before' for telemetry
        const reservesLBefore = state.reserves.L;
        const reservesDBefore = state.reserves.D;
        const repBefore = (() => {
          try {
            const kNow2 = computeKey(state);
            const keyStr2 = `${(kNow2.hi>>>0)}:${(kNow2.lo>>>0)}`;
            const countNow = (repCounts.get(keyStr2) ?? 1); // c already incremented above
            return Math.max(0, countNow - 1);
          } catch { return 0; }
        })();

        const res = await getBestMove(state, {
          depth: depthForMove,
          timeMs: timeBudgetEffective,
          workers: workersFinal,
          signal: ac.signal,
          avoidKeys: avoidKeysArr,
          avoidPenalty: basePenalty,
          avoidList,
          noveltyKeys: noveltyKeysArr,
          noveltyBonus: noveltyBonusVal,
          rootTopK: rootTopKVal,
          rootJitter: anti.rootJitter,
          rootJitterProb: anti.rootJitterProb,
          rootLMR: anti.rootLMR,
          drawBias: anti.drawBias,
          diversify: diversifyFinal,
          epsilon: epsilonFinal,
          tieDelta: tieDeltaFinal,
          randSeed,
          // Pass minimal cfg so the AI can use opening book when enabled
          cfg: {
            bookEnabled: (typeof anti.bookEnabled === 'boolean') ? !!anti.bookEnabled : !!useBook,
            bookUrl,
            flags: {
              bitboardsEnabled: (typeof adv.bitboardsEnabled === 'boolean') ? !!adv.bitboardsEnabled : undefined,
            },
            start: {
              randomFirstMove: adv.startRandomFirstMove,
              seed: typeof adv.startSeed === 'number' ? adv.startSeed : undefined,
            },
          },
        });
        stopProgress();
        totalThinkMs += res.elapsedMs || 0;
        try {
          const uw = (res as any).usedWorkers;
          if (typeof uw === 'number' && uw > 0) {
            if (uw > maxWorkersUsed) maxWorkersUsed = uw;
          }
        } catch {}
        // Build per-move telemetry (pre/apply)
        const kBefore = computeKey(state);
        const sig = res.move ? makeSignature(res.move as AIMove) : undefined;
        const pmBase: InfoIAPerMove = {
          elapsedMs: res.elapsedMs,
          depthReached: res.depthReached,
          nodes: res.nodes,
          nps: res.nps,
          score: res.score,
          keyHi: (kBefore.hi >>> 0),
          keyLo: (kBefore.lo >>> 0),
          moveSig: sig,
          workersUsed: (res as any).usedWorkers,
          player: state.currentPlayer,
          source: (res as any).source as ('book' | 'start' | 'search' | undefined),
          reservesLBefore,
          reservesDBefore,
          repCountBefore: repBefore,
          depthTarget: depthForMove,
          timeBudgetMs: timeBudgetEffective,
          diversify: diversifyFinal,
          rootTopKUsed: rootTopKVal,
          rootJitterUsed: !!anti.rootJitter,
          rootLMRUsed: !!anti.rootLMR,
          epsilonUsed: epsilonFinal,
          tieDeltaUsed: tieDeltaFinal,
          bitboardsUsed: (typeof adv.bitboardsEnabled === 'boolean') ? !!adv.bitboardsEnabled : undefined,
        };
        if (!res.move) break;
        // Detect progress: if the move has recoveries, consider it progress and reset counter
        try {
          const mv = res.move as AIMove;
          const recs = (mv as any)?.recovers;
          const hadProgress = Array.isArray(recs) && recs.length > 0;
          noProgressPlies = hadProgress ? 0 : (noProgressPlies + 1);
          if (Array.isArray(recs)) {
            (pmBase as any).recoveredThisMove = recs.length;
          }
        } catch {}
        state = applyAIRunner(state, res.move as AIMove);
        // After applying the move, persist the new state's key for repetition DB
        try { recordStateKey(computeKey(state)); } catch {}
        // After apply: reserves/phase
        try {
          (pmBase as any).reservesLAfter = state.reserves.L;
          (pmBase as any).reservesDAfter = state.reserves.D;
          (pmBase as any).phaseAfter = (state.phase === 'recover' ? 'recover' : 'play');
        } catch {}
        perMove.push(pmBase);
        if (mirrorBoard) {
          try { onMirrorUpdate?.(state); } catch {}
        }
        moves++;
        // Check no-progress termination
        if (noProgressPlies >= (adv.noProgressLimit ?? noProgressLimit)) {
          if (mirrorBoard) {
            try { onMirrorEnd?.(state); } catch {}
          }
          // Persist anti-loop on no-progress
          try {
            const existing = readPersistedAvoid();
            const now = Date.now();
            const byKey = new Map<string, PersistEntry>();
            for (const e of existing) byKey.set(`${(e.hi>>>0)}:${(e.lo>>>0)}`, e);
            const award = 20; // base weight for repetition-limit keys
            for (const [k, v] of repCounts.entries()) {
              if (v >= repeatMax) {
                const [hiStr, loStr] = k.split(':');
                const hi = Number(hiStr)>>>0; const lo = Number(loStr)>>>0;
                const prev = byKey.get(k);
                const nextW = Math.min(100, Math.floor((prev?.weight ?? 0) + award));
                byKey.set(k, { hi, lo, weight: nextW, ts: now });
              }
            }
            if (adv.persistAntiLoopsEnabled ?? true) {
              writePersistedAvoid(Array.from(byKey.values()), adv.persistCap ?? 300);
            }
          } catch {}
          return {
            id,
            createdAt,
            version: 'pylos-infoia-v1',
            depth,
            timeMode,
            timeSeconds: timeMode === 'manual' ? timeSeconds : undefined,
            pliesLimit,
            moves,
            avgThinkMs: (moves > 0 ? totalThinkMs / moves : 0),
            totalThinkMs,
            winner: null,
            endedReason: 'repetition-limit',
            repeatMax,
            repeatHits,
            maxWorkersUsed,
            perMove,
            depthL: depthL !== undefined ? depthL : depth,
            depthD: depthD !== undefined ? depthD : depth,
            seed: gameSeed,
            startRandomFirstMove: !!advSnapshotL?.startRandomFirstMove,
            startSeed: Number.isFinite(advSnapshotL?.startSeed) ? Math.floor(advSnapshotL.startSeed) : undefined,
            bookEnabled: !!useBook,
          };
        }
        const over = checkGameOver(state);
        if (over.over) {
          if (mirrorBoard) {
          }
          return {
            id,
            createdAt,
            version: 'pylos-infoia-v1',
            depth,
            timeMode,
            timeSeconds: timeMode === 'manual' ? timeSeconds : undefined,
            pliesLimit,
            moves,
            avgThinkMs: (moves > 0 ? totalThinkMs / moves : 0),
            totalThinkMs,
            winner: over.winner ?? null,
            endedReason: over.reason,
            repeatMax,
            repeatHits,
            maxWorkersUsed,
            perMove,
            depthL: depthL ?? depth,
            depthD: depthD ?? depth,
            seed: gameSeed,
            startRandomFirstMove: !!advSnapshotL?.startRandomFirstMove,
            startSeed: Number.isFinite(advSnapshotL?.startSeed) ? Math.floor(advSnapshotL.startSeed) : undefined,
            bookEnabled: !!useBook,
          };
        }
      }
    } finally {
      abortRef.current = null;
      stopProgress();
    }

    const over = checkGameOver(state);
    if (mirrorBoard) {
      try { onMirrorEnd?.(state); } catch {}
    }
    return {
      id,
      createdAt,
      version: 'pylos-infoia-v1',
      depth,
      timeMode,
      timeSeconds: timeMode === 'manual' ? timeSeconds : undefined,
      pliesLimit,
      moves,
      avgThinkMs: (moves > 0 ? totalThinkMs / moves : 0),
      totalThinkMs,
      winner: over.winner ?? null,
      endedReason: over.reason,
      repeatMax,
      repeatHits,
      maxWorkersUsed,
      perMove,
      depthL: depthL ?? depth,
      depthD: depthD ?? depth,
      seed: gameSeed,
      startRandomFirstMove: !!advSnapshotL?.startRandomFirstMove,
      startSeed: Number.isFinite(advSnapshotL?.startSeed) ? Math.floor(advSnapshotL.startSeed) : undefined,
      bookEnabled: !!useBook,
    };
  }, [depth, pliesLimit, timeMode, timeSeconds, mirrorBoard, onMirrorEnd, onMirrorStart, onMirrorUpdate, startProgress, stopProgress]);

  const start = useCallback(async (opts: { onGame: (rec: InfoIAGameRecord) => Promise<void> | void }) => {
    if (running) return;
    setRunning(true);
    try {
      for (let i = 0; i < gamesCount; i++) {
        const rec = await runOneGame();
        await opts.onGame(rec);
      }
    } finally {
      setRunning(false);
    }
  }, [gamesCount, runOneGame, running]);

  const stop = useCallback(() => {
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    setRunning(false);
    stopProgress();
  }, [stopProgress]);

  return {
    running,
    start,
    stop,
    moveIndex,
    moveElapsedMs,
    moveTargetMs,
  } as const;
}
