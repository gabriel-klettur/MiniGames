import { useAppSelector } from '../../../store/hooks.ts';
import type { RootState } from '../../../store/index.ts';

export default function EvaluationCard() {
  const ia = useAppSelector((s: RootState) => s.ia);
  const stats = ia.stats;
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Evaluación</div>
      <div className="flex items-center gap-3 text-sm">
        <span className="px-2 py-1 rounded bg-gray-800/80">Eval: {stats.evalScore === null ? 'NO INFO' : (stats.evalScore > 0 ? `+${stats.evalScore.toFixed(1)}` : stats.evalScore.toFixed(1))}</span>
        <span className="px-2 py-1 rounded bg-gray-800/80">Profundidad: d={stats.depthReached}</span>
      </div>
      <div className="text-xs text-gray-300">PV: {stats.pv && stats.pv.length ? stats.pv.length : 0} jugadas</div>
      <div className="text-xs text-gray-300">Distancias: dMe = {typeof stats.dMe === 'number' ? stats.dMe : '-'} | dOp = {typeof stats.dOp === 'number' ? stats.dOp : '-'}</div>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>Nodos: {stats.nodes.toLocaleString()}</span>
        <span>
          Tiempo: <span className={[
            ia.timeMode === 'manual' && stats.elapsedMs > ia.timeSeconds * 1000 ? 'text-rose-400 font-semibold' : ''
          ].join(' ')}>{(stats.elapsedMs / 1000).toFixed(2)} s</span>
        </span>
      </div>
      {ia.timeMode === 'manual' && stats.elapsedMs > ia.timeSeconds * 1000 && (
        <div className="text-xs text-rose-400">Aviso: el cálculo superó el tiempo configurado.</div>
      )}
    </div>
  );
}
