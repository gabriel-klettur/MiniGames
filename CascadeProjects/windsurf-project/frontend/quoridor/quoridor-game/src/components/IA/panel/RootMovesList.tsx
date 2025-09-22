import { useAppSelector } from '../../../store/hooks.ts';
import type { RootState } from '../../../store/index.ts';

function fmtMove(m: any): string {
  if (!m) return '';
  if (m.kind === 'pawn') return `Peón→(${m.to.row},${m.to.col})`;
  if (m.kind === 'wall') return `Valla ${m.wall.o} @ (${m.wall.r},${m.wall.c})`;
  return '';
}

export default function RootMovesList() {
  const stats = useAppSelector((s: RootState) => s.ia.stats);
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Top jugadas (raíz)</div>
      <ol className="space-y-1 text-xs text-gray-200 max-h-36 overflow-auto pr-1">
        {stats.rootMoves && stats.rootMoves.length ? (
          stats.rootMoves
            .slice(0, 8)
            .sort((a, b) => b.score - a.score)
            .map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="h-1.5 bg-emerald-600/60" style={{ width: `${Math.min(100, Math.max(0, 50 + r.score * 5))}%` }} />
                <span className="text-gray-300">{r.score > 0 ? `+${r.score.toFixed(1)}` : r.score.toFixed(1)}</span>
                <span className="text-gray-400">{fmtMove(r.move)}</span>
              </li>
            ))
        ) : (
          <li className="text-gray-400">NO INFO</li>
        )}
      </ol>
    </div>
  );
}
