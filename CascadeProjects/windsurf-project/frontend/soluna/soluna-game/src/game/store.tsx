import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { anyValidMoves, canMerge, mergeTowers, randomInitialTowers, findById, replaceAfterMerge } from './rules';
import type { GameAction, GameState, Tower } from './types';

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
        return { ...state };
      }

      const merged: Tower = mergeTowers(source, target);
      const towers = replaceAfterMerge(state.towers, source.id, target.id, merged);

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
    case 'new-round': {
      if (!state.roundOver && !state.gameOver) return state; // solo cuando terminó la ronda o juego
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
