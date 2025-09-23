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
  return {
    towers: randomInitialTowers(),
    selectedId: null,
    currentPlayer: 1,
    lastMover: null,
    roundOver: false,
    gameOver: false,
    players: { 1: { stars: 0 }, 2: { stars: 0 } },
  };
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
      const sourceId = state.selectedId;
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
            const heightTooLow = sameHeight && (source.height < 2 || target.height < 2);
            const reason = sameSymbol
              ? 'mismo símbolo (debería ser válido) — revisar reglas'
              : heightTooLow
                ? 'misma altura pero altura=1 no cuenta'
                : sameHeight
                  ? 'misma altura (>=2) — debería ser válido'
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
      const towers = replaceAfterMerge(state.towers, source.id, target.id, merged);

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
        };
      }

      return {
        ...state,
        towers,
        selectedId: null,
        currentPlayer: nextPlayer,
      };
    }
    case 'move-tower': {
      if (state.roundOver || state.gameOver) return state;
      const towers = state.towers.map(t => (t.id === action.id ? { ...t, pos: { x: action.pos.x, y: action.pos.y } } : t));
      return { ...state, towers };
    }
    case 'new-round': {
      if (!state.roundOver || state.gameOver) return state; // solo cuando terminó la ronda y NO el juego
      const starter: 1 | 2 = state.lastMover ? (state.lastMover === 1 ? 2 : 1) : 1;
      return {
        ...state,
        towers: randomInitialTowers(),
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
