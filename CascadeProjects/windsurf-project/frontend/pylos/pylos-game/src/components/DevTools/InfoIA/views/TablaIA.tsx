import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';
import { fmtDate, fmtSecOrMinSec } from '../utils/date';
import { useState, useMemo, Fragment } from 'react';
import { computeDifficultyGroups } from '../utils/aggregates';
import bolaA from '../../../../assets/bola_a.webp';
import bolaB from '../../../../assets/bola_b.webp';
import MoveTimeChart from './Chart/MoveTimeChart';

export type TablaIAProps = {
  records: InfoIAGameRecord[];
  loading?: boolean;
  allowDelete?: boolean;
  onDelete?: (id: string) => void;
  groupByDepth?: boolean;
};

export default function TablaIA({ records, loading = false, allowDelete = true, onDelete, groupByDepth = false }: TablaIAProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpanded = (id: string) => setExpandedId(prev => (prev === id ? null : id));
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null); // depth
  const toggleGroup = (depth: number) => setExpandedGroup(prev => (prev === depth ? null : depth));
  // Hooks must run before any early return
  const sorted = useMemo(() => {
    // Flat mode sort by depth desc, then createdAt desc
    return [...records].sort((a, b) => (b.depth - a.depth) || (b.createdAt - a.createdAt));
  }, [records]);
  const groups = useMemo(() => computeDifficultyGroups(records), [records]);
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

  if (!groupByDepth) {
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
            {sorted.map((r) => {
              const usedBook = (r.perMove || []).some((pm: any) => pm?.source === 'book');
              return (
              <Fragment key={r.id}>
              <tr
                  className={expandedId === r.id ? 'row--expanded' : ''}
                  onClick={() => toggleExpanded(r.id)}
                  title="Click para ver detalles de la partida">
                <td title={r.id} className="mono ellipsis">{r.id}{usedBook ? ' (Book)' : ''}</td>
                <td>{fmtDate(r.createdAt)}</td>
                <td className="text-center">{r.depth}</td>
                <td className="text-center">
                  <span className="badge">
                    {r.timeMode === 'auto' ? 'Auto (∞)' : fmtSecOrMinSec(r.timeSeconds ?? 0, 3, true)}
                  </span>
                </td>
                <td className="text-right">{r.moves}</td>
                <td className="text-right">{fmtSecOrMinSec(r.avgThinkMs / 1000, 3)}</td>
                <td className="text-right">{
                  (() => {
                    const times = (r.perMove || []).map((pm: any) => pm.elapsedMs || 0);
                    if (times.length === 0) return (0).toFixed(3);
                    let min = times[0];
                    for (let i = 1; i < times.length; i++) if (times[i] < min) min = times[i];
                    return fmtSecOrMinSec(min / 1000, 3);
                  })()
                }</td>
                <td className="text-right">{
                  (() => {
                    const times = (r.perMove || []).map((pm: any) => pm.elapsedMs || 0);
                    if (times.length === 0) return (0).toFixed(3);
                    let max = times[0];
                    for (let i = 1; i < times.length; i++) if (times[i] > max) max = times[i];
                    return fmtSecOrMinSec(max / 1000, 3);
                  })()
                }</td>
                <td className="text-right">{fmtSecOrMinSec(r.totalThinkMs / 1000, 3)}</td>
                <td className="text-right">{typeof r.maxWorkersUsed === 'number' ? r.maxWorkersUsed : '---'}</td>
                <td className="text-center">
                  {r.winner ? (
                    <img
                      src={r.winner === 'L' ? bolaB : bolaA}
                      alt={r.winner === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
                      style={{ width: 14, height: 14 }}
                    />
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
            );})}
          </tbody>
        </table>
      </div>
    );
  }

  // Grouped by difficulty
  return (
    <div className="infoia__table-wrapper" style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th className="text-center" title="Dificultad (profundidad)">Dificultad</th>
            <th className="text-right" title="Número de partidas en el grupo">Partidas</th>
            <th className="text-right" title="Victorias y WR — Claras">WR (%) <img src={bolaB} alt="Claras" style={{ width: 14, height: 14, verticalAlign: 'middle' }} /></th>
            <th className="text-right" title="Victorias y WR — Oscuras">WR (%) <img src={bolaA} alt="Oscuras" style={{ width: 14, height: 14, verticalAlign: 'middle' }} /></th>
            <th className="text-right" title="Tiempo promedio por jugada (s)">Prom (s)</th>
            <th className="text-right" title="Tiempo mínimo por jugada (s)">Mín (s)</th>
            <th className="text-right" title="Tiempo máximo por jugada (s)">Máx (s)</th>
            <th className="text-right" title="Tiempo total (s)">Total (s)</th>
            <th className="text-center" title="Acciones del grupo (expandir/contraer, descargar, eliminar)">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(g => (
            <Fragment key={`g-${g.depth}`}>
              <tr
                className={expandedGroup === g.depth ? 'row--expanded' : ''}
                onClick={() => toggleGroup(g.depth)}
                title="Click para ver partidas del grupo"
              >
                <td className="text-center">{g.depth}</td>
                <td className="text-right">{g.stats.count}</td>
                <td className="text-right">{g.stats.winsL} ({(g.stats.winRateL * 100).toFixed(1)}%)</td>
                <td className="text-right">{g.stats.winsD} ({(g.stats.winRateR * 100).toFixed(1)}%)</td>
                <td className="text-right">{fmtSecOrMinSec(g.stats.avgSec, 3)}</td>
                <td className="text-right">{fmtSecOrMinSec(g.stats.minSec, 3)}</td>
                <td className="text-right">{fmtSecOrMinSec(g.stats.maxSec, 3)}</td>
                <td className="text-right">{fmtSecOrMinSec(g.stats.totalSec, 3)}</td>
                <td className="text-center">
                  <button
                    className="chip-btn"
                    onClick={(e) => { e.stopPropagation(); toggleGroup(g.depth); }}
                    title={expandedGroup === g.depth ? 'Ocultar partidas del grupo' : 'Ver partidas del grupo'}
                  >
                    {expandedGroup === g.depth ? 'Ocultar' : 'Ver' }
                  </button>
                  <button
                    className="chip-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const payload = {
                        depth: g.depth,
                        stats: g.stats,
                        count: g.records.length,
                        records: g.records,
                      };
                      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `pylos-infoia-group-d${g.depth}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    title="Descargar JSON del grupo"
                  >Descargar</button>
                  {allowDelete && (
                    <button
                      className="chip-btn btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!onDelete) return;
                        const ok = window.confirm(`¿Eliminar ${g.records.length} partidas del grupo d=${g.depth}? Esta acción no se puede deshacer.`);
                        if (!ok) return;
                        for (const rec of g.records) onDelete(rec.id);
                      }}
                      title="Eliminar todas las partidas del grupo"
                    >Eliminar</button>
                  )}
                </td>
              </tr>
              {expandedGroup === g.depth && (
                <tr className="expand">
                  <td colSpan={9} style={{ background: 'rgba(2,6,23,0.4)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table table--compact">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th className="text-center">Dificultad</th>
                            <th className="text-center">Tiempo</th>
                            <th className="text-right">Jugadas</th>
                            <th className="text-right">Prom (s)</th>
                            <th className="text-right">Mín (s)</th>
                            <th className="text-right">Máx (s)</th>
                            <th className="text-right">Total (s)</th>
                            <th className="text-center">Ganador</th>
                            <th className="text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.records.map(r => {
                            const usedBook = (r.perMove || []).some((pm: any) => pm?.source === 'book');
                            const times = (r.perMove || []).map((pm: any) => pm.elapsedMs || 0);
                            const min = times.length ? Math.min(...times) : 0;
                            const max = times.length ? Math.max(...times) : 0;
                            return (
                              <Fragment key={r.id}>
                                <tr
                                  className={expandedId === r.id ? 'row--expanded' : ''}
                                  onClick={() => toggleExpanded(r.id)}
                                  title="Click para ver detalles de la partida"
                                >
                                  <td className="mono ellipsis">{r.id}{usedBook ? ' (Book)' : ''}</td>
                                  <td>{fmtDate(r.createdAt)}</td>
                                  <td className="text-center">{r.depth}</td>
                                  <td className="text-center"><span className="badge">{r.timeMode === 'auto' ? 'Auto (∞)' : fmtSecOrMinSec(r.timeSeconds ?? 0, 3, true)}</span></td>
                                  <td className="text-right">{r.moves}</td>
                                  <td className="text-right">{fmtSecOrMinSec(r.avgThinkMs / 1000, 3)}</td>
                                  <td className="text-right">{fmtSecOrMinSec(min / 1000, 3)}</td>
                                  <td className="text-right">{fmtSecOrMinSec(max / 1000, 3)}</td>
                                  <td className="text-right">{fmtSecOrMinSec(r.totalThinkMs / 1000, 3)}</td>
                                  <td className="text-center">{r.winner ? (<img src={r.winner === 'L' ? bolaB : bolaA} alt={r.winner === 'L' ? 'Claras (L)' : 'Oscuras (D)'} style={{ width: 14, height: 14 }} />) : '—'}</td>
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
                                    <td colSpan={11} style={{ background: 'rgba(2,6,23,0.4)' }}>
                                      <GameDetails record={r} />
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
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

// fmtNum removed in favor of fmtSecOrMinSec for consistent time formatting

function GameDetails({ record: r }: { record: InfoIAGameRecord }) {
  const per = r.perMove || [];
  const usedBook = (per || []).some((pm: any) => pm?.source === 'book');
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
        <span className="badge">ID: <span className="mono">{r.id}</span>{usedBook ? ' (Book)' : ''}</span>
        <span className="badge">Fecha: {fmtDate(r.createdAt)}</span>
        <span className="badge">Dificultad: {r.depth}</span>
        <span className="badge">Tiempo: {r.timeMode === 'auto' ? 'Auto (∞)' : fmtSecOrMinSec(r.timeSeconds, 1, true)}</span>
        <span className="badge">Jugadas: {r.moves}</span>
        <span className="badge">Promedio: {fmtSecOrMinSec(r.avgThinkMs / 1000, 3)}{''}</span>
        <span className="badge">Total: {fmtSecOrMinSec(r.totalThinkMs / 1000, 3)}{''}</span>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '6px 0 8px 0', fontSize: 12, opacity: 0.9 }}>
        <span>Origen:</span>
        <span className="badge" style={{ background: '#16a34a', color: '#fff' }}>book</span>
        <span className="badge" style={{ background: '#7c3aed', color: '#fff' }}>start</span>
        <span className="badge" style={{ background: '#2563eb', color: '#fff' }}>search</span>
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
              <th className="text-center" title="Origen de la jugada (book/start/search)">Origen</th>
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
                  <td className="text-right">{fmtSecOrMinSec((m.elapsedMs ?? 0) / 1000, 3)}</td>
                <td className="text-right">{Number.isFinite(m.depthReached as number) ? m.depthReached : '—'}</td>
                <td className="text-right">{Number.isFinite(m.nodes as number) ? m.nodes : '—'}</td>
                <td className="text-right">{Number.isFinite(m.nps as number) ? m.nps : '—'}</td>
                <td className="text-right">{Number.isFinite(m.score as number) ? m.score : '—'}</td>
                <td className="text-center">{
                  (() => {
                    const s = (m as any)?.source as ("book" | "start" | "search" | undefined);
                    if (!s) return '—';
                    const style = s === 'book'
                      ? { background: '#16a34a', color: '#fff' }
                      : s === 'start'
                        ? { background: '#7c3aed', color: '#fff' }
                        : { background: '#2563eb', color: '#fff' };
                    return <span className="badge" style={style as any}>{s}</span>;
                  })()
                }</td>
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
      <div style={{ marginTop: 12 }}>
        <div style={{ color: '#e5e7eb', fontSize: 12, marginBottom: 6, opacity: 0.9 }}>
          Tiempo por jugada (s)
        </div>
        <MoveTimeChart perMoves={per} />
      </div>
    </div>
  );
}
