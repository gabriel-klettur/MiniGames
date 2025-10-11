import type { GameState, Player } from '../../game/types';
import { evaluate } from '../evaluate';
import { applyMove, generateTacticalMoves, completesNow, approxOppSendBackCount } from '../moves';
import { orderedMoves } from './moveOrdering';
import type { EngineOptions, IterResult, SearchContext, SearchStats } from './types';
import type { TranspositionTable } from '../tt';

/**
 * Quiescence search (limited):
 * - Stand-pat evaluation as baseline.
 * - Extend only on tactical moves (retiradas y saltos aproximados).
 * - Alpha-beta window maintained; stop by time/deadline and max quiescence plies.
 */
export function quiesce(
  args: {
    state: GameState;
    alpha: number;
    beta: number;
    me: Player;
    ply: number;
    stats?: SearchStats;
    qDepth: number;
  },
  ctx: SearchContext,
  tt: TranspositionTable | null,
  deadline: number,
  engine?: EngineOptions,
): IterResult {
  const { state, me, ply } = args;

  // Time check
  if (performance.now() >= deadline) return { score: 0, bestMove: null, timeout: true };

  // Terminal handling via evaluate (winner => ±WIN)
  let alpha = args.alpha;
  const beta = args.beta;

  // Stand-pat baseline with margin
  const standPatRaw = evaluate(state, me);
  const spMargin = Math.max(0, engine?.quiescenceStandPatMargin ?? 0);
  const standPat = standPatRaw - spMargin;
  args.stats && (args.stats.nodes += 1);
  if (standPat >= beta) return { score: standPat, bestMove: null, timeout: false };
  if (standPat > alpha) alpha = standPat;

  // Depth cap for quiescence
  const qCap = Math.max(0, engine?.quiescenceMaxPlies ?? 4);
  if (args.qDepth >= qCap) {
    return { score: alpha, bestMove: null, timeout: false };
  }

  // Generate only tactical moves and apply SEE-like guard (delta >= margin)
  const tactsAll = generateTacticalMoves(state);
  const seeMargin = Math.max(0, engine?.quiescenceSeeMargin ?? 0);
  const tacts = tactsAll.filter((mv) => {
    const child = applyMove(state, mv);
    const delta = evaluate(child, me) - standPatRaw;
    return delta >= seeMargin;
  });
  if (tacts.length === 0) {
    return { score: alpha, bestMove: null, timeout: false };
  }

  const ordered = orderedMoves(state, tacts, me);

  let bestMove: string | null = null;
  for (let i = 0; i < ordered.length; i++) {
    const mv = ordered[i];
    const child = applyMove(state, mv);

    // Extension policy: do not consume qDepth for retire/jump if enabled
    const didRetire = completesNow(child, me, mv);
    const opp: Player = me === 'Light' ? 'Dark' : 'Light';
    const didJump = approxOppSendBackCount(state, child, opp) > 0;
    const nextQDepth = ((didRetire && engine?.quiescenceExtendOnRetire) || (didJump && engine?.quiescenceExtendOnJump))
      ? args.qDepth
      : args.qDepth + 1;

    const r = quiesce(
      {
        state: child,
        alpha: -beta,
        beta: -alpha,
        me,
        ply: ply + 1,
        stats: args.stats,
        qDepth: nextQDepth,
      },
      ctx,
      tt,
      deadline,
      engine,
    );
    if (r.timeout) return r;
    const score = -r.score;

    if (score > alpha) {
      alpha = score;
      bestMove = mv;
      if (alpha >= beta) {
        return { score: alpha, bestMove, timeout: false };
      }
    }
  }

  return { score: alpha, bestMove, timeout: false };
}
