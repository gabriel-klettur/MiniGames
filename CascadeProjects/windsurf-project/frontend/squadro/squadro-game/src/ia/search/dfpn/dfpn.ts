import type { GameState, Player } from '../../../game/types';
import type { EngineOptions } from '../types';
import { generateMoves, applyMove } from '../../moves';

export interface DFPNResult {
  solved: boolean;
  score: number;
  pv: string[];
}

function other(p: Player): Player { return p === 'Light' ? 'Dark' : 'Light'; }

function countActivePieces(gs: GameState): number {
  return gs.pieces.filter(p => p.state !== 'retirada').length;
}

/**
 * dfpnProbe — Minimal endgame probe stub.
 * Triggered when active pieces are small; detects trivial immediate wins.
 * Returns { solved: true } if a 1-ply win is found; otherwise returns { solved: false }.
 */
export function dfpnProbe(state: GameState, engine?: EngineOptions): DFPNResult {
  const me: Player = state.turn;
  const active = countActivePieces(state);
  const maxActive = Math.max(0, engine?.dfpnMaxActive ?? 2);
  if (active > maxActive) return { solved: false, score: 0, pv: [] };

  // Terminal check
  if (state.winner) {
    const score = state.winner === me ? 100000 : -100000;
    return { solved: true, score, pv: [] };
  }

  // 1-ply win detection
  const moves = generateMoves(state);
  let best: { score: number; pv: string[] } | null = null;
  for (const mv of moves) {
    const child = applyMove(state, mv);
    if (child.winner === me) {
      const score = 100000;
      return { solved: true, score, pv: [mv] };
    }
    // Prefer any move that avoids immediate opponent win in reply (cheap heuristic)
    const oppMoves = generateMoves(child);
    let oppCanWin = false;
    for (const om of oppMoves) {
      const cc = applyMove(child, om);
      if (cc.winner === other(me)) { oppCanWin = true; break; }
    }
    const sc = oppCanWin ? -1 : +1; // prefer safe
    if (!best || sc > best.score) best = { score: sc, pv: [mv] };
  }
  if (best) return { solved: false, score: best.score, pv: best.pv };
  return { solved: false, score: 0, pv: [] };
}
