import { useMemo } from 'react';
import type { RootMove } from '../types';
import { fmtMove } from '../utils/format';
import { useI18n } from '../../../../i18n';

export interface RootMovesListProps {
  rootMoves: RootMove[] | undefined;
  limit?: number; // default 6
}

export default function RootMovesList({ rootMoves, limit = 6 }: RootMovesListProps) {
  const { t } = useI18n();
  const sorted = useMemo(() => {
    return (rootMoves || [])
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [rootMoves, limit]);

  const maxAbs = useMemo(() => sorted.length > 0 ? Math.max(...sorted.map(r => Math.abs(r.score))) : 0, [sorted]);
  const filled: Array<RootMove | undefined> = useMemo(() => {
    const f: Array<RootMove | undefined> = [...sorted];
    while (f.length < limit) f.push(undefined);
    return f;
  }, [sorted, limit]);

  return (
    <div className="ia-panel__moves" aria-label={t.iaPanel.topMoves}>
      <div className="section-title">{t.iaPanel.topMovesRoot}</div>
      <ol className="moves-list">
        {filled.map((r, i) => {
          const has = !!r;
          const label = has ? `${fmtMove((r as RootMove).move as any)} — ${(r as RootMove).score > 0 ? `+${(r as RootMove).score.toFixed(1)}` : (r as RootMove).score.toFixed(1)}` : 'NO INFO';
          const ratio = has && maxAbs > 0 ? Math.min(1, Math.abs((r as RootMove).score) / maxAbs) : 0;
          return (
            <li key={i} className="move-item">
              <div className="mini-bar" aria-hidden="true">
                <div className="mini-bar__fill" style={{ width: `${ratio * 100}%` }} />
              </div>
              <span className="move-label">{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

