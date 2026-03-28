export type RootMove<TMove = unknown> = { move: TMove; score: number };

/**
 * Pure function used by hooks/components to sort root moves and cap to top N.
 * This mirrors prior UI behavior (descending by score, capped to 6 by default).
 */
export function sortRootMovesTopN<TMove = unknown>(rootMoves: RootMove<TMove>[] | undefined, cap: number = 6): RootMove<TMove>[] {
  return (rootMoves || [])
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, cap);
}
