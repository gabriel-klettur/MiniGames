import type { GameState, Player } from '../game/types';
import { movePiece as applyMoveRules } from '../game/rules';

export type BestMove = { moveId: string | null; score: number; depthReached: number };

// Generate moves: all non-retired pieces of the player to move
function generateMoves(gs: GameState): string[] {
  return gs.pieces.filter((p) => p.owner === gs.turn && p.state !== 'retirada').map((p) => p.id);
}

// Deep clone minimal state needed for search
function cloneState(src: GameState): GameState {
  return {
    lanesByPlayer: {
      Light: src.lanesByPlayer.Light.map((l) => ({ ...l })),
      Dark: src.lanesByPlayer.Dark.map((l) => ({ ...l })),
    },
    pieces: src.pieces.map((p) => ({ ...p })),
    turn: src.turn,
    winner: src.winner,
    // UI and AI are irrelevant for rules; shallow copy to avoid undefined accesses
    ui: { ...src.ui },
    ai: src.ai ? { ...src.ai } : undefined,
  } as GameState;
}

// Progress heuristic: how far each side is from finishing all 4 pieces
function progressScore(gs: GameState, side: Player): number {
  let score = 0;
  for (const p of gs.pieces) {
    const lane = gs.lanesByPlayer[p.owner][p.laneIndex];
    // Full path length for a piece: L (ida) + L (vuelta)
    const full = lane.length * 2;
    let prog = 0;
    if (p.state === 'retirada') {
      prog = full + 1; // retired is best
    } else if (p.owner === 'Light' || p.owner === 'Dark') {
      if (p.state === 'en_ida') {
        // Progress equals steps advanced from start
        prog = p.pos;
      } else {
        // en_vuelta: already reached far edge; add distance from far edge plus remaining towards start
        prog = lane.length + (lane.length - p.pos);
      }
    }
    score += (p.owner === side ? +prog : -prog);
  }
  // Add heavy bonus for winner
  if (gs.winner === side) score += 100000;
  if (gs.winner && gs.winner !== side) score -= 100000;
  return score;
}

function evaluate(gs: GameState, root: Player): number {
  // Emphasize retired pieces difference strongly
  const retiredRoot = gs.pieces.filter((p) => p.owner === root && p.state === 'retirada').length;
  const retiredOpp = gs.pieces.filter((p) => p.owner !== root && p.state === 'retirada').length;
  const retiredDelta = (retiredRoot - retiredOpp) * 5000;
  return retiredDelta + progressScore(gs, root);
}

export interface SearchOptions {
  maxDepth: number; // 1..N
  timeLimitMs: number; // wall clock budget
}

export async function findBestMove(rootState: GameState, opts: SearchOptions): Promise<BestMove> {
  const start = performance.now();
  const deadline = start + Math.max(10, opts.timeLimitMs);
  const rootSide: Player = rootState.turn;

  let best: BestMove = { moveId: null, score: -Infinity, depthReached: 0 };

  // Iterative deepening for better anytime behavior
  for (let depth = 1; depth <= opts.maxDepth; depth++) {
    const remaining = deadline - performance.now();
    if (remaining <= 1) break;
    const res = negamax(rootState, depth, -Infinity, +Infinity, rootSide, deadline);
    if (res.timeout) break;
    best = { moveId: res.moveId, score: res.score, depthReached: depth };
    // early stop on forced win/loss
    if (Math.abs(res.score) > 90000) break;
    // Give micro tick back to UI
    await new Promise((r) => setTimeout(r, 0));
  }

  return best;
}

function negamax(gs: GameState, depth: number, alpha: number, beta: number, root: Player, deadline: number): { score: number; moveId: string | null; timeout: boolean } {
  if (performance.now() >= deadline) {
    return { score: 0, moveId: null, timeout: true };
  }
  if (depth === 0 || gs.winner) {
    return { score: evaluate(gs, root), moveId: null, timeout: false };
  }

  const moves = generateMoves(gs);
  if (moves.length === 0) {
    // No legal moves shouldn't happen in Squadro, but evaluate anyway
    return { score: evaluate(gs, root), moveId: null, timeout: false };
  }

  let bestMove: string | null = null;
  let bestScore = -Infinity;
  let a = alpha;

  for (const moveId of moves) {
    const child = cloneState(gs);
    applyMoveRules(child, moveId);
    const r = negamax(child, depth - 1, -beta, -a, root, deadline);
    if (r.timeout) return { score: 0, moveId: null, timeout: true };
    const score = -r.score;
    if (score > bestScore) {
      bestScore = score;
      bestMove = moveId;
    }
    if (bestScore > a) a = bestScore;
    if (a >= beta) break; // beta cut
  }

  return { score: bestScore, moveId: bestMove, timeout: false };
}
