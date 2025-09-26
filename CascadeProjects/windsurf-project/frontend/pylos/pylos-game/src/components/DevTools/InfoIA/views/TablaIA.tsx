import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';
import { fmtDate } from '../utils/date';

export type TablaIAProps = {
  records: InfoIAGameRecord[];
  loading?: boolean;
  allowDelete?: boolean;
  onDelete?: (id: string) => void;
};

export default function TablaIA({ records, loading = false, allowDelete = true, onDelete }: TablaIAProps) {
  if (loading) {
    return (
      <div className="infoia__table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="table"><tbody><tr><td colSpan={14}>Cargando…</td></tr></tbody></table>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="infoia__table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="table"><tbody><tr><td colSpan={14}>Sin registros aún</td></tr></tbody></table>
      </div>
    );
  }

  const sorted = [...records].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="infoia__table-wrapper" style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th className="text-center">Dificultad</th>
            <th className="text-center">Tiempo</th>
            <th className="text-right">Jugadas</th>
            <th className="text-right">Promedio (s)</th>
            <th className="text-right">Mín (s)</th>
            <th className="text-right">Máx (s)</th>
            <th className="text-right">Total (s)</th>
            <th className="text-right" title="Máximo número de workers usados en la partida">Workers máx.</th>
            <th className="text-center">Ganador</th>
            <th>Motivo</th>
            <th className="text-right" title="Veces que se alcanzó el umbral de repetición en la partida">Reps ≥max</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id}>
              <td title={r.id} className="mono ellipsis">{r.id}</td>
              <td>{fmtDate(r.createdAt)}</td>
              <td className="text-center">{r.depth}</td>
              <td className="text-center">
                <span className="badge">
                  {r.timeMode === 'auto' ? 'Auto (∞)' : `${((r.timeSeconds ?? 0)).toFixed(3)} s`}
                </span>
              </td>
              <td className="text-right">{r.moves}</td>
              <td className="text-right">{(r.avgThinkMs / 1000).toFixed(3)}</td>
              <td className="text-right">{
                (() => {
                  const times = (r.perMove || []).map((pm: any) => pm.elapsedMs || 0);
                  if (times.length === 0) return (0).toFixed(3);
                  let min = times[0];
                  for (let i = 1; i < times.length; i++) if (times[i] < min) min = times[i];
                  return (min / 1000).toFixed(3);
                })()
              }</td>
              <td className="text-right">{
                (() => {
                  const times = (r.perMove || []).map((pm: any) => pm.elapsedMs || 0);
                  if (times.length === 0) return (0).toFixed(3);
                  let max = times[0];
                  for (let i = 1; i < times.length; i++) if (times[i] > max) max = times[i];
                  return (max / 1000).toFixed(3);
                })()
              }</td>
              <td className="text-right">{(r.totalThinkMs / 1000).toFixed(3)}</td>
              <td className="text-right">{typeof r.maxWorkersUsed === 'number' ? r.maxWorkersUsed : '---'}</td>
              <td className="text-center">
                {r.winner ? (
                  <span className={'badge ' + (r.winner === 'L' ? 'badge--light' : 'badge--dark')}>{r.winner}</span>
                ) : '—'}
              </td>
              <td className="ellipsis motivo-cell" title={r.endedReason ?? '-' }>{r.endedReason ?? '—'}</td>
              <td className="text-right" title={typeof r.repeatMax === 'number' ? `max=${r.repeatMax}` : 'sin dato'}>{
                (typeof r.repeatHits === 'number' ? r.repeatHits : '---')
              }</td>
              <td className="text-center">
                <button
                  className="chip-btn"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `pylos-infoia-${r.id}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  title="Descargar JSON"
                >Descargar</button>
                {allowDelete && (
                  <button className="chip-btn btn-danger" onClick={() => onDelete?.(r.id)} title="Eliminar">Eliminar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
