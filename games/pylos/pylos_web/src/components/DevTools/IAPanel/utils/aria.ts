/**
 * Accessibility helpers for IAPanel.
 * Centralizes ARIA labels, titles and live messages for consistency.
 */

export function timebarTitle(shownElapsedMs: number, limitMs?: number): string {
  const cur = (shownElapsedMs / 1000).toFixed(2) + 's';
  const lim = typeof limitMs === 'number' ? (limitMs / 1000).toFixed(2) + 's' : '∞';
  return `Tiempo: ${cur} / ${lim}`;
}

export function statusLiveLabel(opts: { moving?: boolean; busy?: boolean; depth?: number | null }): string {
  const { moving, busy, depth } = opts;
  if (moving) return 'Moviendo';
  if (busy) return `Pensando…${typeof depth === 'number' ? ` d${depth}` : ''}`;
  return 'En espera';
}

export function evalTitleForPlayer(evalScore: number | null | undefined, atRootLabel: string): string {
  if (evalScore === null || evalScore === undefined) return 'Sin datos';
  const val = evalScore > 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1);
  return `Eval para ${atRootLabel}: ${val}`;
}

export default {
  timebarTitle,
  statusLiveLabel,
  evalTitleForPlayer,
};

