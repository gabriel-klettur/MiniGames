import { useCallback, useEffect, useRef, useState } from 'react';
import { initialState } from '../../../../game/rules';
import type { AIMove } from '../../../../ia/moves';
import { computeKey } from '../../../../ia/zobrist';
import { makeSignature } from '../../../../ia/signature';
import type { GameState } from '../../../../game/types';
import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';
import { makeId } from '../../../../utils/infoiaDb';
import { getBestMove, apply as applyAIRunner, checkGameOver } from '../services/aiRunner';
import { useProgress } from './useProgress';
import { useRepetitionLimit } from './useRepetitionLimit';
import type { TimeMode } from '../types';

export type UseInfoIASimParams = {
  depth: number;
  timeMode: TimeMode;
  timeSeconds: number;
  pliesLimit: number;
  gamesCount: number;
  mirrorBoard: boolean;
  onMirrorStart?: () => void;
  onMirrorUpdate?: (s: GameState) => void;
  onMirrorEnd?: (s: GameState) => void;
};

export function useInfoIASim(params: UseInfoIASimParams) {
  const { depth, timeMode, timeSeconds, pliesLimit, gamesCount, mirrorBoard, onMirrorStart, onMirrorUpdate, onMirrorEnd } = params;

  const [running, setRunning] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);
  const { elapsedMs: moveElapsedMs, targetMs: moveTargetMs, start: startProgress, stop: stopProgress } = useProgress();
  const [moveIndex, setMoveIndex] = useState<number>(0);

  const timeMs = useRef<number | undefined>(undefined);
  timeMs.current = timeMode === 'manual' ? Math.max(0, Math.min(30, timeSeconds)) * 1000 : undefined;
  const { getRepeatMax } = useRepetitionLimit();

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
    let moves = 0;
    let totalThinkMs = 0;
    let maxWorkersUsed = 1;
    const perMove: { elapsedMs: number; depthReached?: number; nodes?: number; nps?: number; score?: number; keyHi?: number; keyLo?: number; moveSig?: number; workersUsed?: number }[] = [];

    if (mirrorBoard) {
      try { onMirrorStart?.(); } catch {}
      try { onMirrorUpdate?.(state); } catch {}
    }

    const repeatMax = getRepeatMax();
    const repCounts = new Map<string, number>();
    let repeatHits = 0;

    const ac = new AbortController();
    abortRef.current = ac;
    try {
      while (moves < pliesLimit) {
        try {
          const kNow = computeKey(state);
          const keyStrNow = `${(kNow.hi >>> 0)}:${(kNow.lo >>> 0)}`;
          const c = (repCounts.get(keyStrNow) ?? 0) + 1;
          repCounts.set(keyStrNow, c);
          if (c === repeatMax) repeatHits++;
        } catch {}
        setMoveIndex(moves + 1);
        startProgress(timeMs.current);
        const res = await getBestMove(state, {
          depth,
          timeMs: timeMs.current,
          workers: 'auto',
          signal: ac.signal,
        });
        stopProgress();
        totalThinkMs += res.elapsedMs || 0;
        try {
          const uw = (res as any).usedWorkers;
          if (typeof uw === 'number' && uw > 0) {
            if (uw > maxWorkersUsed) maxWorkersUsed = uw;
          }
        } catch {}
        try {
          const k = computeKey(state);
          const sig = res.move ? makeSignature(res.move as AIMove) : undefined;
          perMove.push({
            elapsedMs: res.elapsedMs,
            depthReached: res.depthReached,
            nodes: res.nodes,
            nps: res.nps,
            score: res.score,
            keyHi: (k.hi >>> 0),
            keyLo: (k.lo >>> 0),
            moveSig: sig,
            workersUsed: (res as any).usedWorkers,
          });
        } catch {
          perMove.push({
            elapsedMs: res.elapsedMs,
            depthReached: res.depthReached,
            nodes: res.nodes,
            nps: res.nps,
            score: res.score,
            workersUsed: (res as any).usedWorkers,
          });
        }
        if (!res.move) break;
        state = applyAIRunner(state, res.move as AIMove);
        if (mirrorBoard) {
          try { onMirrorUpdate?.(state); } catch {}
        }
        moves++;
        const over = checkGameOver(state);
        if (over.over) {
          const avgThinkMs = moves > 0 ? totalThinkMs / moves : 0;
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
            avgThinkMs,
            totalThinkMs,
            winner: over.winner ?? null,
            endedReason: over.reason,
            repeatMax,
            repeatHits,
            maxWorkersUsed,
            perMove,
          };
        }
      }
    } finally {
      abortRef.current = null;
      stopProgress();
    }

    const over = checkGameOver(state);
    const avgThinkMs = moves > 0 ? totalThinkMs / moves : 0;
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
      avgThinkMs,
      totalThinkMs,
      winner: over.winner ?? null,
      endedReason: over.reason,
      repeatMax,
      repeatHits,
      maxWorkersUsed,
      perMove,
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
