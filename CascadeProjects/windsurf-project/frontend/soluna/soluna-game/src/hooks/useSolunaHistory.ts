import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '../game/types';

export type MoveEntry = { player: 1 | 2; source: 'PLAYER' | 'IA' | 'AUTO'; text: string };

export interface FinishedGameRecord {
  id: string;
  endedAt: string; // ISO
  winner: 1 | 2 | null;
  reason?: string;
  totalMoves: number;
  moves: MoveEntry[];
  simulated?: boolean;
}

const LS_KEYS = {
  moves: 'soluna.moves.v1',
  finished: 'soluna.finished.v1',
} as const;

export function useSolunaHistory(params: { state: GameState; aiControlP1: boolean; aiControlP2: boolean }) {
  const { state, aiControlP1, aiControlP2 } = params;

  const [moves, setMoves] = useState<MoveEntry[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.moves);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as MoveEntry[];
      }
    } catch {}
    return [];
  });

  const [finishedGames, setFinishedGames] = useState<FinishedGameRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.finished);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as FinishedGameRecord[];
      }
    } catch {}
    return [];
  });

  // Persist
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.moves, JSON.stringify(moves)); } catch {}
  }, [moves]);
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.finished, JSON.stringify(finishedGames)); } catch {}
  }, [finishedGames]);

  // Append a move when a merge effect occurs (best available signal in Soluna)
  const lastMergeAtRef = useRef<number | null>(null);
  useEffect(() => {
    const fx = state.mergeFx;
    if (!fx) return;
    if (state.gameOver || state.roundOver) return; // do not log after end of round/game
    if (lastMergeAtRef.current === fx.at) return; // already logged
    lastMergeAtRef.current = fx.at;

    // The actor is the previous current player (reducer already advanced currentPlayer)
    const actor: 1 | 2 = state.currentPlayer === 1 ? 2 : 1;
    const byIA = (actor === 1 && aiControlP1) || (actor === 2 && aiControlP2);

    const h = (() => {
      // Try to infer resulting height from mergedId tower
      const merged = state.towers.find(t => t.id === fx.mergedId);
      return merged ? merged.height : undefined;
    })();

    const text = h != null
      ? `fusión completada → h${h}`
      : 'fusión completada';

    setMoves(prev => [...prev, { player: actor, source: byIA ? 'IA' : 'PLAYER', text }]);
  }, [state.mergeFx?.at, state.currentPlayer, state.towers, aiControlP1, aiControlP2]);

  // Archive finished game when a game ends (or a round ends). Avoid duplicates.
  const archivedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!state.roundOver && !state.gameOver) return;
    // Build unique key for this end event
    const key = `${state.lastMover ?? ''}-${state.players[1].stars}-${state.players[2].stars}`;
    if (archivedRef.current === key) return;
    archivedRef.current = key;

    const winner = state.gameOver ? (state.lastMover ?? null) : (state.lastMover ?? null);
    const rec: FinishedGameRecord = {
      id: `soluna-${Date.now()}`,
      endedAt: new Date().toISOString(),
      winner,
      totalMoves: moves.length,
      moves: moves,
    };
    setFinishedGames(prev => [rec, ...prev]);

    // Reset current moves so next round/game starts from 0
    setMoves([]);
  }, [state.roundOver, state.gameOver, state.lastMover, state.players, moves]);

  // Fallback: ensure that after archiving a finished game, if for any reason moves remain,
  // we clear them while gameOver is true.
  useEffect(() => {
    if (state.gameOver && archivedRef.current && moves.length > 0) {
      setMoves([]);
    }
  }, [state.gameOver, moves.length]);

  // Ensure moves are cleared when a new game starts (transition gameOver: true -> false)
  const prevGameOverRef = useRef<boolean>(state.gameOver);
  useEffect(() => {
    if (prevGameOverRef.current && !state.gameOver) {
      // New game started after a completed game; guarantee fresh history
      setMoves([]);
    }
    prevGameOverRef.current = state.gameOver;
  }, [state.gameOver]);

  // Expose a direct cleaner to be used by UI flows (e.g., New Game button)
  const clearMoves = () => setMoves([]);

  const downloadCurrentGame = useMemo(() => {
    return () => {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const current = {
        id: `current-${ts}`,
        endedAt: new Date().toISOString(),
        winner: state.gameOver ? (state.lastMover ?? null) : null,
        totalMoves: moves.length,
        moves,
      } as const;
      const payload = { exportedAt: new Date().toISOString(), archived: finishedGames, current } as const;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soluna_historial_${ts}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
  }, [state.gameOver, state.lastMover, moves, finishedGames]);

  const clearHistory = useMemo(() => {
    return () => {
      const ok = window.confirm('¿Seguro que quieres limpiar el historial actual y todas las partidas archivadas? Esta acción no se puede deshacer.');
      if (!ok) return;
      setMoves([]);
      setFinishedGames([]);
      archivedRef.current = null;
    };
  }, []);

  return { moves, finishedGames, downloadCurrentGame, clearHistory, clearMoves } as const;
}
