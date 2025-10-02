import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { anyValidMoves, canMerge, mergeTowers, randomInitialTowers, findById, replaceAfterMerge } from './rules';
import type { GameAction, GameState, Tower } from './types';

// Debug logging helpers (toggle via localStorage key 'soluna:log:merges')
const LOG_LS_KEY = 'soluna:log:merges';
function shouldLog(): boolean {
  try {
    const raw = window.localStorage.getItem(LOG_LS_KEY);
    // default ON if not set; set to '0' to disable
    return raw == null ? true : raw !== '0';
  } catch {
    return true;
  }
}

// Expose a small helper to toggle from console: solunaLogMerges(false) to disable, true to enable
try {
  if (typeof window !== 'undefined') {
    (window as any).solunaLogMerges = (enable?: boolean) => {
      try {
        const val = enable === false ? '0' : '1';
        window.localStorage.setItem(LOG_LS_KEY, val);
        return val;
      } catch {
        return '1';
      }
    };
  }
} catch {}

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
      const exists = !!findById(state.towers, action.id);
      if (!exists) return state;
      return { ...state, selectedId: action.id === state.selectedId ? null : action.id };
    }
    case 'attempt-merge': {
      if (state.roundOver || state.gameOver) return state;
      const sourceId = action.sourceId;
      if (!sourceId) return state;
      if (sourceId === action.targetId) return { ...state, selectedId: null };

      const source = findById(state.towers, sourceId);
      const target = findById(state.towers, action.targetId);
      if (!source || !target) return state;

      if (!canMerge(source, target)) {
        // no válido: mantenemos selección para intentar de nuevo
        if (shouldLog()) {
          try {
            const title = `[Soluna] FUSIÓN BLOQUEADA J${state.currentPlayer}: ${source.top}/${source.height} + ${target.top}/${target.height}`;
            const sameSymbol = source.top === target.top;
            const sameHeight = source.height === target.height;
            const reason = sameSymbol
              ? 'mismo símbolo — debería ser válido'
              : sameHeight
                ? 'misma altura — debería ser válido'
                : 'ni mismo símbolo ni misma altura';
            if (typeof console !== 'undefined' && typeof console.groupCollapsed === 'function') {
              console.groupCollapsed(title);
              console.warn('Motivo:', reason);
              console.table?.([
                { rol: 'origen', id: source.id, simbolo: source.top, altura: source.height, x: source.pos.x.toFixed(3), y: source.pos.y.toFixed(3) },
                { rol: 'destino', id: target.id, simbolo: target.top, altura: target.height, x: target.pos.x.toFixed(3), y: target.pos.y.toFixed(3) },
              ]);
              console.groupEnd();
            } else {
              console.warn(title, '| Motivo:', reason);
            }
          } catch {}
        }
        return { ...state };
      }

      const merged: Tower = mergeTowers(source, target);
      let towers = replaceAfterMerge(state.towers, source.id, target.id, merged);
      // After merging, resolve overlaps globally to ensure no tokens remain overlapped
      const MIN_D_AFTER_MERGE = 0.08; // slightly larger spacing after merges
      towers = resolveAllOverlaps(towers, MIN_D_AFTER_MERGE);

      // Debug/Telemetry: registrar cada fusión válida en consola
      if (shouldLog()) {
        try {
          const matchedBy = source.height === target.height
            ? 'misma-altura'
            : (source.top === target.top ? 'mismo-simbolo' : 'desconocida');
          const title = `[Soluna] Fusión J${state.currentPlayer}: ${source.top}/${source.height} + ${target.top}/${target.height} → h${merged.height} (${matchedBy})`;
          // Usar groupCollapsed para un log compacto y profesional
          // Nota: seguro en navegadores; se protege por si no existiera en SSR
          if (typeof console !== 'undefined' && typeof console.groupCollapsed === 'function') {
            console.groupCollapsed(title);
            console.log('Regla aplicada:', matchedBy);
            console.table?.([
              { rol: 'origen', id: source.id, simbolo: source.top, altura: source.height, x: source.pos.x.toFixed(3), y: source.pos.y.toFixed(3) },
              { rol: 'destino', id: target.id, simbolo: target.top, altura: target.height, x: target.pos.x.toFixed(3), y: target.pos.y.toFixed(3) },
              { rol: 'resultado', id: merged.id, simbolo: merged.top, altura: merged.height, x: merged.pos.x.toFixed(3), y: merged.pos.y.toFixed(3) },
            ]);
            // Conteos por símbolo
            const count = (arr: any[]) => arr.reduce((m: Record<string, number>, s: any) => { m[String(s)] = (m[String(s)] || 0) + 1; return m; }, {} as Record<string, number>);
            console.log('Conteo símbolos — origen:', count(source.stack));
            console.log('Conteo símbolos — destino:', count(target.stack));
            console.log('Conteo símbolos — resultado:', count(merged.stack));
            console.groupEnd();
          } else {
            // Fallback if console.groupCollapsed not available
            console.log(title);
          }
        } catch {}
      }

      // Comprobamos si el siguiente jugador tiene jugadas válidas
      const nextPlayer: 1 | 2 = state.currentPlayer === 1 ? 2 : 1;
      const nextHasMoves = anyValidMoves(towers);

      if (!nextHasMoves) {
        const winner = state.currentPlayer;
        const newStars = state.players[winner].stars + 1;
        const players = {
          ...state.players,
          [winner]: { stars: newStars },
        } as GameState['players'];
        const gameOver = newStars >= 4;
        return {
          ...state,
          towers,
          selectedId: null,
          lastMover: winner,
          roundOver: true,
          players,
          gameOver,
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
          },
        };
      }

      return {
        ...state,
        towers,
        selectedId: null,
        currentPlayer: nextPlayer,
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
        },
      };
    }
    case 'clear-merge-fx': {
      if (state.mergeFx == null) return state;
      return { ...state, mergeFx: null };
    }
    case 'resolve-overlaps': {
      if (state.roundOver || state.gameOver) return state;
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
      const minD = action.minD != null ? action.minD : 0.06;
      const towers = resolveAllOverlaps(state.towers, minD);
      return { ...state, towers };
    }
    case 'move-tower': {
      if (state.roundOver || state.gameOver) return state;
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
      };
    }
    case 'reset-game': {
      return initialState();
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
