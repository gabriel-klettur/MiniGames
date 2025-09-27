import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';
import { fmtDate } from '../utils/date';
import { useState, useMemo, Fragment } from 'react';
import bolaA from '../../../../assets/bola_a.webp';
import bolaB from '../../../../assets/bola_b.webp';

export type TablaIAProps = {
  records: InfoIAGameRecord[];
  loading?: boolean;
  allowDelete?: boolean;
  onDelete?: (id: string) => void;
};

export default function TablaIA({ records, loading = false, allowDelete = true, onDelete }: TablaIAProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpanded = (id: string) => setExpandedId(prev => (prev === id ? null : id));
  // Hooks must run before any early return
  const sorted = useMemo(() => [...records].sort((a, b) => b.createdAt - a.createdAt), [records]);
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

  return (
    <div className="infoia__table-wrapper" style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th title="Identificador único de la simulación; útil para exportar y depurar">ID</th>
            <th title="Fecha y hora en que se creó el registro de la partida">Fecha</th>
            <th className="text-center" title="Dificultad: profundidad de búsqueda empleada para ambos jugadores">Dificultad</th>
            <th className="text-center" title="Modo de tiempo: Auto = sin límite (∞); Manual = segundos por jugada">Tiempo</th>
            <th className="text-right" title="Número total de medias jugadas (plies) realizadas en la partida">Jugadas</th>
            <th className="text-right" title="Tiempo promedio de pensamiento por jugada (segundos)">Promedio (s)</th>
            <th className="text-right" title="Tiempo mínimo observado en una jugada (segundos)">Mín (s)</th>
            <th className="text-right" title="Tiempo máximo observado en una jugada (segundos)">Máx (s)</th>
            <th className="text-right" title="Suma total de tiempos de pensamiento de la IA (segundos)">Total (s)</th>
            <th className="text-right" title="Máximo número de workers usados en la partida">Workers máx.</th>
            <th className="text-center" title="Ganador de la partida: L = Claras, D = Oscuras, — = sin ganador">Ganador</th>
            <th title="Motivo de finalización informado por las reglas (si aplica)">Motivo</th>
            <th className="text-right" title="Veces que se alcanzó el umbral de repetición en la partida">Reps ≥max</th>
            <th className="text-center" title="Acciones rápidas: descargar JSON del registro o eliminarlo">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <Fragment key={r.id}>
            <tr
                className={expandedId === r.id ? 'row--expanded' : ''}
                onClick={() => toggleExpanded(r.id)}
                title="Click para ver detalles de la partida">
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
              <td className="ellipsis motivo-cell" title={r.endedReason ?? '-' }>
                {r.endedReason
                  ? (r.endedReason === 'repetition-limit'
                      ? <span className="badge badge--danger" title="Se alcanzó el límite de repetición configurado">repetition-limit</span>
                      : r.endedReason)
                  : '—'}
              </td>
              <td className="text-right" title={typeof r.repeatMax === 'number' ? `max=${r.repeatMax}` : 'sin dato'}>{
                (typeof r.repeatHits === 'number' ? r.repeatHits : '---')
              }</td>
              <td className="text-center">
                <button
                  className="chip-btn"
                  onClick={(e) => {
                    e.stopPropagation();
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
                  <button className="chip-btn btn-danger" onClick={(e) => { e.stopPropagation(); onDelete?.(r.id); }} title="Eliminar">Eliminar</button>
                )}
              </td>
            </tr>
            {expandedId === r.id && (
              <tr className="expand">
                <td colSpan={14} style={{ background: 'rgba(2,6,23,0.4)' }}>
                  <GameDetails record={r} />
                </td>
              </tr>
            )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmtNum(n?: number, digits = 3): string {
  if (!Number.isFinite(n as number)) return '—';
  return (n as number).toFixed(digits);
}

function GameDetails({ record: r }: { record: InfoIAGameRecord }) {
  const per = r.perMove || [];
  // Build repetition counts per position key (keyHi:keyLo) as we iterate moves
  const repCounts: number[] = [];
  const seen = new Map<string, number>(); // counts so far
  const threshold = (typeof r.repeatMax === 'number' && r.repeatMax > 0) ? r.repeatMax : 3;
  for (let i = 0; i < per.length; i++) {
    const hi = Number.isFinite(per[i].keyHi as number) ? (per[i].keyHi as number) >>> 0 : undefined;
    const lo = Number.isFinite(per[i].keyLo as number) ? (per[i].keyLo as number) >>> 0 : undefined;
    const k = (typeof hi === 'number' && typeof lo === 'number') ? `${hi}:${lo}` : `no-key:${i}`;
    const c = (seen.get(k) ?? 0) + 1;
    seen.set(k, c);
    repCounts.push(c);
  }
  const totalRepeated = repCounts.filter((c) => c >= 2).length;
  const thresholdHits = repCounts.filter((c) => c === threshold).length;
  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className="badge">ID: <span className="mono">{r.id}</span></span>
        <span className="badge">Fecha: {fmtDate(r.createdAt)}</span>
        <span className="badge">Dificultad: {r.depth}</span>
        <span className="badge">Tiempo: {r.timeMode === 'auto' ? 'Auto (∞)' : `${fmtNum(r.timeSeconds, 1)} s`}</span>
        <span className="badge">Jugadas: {r.moves}</span>
        <span className="badge">Promedio: {fmtNum(r.avgThinkMs / 1000)} s</span>
        <span className="badge">Total: {fmtNum(r.totalThinkMs / 1000)} s</span>
        {typeof r.maxWorkersUsed === 'number' && (
          <span className="badge" title="Máximo workers usados en una jugada">Workers máx.: {r.maxWorkersUsed}</span>
        )}
        {typeof r.repeatHits === 'number' && (
          <span className="badge" title="Veces que se alcanzó el umbral de repetición">Reps ≥max: {r.repeatHits}{typeof r.repeatMax === 'number' ? ` (max=${r.repeatMax})` : ''}</span>
        )}
        {r.endedReason && (
          <span className="badge" title="Motivo de finalización">Motivo: {r.endedReason}</span>
        )}
        {totalRepeated > 0 && (
          <span className="badge" title="Jugadas que repiten una posición ya vista (c>=2)">Repetidas: {totalRepeated}</span>
        )}
        {thresholdHits > 0 && (
          <span className="badge badge--accent" title={`Jugadas que alcanzan el umbral de repetición (c==${threshold})`}>Umbral rep.: {thresholdHits}</span>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table table--compact">
          <thead>
            <tr>
              <th title="Índice de jugada (1 = primera jugada de la partida)">#</th>
              <th className="text-right" title="Conteo de veces que se ha visto esta posición (antes de mover) hasta ahora">rep</th>
              <th className="text-right" title="Tiempo de pensamiento de la IA para esta jugada (segundos)">t (s)</th>
              <th className="text-right" title="Profundidad máxima de búsqueda alcanzada durante la jugada">prof alcanzada</th>
              <th className="text-right" title="Número de nodos evaluados para esta jugada">nodes</th>
              <th className="text-right" title="Nodos por segundo; rendimiento del motor durante la jugada">NPS</th>
              <th className="text-right" title="Valor de evaluación de la jugada desde la perspectiva del jugador actual">score</th>
              <th className="text-right" title="Workers utilizados por el motor en esta jugada">workers</th>
              <th className="mono" title="Parte alta de la clave Zobrist de la posición previa a mover">keyHi</th>
              <th className="mono" title="Parte baja de la clave Zobrist de la posición previa a mover">keyLo</th>
              <th className="mono" title="Firma numérica del movimiento aplicado (para depuración y reproducción)">moveSig</th>
            </tr>
          </thead>
          <tbody>
            {per.map((m, i) => {
              const count = repCounts[i];
              const isRepeat = count >= 2;
              const hitThreshold = count === threshold;
              const rowStyle = isRepeat
                ? { background: 'rgba(234,179,8,0.12)', borderLeft: hitThreshold ? '3px solid #ef4444' : '3px solid rgba(234,179,8,0.6)' }
                : undefined;
              const rowTitle = isRepeat
                ? (hitThreshold ? `Repetición: c=${count} (alcanza umbral=${threshold})` : `Repetición: c=${count}`)
                : undefined;
              return (
                <tr key={i} style={rowStyle as any} title={rowTitle}>
                  <td>
                    {m.player ? (
                      <img
                        src={m.player === 'L' ? bolaB : bolaA}
                        alt={m.player === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
                        style={{ width: 14, height: 14, marginRight: 6, verticalAlign: 'middle' }}
                      />
                    ) : null}
                    {i + 1}
                  </td>
                  <td className="text-right">{count}</td>
                  <td className="text-right">{fmtNum((m.elapsedMs ?? 0) / 1000)}</td>
                <td className="text-right">{Number.isFinite(m.depthReached as number) ? m.depthReached : '—'}</td>
                <td className="text-right">{Number.isFinite(m.nodes as number) ? m.nodes : '—'}</td>
                <td className="text-right">{Number.isFinite(m.nps as number) ? m.nps : '—'}</td>
                <td className="text-right">{Number.isFinite(m.score as number) ? m.score : '—'}</td>
                <td className="text-right">{Number.isFinite(m.workersUsed as number) ? m.workersUsed : '—'}</td>
                <td className="mono">{Number.isFinite(m.keyHi as number) ? (m.keyHi as number) >>> 0 : '—'}</td>
                <td className="mono">{Number.isFinite(m.keyLo as number) ? (m.keyLo as number) >>> 0 : '—'}</td>
                <td className="mono">{Number.isFinite(m.moveSig as number) ? (m.moveSig as number) >>> 0 : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
