import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { anyValidMoves, canMerge, mergeTowers, randomInitialTowers, findById, replaceAfterMerge, towersFromSymbols } from './rules';
import type { GameAction, GameState, Tower, SymbolType } from './types';

// Consola limpia: se removieron todos los logs de fusiones

function initialState(): GameState {
  const MIN_D_DEFAULT = 0.06;
  const t0 = randomInitialTowers();
  const t1 = resolveAllOverlaps(t0, MIN_D_DEFAULT);
  return {
    towers: t1,
    selectedId: null,
    currentPlayer: 1,
    lastMover: null,
    roundOver: false,
    gameOver: false,
    players: { 1: { stars: 0 }, 2: { stars: 0 } },
    mergeFx: null,
    mode: 'normal',
    pendingTurn: null,
    customSetup: { open: false, cells: Array(12).fill(null) },
    spawnFx: null,
  };
}

// -----------------------------
// Overlap resolution utilities
// -----------------------------
function distN(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function isFreeAtPos(towers: Tower[], id: string, pos: { x: number; y: number }, minD: number): boolean {
  for (const t of towers) {
    if (t.id === id) continue;
    if (distN(pos, t.pos) < minD) return false;
  }
  return true;
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function findNonOverlappingPosition(towers: Tower[], id: string, start: { x: number; y: number }, minD: number): { x: number; y: number } {
  // If current position is already free, keep it
  if (isFreeAtPos(towers, id, start, minD)) return start;
  // Spiral/ring search around start position
  const RINGS = 16;
  const STEPS_PER_RING = 24;
  for (let r = 1; r <= RINGS; r++) {
    const radius = r * minD; // grow by minD increments
    for (let k = 0; k < STEPS_PER_RING; k++) {
      const ang = (k / STEPS_PER_RING) * Math.PI * 2;
      const cand = { x: clamp01(start.x + radius * Math.cos(ang)), y: clamp01(start.y + radius * Math.sin(ang)) };
      if (isFreeAtPos(towers, id, cand, minD)) return cand;
    }
  }
  // Fallback: nudge away from nearest neighbor to reach minD
  let nearest: Tower | null = null;
  let bestD = Infinity;
  for (const t of towers) {
    if (t.id === id) continue;
    const d = distN(start, t.pos);
    if (d < bestD) { bestD = d; nearest = t; }
  }
  if (nearest && bestD > 0) {
    const ux = (start.x - nearest.pos.x) / bestD;
    const uy = (start.y - nearest.pos.y) / bestD;
    const cand = { x: clamp01(nearest.pos.x + ux * (minD + 1e-3)), y: clamp01(nearest.pos.y + uy * (minD + 1e-3)) };
    return cand;
  }
  return start;
}

function resolveAllOverlaps(towers: Tower[], minD: number, maxIters = 8): Tower[] {
  let arr = towers.slice();
  for (let iter = 0; iter < maxIters; iter++) {
    let changed = false;
    for (const t of arr) {
      const newPos = findNonOverlappingPosition(arr, t.id, t.pos, minD);
      if (newPos.x !== t.pos.x || newPos.y !== t.pos.y) {
        arr = arr.map(tt => (tt.id === t.id ? { ...tt, pos: newPos } : tt));
        changed = true;
      }
    }
    if (!changed) break;
  }
  return arr;
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'select': {
      if (state.roundOver || state.gameOver) return state;
      // Block selection during merge flight in normal mode
      if (state.mode !== 'simulation' && state.mergeFx) return state;
      const exists = !!findById(state.towers, action.id);
      if (!exists) return state;
      return { ...state, selectedId: action.id === state.selectedId ? null : action.id };
    }
    case 'attempt-merge': {
      if (state.roundOver || state.gameOver) return state;
      // Block new merges during merge flight in normal mode
      if (state.mode !== 'simulation' && state.mergeFx) return state;
      const sourceId = action.sourceId;
      if (!sourceId) return state;
      if (sourceId === action.targetId) return { ...state, selectedId: null };

      const source = findById(state.towers, sourceId);
      const target = findById(state.towers, action.targetId);
      if (!source || !target) return state;

      if (!canMerge(source, target)) {
        // no válido: mantenemos selección para intentar de nuevo (sin logs)
        return { ...state };
      }

      const merged: Tower = mergeTowers(source, target);
      let towersAfter = replaceAfterMerge(state.towers, source.id, target.id, merged);
      // After merging, resolve overlaps globally to ensure no tokens remain overlapped
      const MIN_D_AFTER_MERGE = 0.08; // slightly larger spacing after merges
      towersAfter = resolveAllOverlaps(towersAfter, MIN_D_AFTER_MERGE);

      // Debug/Telemetry: eliminados logs de consola

      // Comprobamos si el siguiente jugador tiene jugadas válidas
      const nextPlayer: 1 | 2 = state.currentPlayer === 1 ? 2 : 1;
      const nextHasMoves = anyValidMoves(towersAfter);

      if (!nextHasMoves) {
        const winner = state.currentPlayer;
        const newStars = state.players[winner].stars + 1;
        const playersAfter = {
          ...state.players,
          [winner]: { stars: newStars },
        } as GameState['players'];
        const gameOverAfter = newStars >= 4;
        // In simulation mode, skip animation and commit immediately
        if (state.mode === 'simulation') {
          return {
            ...state,
            towers: towersAfter,
            selectedId: null,
            lastMover: winner,
            roundOver: true,
            players: playersAfter,
            gameOver: gameOverAfter,
            mergeFx: null,
            pendingTurn: null,
          };
        }
        // Normal mode: defer commit until animation ends
        return {
          ...state,
          selectedId: null,
          lastMover: state.lastMover, // will update on commit
          // keep pre-merge towers visible until flight ends
          mergeFx: {
            mergedId: merged.id,
            fromId: source.id,
            targetId: target.id,
            at: Date.now(),
            from: action.from ? { ...action.from } : { ...source.pos },
            to: action.to ? { ...action.to } : { ...target.pos },
            sourceStack: [...source.stack],
            fromPx: action.fromPx ? { ...action.fromPx } : undefined,
            toPx: action.toPx ? { ...action.toPx } : undefined,
            // deferred state
            towersAfter,
            playersAfter,
            roundOverAfter: true,
            gameOverAfter,
            lastMoverAfter: winner,
          },
          pendingTurn: null,
        };
      }

      // Next moves exist
      if (state.mode === 'simulation') {
        // Skip animation and switch turn immediately
        return {
          ...state,
          towers: towersAfter,
          selectedId: null,
          currentPlayer: nextPlayer,
          mergeFx: null,
          pendingTurn: null,
        };
      }
      // Normal mode: set pending turn and trigger animation, but defer commit
      return {
        ...state,
        selectedId: null,
        pendingTurn: nextPlayer,
        mergeFx: {
          mergedId: merged.id,
          fromId: source.id,
          targetId: target.id,
          at: Date.now(),
          from: action.from ? { ...action.from } : { ...source.pos },
          to: action.to ? { ...action.to } : { ...target.pos },
          sourceStack: [...source.stack],
          fromPx: action.fromPx ? { ...action.fromPx } : undefined,
          toPx: action.toPx ? { ...action.toPx } : undefined,
          // deferred state (no round end)
          towersAfter,
          playersAfter: state.players,
          roundOverAfter: false,
          gameOverAfter: state.gameOver,
          lastMoverAfter: state.lastMover,
        },
      };
    }
    case 'commit-merge': {
      if (state.mergeFx == null) return state;
      const fx = state.mergeFx;
      // Commit deferred state but keep mergeFx so the flight can linger a bit longer
      // Logs eliminados
      return {
        ...state,
        towers: fx.towersAfter,
        players: fx.playersAfter,
        roundOver: fx.roundOverAfter,
        gameOver: fx.gameOverAfter,
        lastMover: fx.lastMoverAfter,
        selectedId: null,
      };
    }
    case 'clear-merge-fx': {
      if (state.mergeFx == null) return state;
      // Apply pendingTurn (if any) when animation finishes (normal mode)
      const newPlayer = state.mergeFx.roundOverAfter ? state.currentPlayer : (state.pendingTurn ?? state.currentPlayer);
      // Logs eliminados
      return { ...state, mergeFx: null, currentPlayer: newPlayer, pendingTurn: null };
    }
    case 'resolve-overlaps': {
      if (state.roundOver || state.gameOver) return state;
      if (state.mode !== 'simulation' && state.mergeFx) return state;
      const tgt = findById(state.towers, action.id);
      if (!tgt) return state;
      const minD = action.minD != null ? action.minD : 0.06;
      const newPos = findNonOverlappingPosition(state.towers, tgt.id, tgt.pos, minD);
      if (newPos.x === tgt.pos.x && newPos.y === tgt.pos.y) return state;
      const towers = state.towers.map(t => (t.id === tgt.id ? { ...t, pos: newPos } : t));
      return { ...state, towers };
    }
    case 'resolve-all-overlaps': {
      if (state.roundOver || state.gameOver) return state;
      if (state.mode !== 'simulation' && state.mergeFx) return state;
      const minD = action.minD != null ? action.minD : 0.06;
      const towers = resolveAllOverlaps(state.towers, minD);
      return { ...state, towers };
    }
    case 'move-tower': {
      if (state.roundOver || state.gameOver) return state;
      if (state.mode !== 'simulation' && state.mergeFx) return state;
      const minD = action.minD;
      let desired = { x: action.pos.x, y: action.pos.y };
      if (typeof minD === 'number' && !Number.isNaN(minD)) {
        desired = findNonOverlappingPosition(state.towers, action.id, desired, Math.max(0, minD));
      }
      const towers = state.towers.map(t => (t.id === action.id ? { ...t, pos: desired } : t));
      return { ...state, towers };
    }
    case 'new-round': {
      if (!state.roundOver || state.gameOver) return state; // solo cuando terminó la ronda y NO el juego
      const starter: 1 | 2 = state.lastMover ? (state.lastMover === 1 ? 2 : 1) : 1;
      const MIN_D_DEFAULT = 0.06;
      const newTowers = resolveAllOverlaps(randomInitialTowers(), MIN_D_DEFAULT);
      return {
        ...state,
        towers: newTowers,
        selectedId: null,
        currentPlayer: starter,
        lastMover: null,
        roundOver: false,
        mergeFx: null,
        pendingTurn: null,
      };
    }
    case 'reset-game': {
      const MIN_D_DEFAULT = 0.06;
      const t0 = randomInitialTowers();
      const towers = resolveAllOverlaps(t0, MIN_D_DEFAULT);
      return {
        towers,
        selectedId: null,
        currentPlayer: 1,
        lastMover: null,
        roundOver: false,
        gameOver: false,
        players: { 1: { stars: 0 }, 2: { stars: 0 } },
        mergeFx: null,
        mode: 'normal',
        pendingTurn: null,
        customSetup: { open: false, cells: Array(12).fill(null) },
        spawnFx: { ids: towers.map(t => t.id), at: Date.now(), kind: 'random' },
      } as GameState;
    }
    // -----------------------------
    // Custom setup (NO Aleatoreo)
    // -----------------------------
    case 'enter-custom-setup': {
      // Clear board visually and open counts-based fast selection (still keep cells for fallback)
      return {
        ...state,
        towers: [],
        selectedId: null,
        customSetup: { open: true, cells: Array(12).fill(null), counts: {} },
      } as GameState;
    }
    case 'set-custom-cell': {
      if (!state.customSetup?.open) return state;
      const idx = Math.max(0, Math.min(11, action.index | 0));
      const cells = [...(state.customSetup?.cells ?? Array(12).fill(null))];
      cells[idx] = action.symbol;
      return { ...state, customSetup: { open: true, cells } } as GameState;
    }
    case 'confirm-custom-setup': {
      if (!state.customSetup?.open) return state;
      const counts = state.customSetup.counts ?? {};
      const order: SymbolType[] = ['sol', 'luna', 'estrella', 'fugaz'];
      const sum = order.reduce((acc, k) => acc + Math.max(0, (counts as Record<SymbolType, number>)[k] || 0), 0);
      let symbols: SymbolType[] = [];
      if (sum === 12) {
        for (const k of order) {
          const n = Math.max(0, (counts as Record<SymbolType, number>)[k] || 0);
          for (let i = 0; i < n; i++) symbols.push(k);
        }
      } else {
        const cells = state.customSetup.cells;
        if (!cells || cells.length !== 12 || cells.some((c) => c == null)) return state;
        symbols = cells as NonNullable<typeof cells[number]>[];
      }
      if (symbols.length !== 12) return state;
      const MIN_D_DEFAULT = 0.06;
      const towers = resolveAllOverlaps(towersFromSymbols(symbols), MIN_D_DEFAULT);
      return {
        ...state,
        towers,
        selectedId: null,
        currentPlayer: 1,
        lastMover: null,
        roundOver: false,
        gameOver: false,
        mergeFx: null,
        pendingTurn: null,
        customSetup: { open: false, cells: Array(12).fill(null), counts: {} },
        spawnFx: { ids: towers.map(t => t.id), at: Date.now(), kind: 'manual-confirm' },
      } as GameState;
    }
    case 'set-custom-counts': {
      if (!state.customSetup?.open) return state;
      // Clamp each value to [0..6] and keep sum <= 12 (UI will enforce equality before confirm)
      const src = state.customSetup.counts ?? {};
      const next: any = { ...src, ...action.counts };
      for (const k of Object.keys(next)) {
        const v = Number(next[k]);
        next[k] = Number.isFinite(v) ? Math.max(0, Math.min(6, v)) : 0;
      }
      return { ...state, customSetup: { ...state.customSetup, counts: next } } as GameState;
    }
    case 'clear-spawn-fx': {
      if (!state.spawnFx) return state;
      return { ...state, spawnFx: null } as GameState;
    }
    case 'cancel-custom-setup': {
      // Leave state as-is but close setup. If board was cleared, keep it cleared.
      return { ...state, customSetup: { open: false, cells: Array(12).fill(null) } } as GameState;
    }
    case 'set-mode': {
      // If switching to simulation while a flight is active, commit deferred state immediately
      if (action.mode === 'simulation' && state.mergeFx) {
        const fx = state.mergeFx;
        const newPlayer = fx.roundOverAfter ? state.currentPlayer : (state.pendingTurn ?? state.currentPlayer);
        return {
          ...state,
          mode: action.mode,
          towers: fx.towersAfter,
          players: fx.playersAfter,
          roundOver: fx.roundOverAfter,
          gameOver: fx.gameOverAfter,
          lastMover: fx.lastMoverAfter,
          mergeFx: null,
          pendingTurn: null,
          currentPlayer: newPlayer,
          selectedId: null,
        } as GameState;
      }
      return { ...state, mode: action.mode } as GameState;
    }
    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame debe usarse dentro de GameProvider');
  return ctx;
}
