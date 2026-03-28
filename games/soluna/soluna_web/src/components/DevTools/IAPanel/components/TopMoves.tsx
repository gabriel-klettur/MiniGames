import type { AIMove } from '../../../../ia/index';
import { useRootSorted } from '../hooks/useRootSorted';
import { idToLabelFactory, fmtMove, fmtScore } from '../utils/format';
import type { GameState } from '../../../../game/types';

export interface TopMovesProps {
  state: GameState;
  rootMoves?: Array<{ move: AIMove; score: number }>;
}

export default function TopMoves({ state, rootMoves }: TopMovesProps) {
  const sorted = useRootSorted(rootMoves);
  const filled: Array<{ move: AIMove; score: number } | undefined> = [...sorted];
  while (filled.length < 6) filled.push(undefined);

  const maxAbs = sorted.length > 0 ? Math.max(...sorted.map((r) => Math.abs(r.score))) : 0;
  const idToLabel = idToLabelFactory(state);

  return (
    <div className="ia-panel__moves" aria-label="Top movimientos">
      <div className="section-title" title={'Top jugadas en la raíz: ranking por score. La barra indica magnitud relativa.'}>Top jugadas (raíz)</div>
      <ol className="moves-list">
        {filled.map((r, i) => {
          const has = !!r;
          const label = has ? `${fmtMove(r!.move, idToLabel)} — ${fmtScore(r!.score)}` : 'NO INFO';
          const ratio = has
            ? (!Number.isFinite(r!.score)
              ? 1
              : (maxAbs > 0 && Number.isFinite(maxAbs) ? Math.min(1, Math.abs(r!.score) / maxAbs) : 0))
            : 0;
          return (
            <li key={i} className="move-item">
              <div className="mini-bar" aria-hidden="true">
                <div className="mini-bar__fill" style={{ width: `${ratio * 100}%` }} />
              </div>
              <span className="move-label" title={'Jugada y su evaluación para el jugador al turno en raíz.'}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
