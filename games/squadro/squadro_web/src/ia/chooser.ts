import type { GameState, Piece } from '../game/types';

// Simple heuristic: choose the movable piece of the side to play that could advance the most steps this turn.
// If tie, prefer pieces further from finishing their current leg, then lower laneIndex.
export function chooseAIPieceId(gs: GameState): string | null {
  const side = gs.turn;
  const candidates: Piece[] = gs.pieces.filter((p) => p.owner === side && p.state !== 'retirada');
  if (candidates.length === 0) return null;
  let best: { id: string; score: number; tie: number } | null = null;
  for (const p of candidates) {
    const lane = gs.lanesByPlayer[p.owner][p.laneIndex];
    const steps = p.state === 'en_ida' ? lane.speedOut : lane.speedBack;
    const distRemaining = p.state === 'en_ida' ? (lane.length - p.pos) : p.pos;
    const score = steps;
    const tie = distRemaining * 100 - p.laneIndex;
    if (!best || score > best.score || (score === best.score && tie > best.tie)) {
      best = { id: p.id, score, tie };
    }
  }
  return best ? best.id : null;
}
