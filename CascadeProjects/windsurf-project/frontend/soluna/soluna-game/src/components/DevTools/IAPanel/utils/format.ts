import type { AIMove } from '../../../ia/index';
import type { GameState } from '../../../game/types';

/**
 * Normaliza la evaluación a rango [-1, 1] usando tanh.
 */
export function normEval(v: number): number {
  const scaled = Math.tanh(v / 25);
  return Math.max(-1, Math.min(1, scaled));
}

/**
 * Formatea un score numérico o especial (WIN/LOSS/NO INFO).
 */
export function fmtScore(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'NO INFO';
  if (!Number.isFinite(v)) return v > 0 ? 'WIN' : v < 0 ? 'LOSS' : '—';
  return v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
}

/**
 * Genera una etiqueta corta para una torre basada en su id.
 */
export function idToLabelFactory(state: GameState) {
  return (id: string): string => {
    const t = state.towers.find((tt) => tt.id === id);
    if (!t) return id;
    return `#${id.slice(0, 3)} h${t.height}·${t.top}`;
  };
}

/**
 * Formatea una jugada de IA usando un formateador de ids.
 */
export function fmtMove(m: AIMove, idToLabel: (id: string) => string): string {
  if (m.kind === 'merge') {
    return `merge ${idToLabel(m.sourceId)}→${idToLabel(m.targetId)}`;
  }
  return '—';
}
