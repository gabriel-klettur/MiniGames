/**
 * Formatting utilities for labels and tooltips used by IAPanel.
 * These avoid coupling presentational components to domain object shapes.
 */

export interface PosLike {
  level: number;
  row: number;
  col: number;
}

export interface RecoverLike extends PosLike {}

export interface MoveLike {
  kind: 'place' | 'lift';
  src?: PosLike; // required for lift
  dest: PosLike;
  recovers?: RecoverLike[];
}

export function fmtPos(p: PosLike): string {
  return `L${p.level}:${p.row},${p.col}`;
}

export function fmtMove(m: MoveLike): string {
  const rec = m.recovers && m.recovers.length ? ` rec(${m.recovers.map(fmtPos).join(' ')})` : '';
  if (m.kind === 'place') {
    return `place ${fmtPos(m.dest)}${rec}`;
  }
  // lift
  const src = m.src ? fmtPos(m.src) : '<?>';
  return `lift ${src}→${fmtPos(m.dest)}${rec}`;
}

export default {
  fmtPos,
  fmtMove,
};

