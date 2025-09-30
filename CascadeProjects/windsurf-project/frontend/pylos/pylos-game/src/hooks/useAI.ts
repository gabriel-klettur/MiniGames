import { useEffect, useRef, useState } from 'react';
import type { GameState, Position } from '../game/types';
import { posKey } from '../game/board';
import { placeFromReserve, selectMoveSource, movePiece as rulesMovePiece, recoverPiece, finishRecovery } from '../game/rules';
import type { AIMove } from '../ia/moves';
import { computeBestMoveAsync } from '../ia';
import { computeKey } from '../ia/zobrist';
import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';
import type { MoveEntry } from './usePersistence';
import type { FlyingPieceState } from './useAnimations';
type Rect = { left: number; top: number; width: number; height: number };
export interface UseAIParams {
  state: GameState;
  iaDepth: number;
  iaTimeMode: 'auto' | 'manual';
  iaTimeSeconds: number;
  iaConfig?: {
    // Search/eval knobs
    quiescence: boolean;
    qDepthMax: number; // 0..4
    qNodeCap: number; // 1..128
    futilityMargin: number; // 0..1000

    // Book
    bookEnabled: boolean;
    bookMode?: 'auto' | 'manual';
    bookPhase?: 'aperturas' | 'medio' | 'cierres';
    bookBasePath?: string;
    bookUrl?: string;

    // Performance/flags
    precomputedSupports?: boolean;
    precomputedCenter?: boolean;
    pvsEnabled?: boolean;
    aspirationEnabled?: boolean;
    ttEnabled?: boolean;

    // Repetition/avoid
    avoidRepeats?: boolean;
    repeatMax?: number;
    avoidPenalty?: number;

    // Start behavior
    startRandomFirstMove?: boolean;
    startSeed?: number | null;

    // Anti-stall (root-level tuning)
    noveltyBonus?: number;
    rootTopK?: number;
    rootJitter?: boolean;
    rootJitterProb?: number;
    rootLMR?: boolean;
    drawBias?: number;
  };

  // Environment flags and refs
  vsAI: null | { enemy: 'L' | 'D'; depth: number };
  atPresent: boolean; // redo.length === 0
  gameOver: string | undefined;
  flying: FlyingPieceState | null;
  autoRunningRef: React.MutableRefObject<boolean>;
  reserveLightRef: React.MutableRefObject<HTMLSpanElement | null>;
  reserveDarkRef: React.MutableRefObject<HTMLSpanElement | null>;
  redoingRef: React.MutableRefObject<boolean>;

  // Animation and state application helpers
  setPendingState: React.Dispatch<React.SetStateAction<GameState | null>>;
  setPendingLog: React.Dispatch<React.SetStateAction<MoveEntry | null>>;
  pendingApplyRef: React.MutableRefObject<{ pushHistory: boolean; clearRedo: boolean }>;
  setFlying: React.Dispatch<React.SetStateAction<FlyingPieceState | null>>;
  setAppearKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
  updateAndCheck: (nextState: GameState, pushHistory?: boolean, clearRedo?: boolean, logEntry?: MoveEntry) => void;
  // Optional: provide past states to compute repetition counts (for IA repetition avoidance)
  historyStates?: GameState[];
}

export interface UseAIResult {
  iaBusy: boolean;
  aiDisabled: boolean;
  iaAutoplay: boolean;
  setIaAutoplay: React.Dispatch<React.SetStateAction<boolean>>;
  iaProgress: { depth: number; score: number } | null;
  iaEval: number | null;
  iaDepthReached: number | null;
  iaPV: AIMove[];
  iaRootMoves: Array<{ move: AIMove; score: number }>;
  iaNodes: number;
  iaElapsedMs: number;
  iaNps: number;
  iaRootPlayer: 'L' | 'D' | null;
  onAIMove: () => Promise<void>;
}

/**
 * Centraliza el pensamiento de la IA, métricas y auto-juego.
 * Preserva el comportamiento original de App.tsx.
 */
export function useAI(params: UseAIParams): UseAIResult {
  const {
    state,
    iaDepth,
    iaTimeMode,
    iaTimeSeconds,
    iaConfig,
    vsAI,
    atPresent,
    gameOver,
    flying,
    autoRunningRef,
    reserveLightRef,
    reserveDarkRef,
    redoingRef,
    setPendingState,
    setPendingLog,
    pendingApplyRef,
    setFlying,
    setAppearKeys,
    updateAndCheck,
    historyStates,
  } = params;

  const iaAutoTimerRef = useRef<number | null>(null);
  const [iaAutoplay, setIaAutoplay] = useState<boolean>(false);

  const [iaBusy, setIaBusy] = useState<boolean>(false);
  const [iaProgress, setIaProgress] = useState<{ depth: number; score: number } | null>(null);
  const [iaEval, setIaEval] = useState<number | null>(null);
  const [iaDepthReached, setIaDepthReached] = useState<number | null>(null);
  const [iaPV, setIaPV] = useState<AIMove[]>([]);
  const [iaRootMoves, setIaRootMoves] = useState<Array<{ move: AIMove; score: number }>>([]);
  const [iaNodes, setIaNodes] = useState<number>(0);
  const [iaElapsedMs, setIaElapsedMs] = useState<number>(0);
  const [iaNps, setIaNps] = useState<number>(0);
  const [iaRootPlayer, setIaRootPlayer] = useState<'L' | 'D' | null>(null);
  const iaAbortRef = useRef<AbortController | null>(null);
  // Queue of AI recover animations to run AFTER the main move animation completes
  // We store pre-measured rects to allow removing from the board before animating
  const recoverQueueRef = useRef<{ items: Array<{ srcKey: string; from?: Rect; to?: Rect; imgSrc: string }> } | null>(null);
  // Delay timer between removing a piece and starting its flying animation
  const recoverDelayTimerRef = useRef<number | null>(null);

  // Disable AI when navigating the past or during animations, etc.
  const aiDisabled = !!gameOver || state.phase === 'recover' || !!flying || autoRunningRef.current || (!!vsAI && !atPresent);

  const onAIMove = async () => {
    if (aiDisabled || iaBusy) return;
    setIaBusy(true);
    setIaProgress(null);
    setIaEval(null);
    setIaDepthReached(null);
    setIaPV([]);
    setIaRootMoves([]);
    setIaNodes(0);
    setIaElapsedMs(0);
    setIaNps(0);
    // Capture the AI's player at the moment thinking starts to avoid races
    const aiPlayer: 'L' | 'D' = state.currentPlayer;
    setIaRootPlayer(aiPlayer);
    const ac = new AbortController();
    iaAbortRef.current = ac;
    try {
      // Resolve time budget
      const timeMs = iaTimeMode === 'auto' ? undefined : Math.max(0, Math.min(30, iaTimeSeconds)) * 1000;
      // Build repetition-avoidance keys from history if enabled
      let avoidKeys: Array<{ hi: number; lo: number }> | undefined = undefined;
      const avoidEnabled = iaConfig?.avoidRepeats ?? true;
      const repeatMax = Math.max(1, Math.min(10, Math.floor(iaConfig?.repeatMax ?? 3)));
      if (avoidEnabled && historyStates && historyStates.length > 0) {
        const counts = new Map<string, { hi: number; lo: number; c: number }>();
        for (const s of historyStates) {
          const k = computeKey(s);
          const keyStr = `${(k.hi >>> 0)}:${(k.lo >>> 0)}`;
          const prev = counts.get(keyStr) ?? { hi: (k.hi >>> 0), lo: (k.lo >>> 0), c: 0 };
          prev.c += 1;
          counts.set(keyStr, prev);
        }
        // Include current position as well
        const curK = computeKey(state);
        const curStr = `${(curK.hi >>> 0)}:${(curK.lo >>> 0)}`;
        const curPrev = counts.get(curStr) ?? { hi: (curK.hi >>> 0), lo: (curK.lo >>> 0), c: 0 };
        curPrev.c += 1;
        counts.set(curStr, curPrev);
        avoidKeys = [];
        for (const v of counts.values()) {
          if (v.c >= repeatMax) avoidKeys.push({ hi: v.hi, lo: v.lo });
        }
        if (avoidKeys.length === 0) avoidKeys = undefined;
      }
      // Resolve effective book URL
      const resolveDifficulty = (d: number): 'facil' | 'medio' | 'dificil' => {
        if (d <= 3) return 'facil';
        if (d <= 7) return 'medio';
        return 'dificil';
      };
      const mode = iaConfig?.bookMode ?? 'auto';
      const phase = iaConfig?.bookPhase ?? 'aperturas';
      const basePathRaw = iaConfig?.bookBasePath ?? '/books';
      const basePath = basePathRaw.endsWith('/') ? basePathRaw.slice(0, -1) : basePathRaw;
      const difficulty = resolveDifficulty(iaDepth);
      const autoUrl = `${basePath}/${difficulty}/${difficulty}_${phase}_book.json`;
      const effectiveBookUrl = mode === 'manual' ? (iaConfig?.bookUrl || '/aperturas_book.json') : autoUrl;

      const res = await computeBestMoveAsync(state, {
        depth: iaDepth,
        timeMs,
        workers: 'auto',
        signal: ac.signal,
        avoidKeys,
        avoidPenalty: Math.max(0, Math.min(500, Math.floor(iaConfig?.avoidPenalty ?? 50))),
        // Anti-stall tuning from IAPanel advanced config (optional)
        noveltyBonus: (typeof iaConfig?.noveltyBonus === 'number') ? Math.max(0, Math.floor(iaConfig!.noveltyBonus as number)) : undefined,
        rootTopK: (typeof iaConfig?.rootTopK === 'number') ? Math.max(2, Math.min(8, Math.floor(iaConfig!.rootTopK as number))) : undefined,
        rootJitter: (typeof iaConfig?.rootJitter === 'boolean') ? !!iaConfig!.rootJitter : undefined,
        rootJitterProb: (typeof iaConfig?.rootJitterProb === 'number') ? Math.max(0, Math.min(1, Number(iaConfig!.rootJitterProb))) : undefined,
        rootLMR: (typeof iaConfig?.rootLMR === 'boolean') ? !!iaConfig!.rootLMR : undefined,
        drawBias: (typeof iaConfig?.drawBias === 'number') ? Math.max(0, Math.floor(iaConfig!.drawBias as number)) : undefined,
        onProgress: (info) => setIaProgress(info),
        cfg: {
          search: {
            quiescence: iaConfig?.quiescence ?? true,
            qDepthMax: iaConfig?.qDepthMax ?? 2,
            qNodeCap: iaConfig?.qNodeCap ?? 24,
            futilityMargin: iaConfig?.futilityMargin ?? 100,
          },
          bookEnabled: iaConfig?.bookEnabled ?? false,
          bookUrl: effectiveBookUrl,
          flags: {
            precomputedSupports: iaConfig?.precomputedSupports ?? true,
            precomputedCenter: iaConfig?.precomputedCenter ?? true,
            pvsEnabled: iaConfig?.pvsEnabled ?? true,
            aspirationEnabled: iaConfig?.aspirationEnabled ?? true,
            ttEnabled: iaConfig?.ttEnabled ?? true,
          },
          start: {
            randomFirstMove: iaConfig?.startRandomFirstMove ?? true,
            seed: (typeof iaConfig?.startSeed === 'number') ? Math.floor(iaConfig!.startSeed as number) : undefined,
          },
        },
      });
      // Save metrics and PV for visualization ALWAYS
      setIaEval(res.score);
      setIaDepthReached(res.depthReached);
      setIaPV(res.pv);
      setIaRootMoves(res.rootMoves);
      setIaNodes(res.nodes);
      setIaElapsedMs(res.elapsedMs);
      setIaNps(res.nps);
      if (res.move) {
        if (res.move.kind === 'place') {
          const dest = res.move.dest;
          const key = posKey(dest);
          const originEl = aiPlayer === 'L' ? reserveLightRef.current : reserveDarkRef.current;
          const originRect = originEl?.getBoundingClientRect();
          const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
          const destRect = destBtn?.getBoundingClientRect();
          const imgSrc = aiPlayer === 'L' ? bolaB : bolaA;
          // Compute state after base placement only (phase may enter 'recover')
          const placedRes = placeFromReserve(state, dest);
          const nextState = placedRes.state;
          // Enqueue recover animations (if any) to run after main animation ends
          const recs = (res.move as any)?.recovers as Position[] | undefined;
          if (Array.isArray(recs) && recs.length > 0) {
            const items: Array<{ srcKey: string; from?: Rect; to?: Rect; imgSrc: string }> = [];
            for (const pos of recs) {
              const sKey = posKey(pos);
              const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${sKey}"]`);
              const sRect = srcBtn?.getBoundingClientRect();
              const destEl = (aiPlayer === 'L') ? reserveLightRef.current : reserveDarkRef.current;
              const dRect = destEl?.getBoundingClientRect();
              items.push({
                srcKey: sKey,
                from: sRect ? { left: sRect.left, top: sRect.top, width: sRect.width, height: sRect.height } : undefined,
                to: dRect ? { left: dRect.left, top: dRect.top, width: dRect.width, height: dRect.height } : undefined,
                imgSrc,
              });
            }
            recoverQueueRef.current = items.length ? { items } : null;
          } else {
            recoverQueueRef.current = null;
          }
          if (originRect && destRect) {
            const from = { left: originRect.left, top: originRect.top, width: originRect.width, height: originRect.height };
            const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
            setPendingState(nextState);
            setPendingLog({ player: aiPlayer, source: 'IA', text: `colocar ${key}` });
            pendingApplyRef.current = { pushHistory: true, clearRedo: true };
            setFlying({ from, to, imgSrc, destKey: key });
          } else {
            setAppearKeys(new Set([key]));
            updateAndCheck(nextState, true, true, { player: aiPlayer, source: 'IA', text: `colocar ${key}` });
          }
        } else if (res.move.kind === 'lift') {
          const srcKey = posKey(res.move.src);
          const destKey = posKey(res.move.dest);
          const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${srcKey}"]`);
          const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${destKey}"]`);
          const srcRect = srcBtn?.getBoundingClientRect();
          const destRect = destBtn?.getBoundingClientRect();
          const imgSrc = aiPlayer === 'L' ? bolaB : bolaA;
          // Compute state after base lift only: select source then move
          const sel = selectMoveSource(state, res.move.src);
          const moved = rulesMovePiece(sel.state, res.move.dest);
          const nextState = moved.state;
          // Enqueue recover animations (if any)
          const recs = (res.move as any)?.recovers as Position[] | undefined;
          if (Array.isArray(recs) && recs.length > 0) {
            const items: Array<{ srcKey: string; from: Rect; to: Rect; imgSrc: string }> = [];
            for (const pos of recs) {
              const sKey = posKey(pos);
              const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${sKey}"]`);
              const sRect = srcBtn?.getBoundingClientRect();
              const destEl = (aiPlayer === 'L') ? reserveLightRef.current : reserveDarkRef.current;
              const dRect = destEl?.getBoundingClientRect();
              if (sRect && dRect) {
                items.push({ srcKey: sKey, from: { left: sRect.left, top: sRect.top, width: sRect.width, height: sRect.height }, to: { left: dRect.left, top: dRect.top, width: dRect.width, height: dRect.height }, imgSrc });
              }
            }
            recoverQueueRef.current = items.length ? { items } : null;
          } else {
            recoverQueueRef.current = null;
          }
          if (srcRect && destRect) {
            const from = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
            const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
            setPendingState(nextState);
            setPendingLog({ player: aiPlayer, source: 'IA', text: `subir ${srcKey} -> ${destKey}` });
            pendingApplyRef.current = { pushHistory: true, clearRedo: true };
            setFlying({ from, to, imgSrc, destKey, srcKey });
          } else {
            setAppearKeys(new Set([destKey]));
            updateAndCheck(nextState, true, true, { player: aiPlayer, source: 'IA', text: `subir ${srcKey} -> ${destKey}` });
          }
        }
      }
    } catch (err) {
      // Ignore AbortError or transient errors
    } finally {
      iaAbortRef.current = null;
      setIaBusy(false);
      setIaProgress(null);
    }
  };

  // Cancel AI search if unmounting
  useEffect(() => {
    return () => {
      if (iaAbortRef.current) iaAbortRef.current.abort();
      if (recoverDelayTimerRef.current !== null) {
        clearTimeout(recoverDelayTimerRef.current);
        recoverDelayTimerRef.current = null;
      }
    };
  }, []);

  // After main move animation completes (flying becomes null), play queued recover animations one by one,
  // removing a piece first (update board via rules.recoverPiece) and then starting its flight ~100ms later.
  useEffect(() => {
    if (flying) return; // wait until no animation in progress
    const q = recoverQueueRef.current;
    if (!q || q.items.length === 0) {
      // No more queued recoveries: if still in recover phase, finish it automatically
      if (state.phase === 'recover' && recoverDelayTimerRef.current === null) {
        const fin = finishRecovery(state);
        if (!fin.error) {
          updateAndCheck(fin.state, true, true, { player: state.currentPlayer, source: 'IA', text: 'fin recuperar' });
        }
      }
      return;
    }
    // Avoid scheduling multiple timers simultaneously
    if (recoverDelayTimerRef.current !== null) return;
    // Try to schedule the next available recovery.
    // If measurement fails for a position, skip it and try the next to avoid stalling.
    while (q.items.length > 0) {
      const item = q.items.shift()!;
      // 1) Remove the piece from the board via rules.recoverPiece (AI player is current in recover phase)
      const [lvl, row, col] = item.srcKey.split('-').map((n) => parseInt(n, 10));
      const pos = { level: lvl, row, col } as Position;
      const recRes = recoverPiece(state, pos);
      if (recRes.error) {
        // Skip this item if invalid now (e.g., became non-free); try next to avoid stalling
        continue;
      }
      // Apply the removal immediately (adds to reserves and updates phase/recovery counters)
      updateAndCheck(recRes.state, true, true, { player: recRes.state.recovery?.player ?? state.currentPlayer, source: 'IA', text: `recuperar ${item.srcKey}` });
      // 2) Start the flying animation (if we have rects) a short while after the board reflects the removal
      if (item.from && item.to) {
        recoverDelayTimerRef.current = window.setTimeout(() => {
          setFlying({ from: item.from!, to: item.to!, imgSrc: item.imgSrc, destKey: '' });
          // Clear timer ref; the next recovery will be scheduled when `flying` becomes null again
          if (recoverDelayTimerRef.current !== null) {
            clearTimeout(recoverDelayTimerRef.current);
            recoverDelayTimerRef.current = null;
          }
        }, 100);
        break;
      } else {
        // No animation possible: continue to next item in the same tick
        continue;
      }
    }
    // If no more items remain, clear the queue
    if (!q.items.length) recoverQueueRef.current = null;
  }, [flying, state, reserveLightRef, reserveDarkRef, setFlying]);

  // Vs AI: if it's enemy's turn, let AI move automatically (unless manual autoplay is active)
  useEffect(() => {
    if (!vsAI) return;
    if (iaAutoplay) return;
    if (!atPresent) return;
    if (redoingRef.current) return;
    if (gameOver) return;
    if (iaBusy) return;
    if (aiDisabled) return;
    if (state.currentPlayer !== vsAI.enemy) return;
    const t = setTimeout(() => {
      void onAIMove();
    }, 50);
    return () => clearTimeout(t);
  }, [vsAI, atPresent, state.currentPlayer, iaBusy, aiDisabled, gameOver, iaAutoplay]);

  // IA autoplay manual: play every ~2s while active and conditions allow
  useEffect(() => {
    if (iaAutoTimerRef.current !== null) {
      clearTimeout(iaAutoTimerRef.current);
      iaAutoTimerRef.current = null;
    }
    if (!iaAutoplay) return;
    if (gameOver) {
      setIaAutoplay(false);
      return;
    }
    if (iaBusy || aiDisabled) return;
    iaAutoTimerRef.current = window.setTimeout(() => {
      if (!iaAutoplay || gameOver) return;
      if (iaBusy || aiDisabled) return;
      void onAIMove();
    }, 2000);
    return () => {
      if (iaAutoTimerRef.current !== null) {
        clearTimeout(iaAutoTimerRef.current);
        iaAutoTimerRef.current = null;
      }
    };
  }, [iaAutoplay, iaBusy, aiDisabled, gameOver, state.currentPlayer, flying]);

  return {
    iaBusy,
    aiDisabled,
    iaAutoplay,
    setIaAutoplay,
    iaProgress,
    iaEval,
    iaDepthReached,
    iaPV,
    iaRootMoves,
    iaNodes,
    iaElapsedMs,
    iaNps,
    iaRootPlayer,
    onAIMove,
  };
}

