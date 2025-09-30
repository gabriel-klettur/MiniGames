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
  onToast?: (message: string, kind?: 'success' | 'error' | 'info') => void;
};

export default function TablaIA({ records, loading = false, allowDelete = true, onDelete, groupByDepth = false, onToast }: TablaIAProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpanded = (id: string) => setExpandedId(prev => (prev === id ? null : id));
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null); // group key `${depthL}|${depthD}`
  const toggleGroup = (key: string) => setExpandedGroup(prev => (prev === key ? null : key));
  // Hooks must run before any early return
  const sorted = useMemo(() => {
    // Flat mode sort by depth desc, then createdAt desc
    return [...records].sort((a, b) => (b.depth - a.depth) || (b.createdAt - a.createdAt));
  }, [records]);
  const groups = useMemo(() => computeDifficultyGroups(records), [records]);
  const depthVs = (r: InfoIAGameRecord): { l: number; d: number } => {
    const l = Number.isFinite(r.depthL as number) ? (r.depthL as number) : r.depth;
    const d = Number.isFinite(r.depthD as number) ? (r.depthD as number) : r.depth;
    return { l, d };
  };
  const copyJSON = (data: unknown) => {
    try {
      const text = JSON.stringify(data, null, 2);
      if (navigator && 'clipboard' in navigator) {
        (navigator as any).clipboard.writeText(text).then(() => {
          onToast?.('Copiado al portapapeles', 'success');
        }).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          onToast?.('Copiado al portapapeles', 'success');
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        onToast?.('Copiado al portapapeles', 'success');
      }
    } catch (e) {
      console.error('copyJSON failed', e);
      onToast?.('No se pudo copiar al portapapeles', 'error');
    }
  };
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
              <th className="text-center" title="Dificultad vs Dificultad: profundidad de L vs D en esta partida">Dificultad vs Dificultad</th>
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
                <td className="text-center">
                  {(() => { const { l, d } = depthVs(r); return (
                    <span>
                      {l}
                      <img src={bolaB} alt="L" style={{ width: 14, height: 14, marginLeft: 4, verticalAlign: 'middle' }} />
                      <span style={{ margin: '0 6px' }}>vs</span>
                      {d}
                      <img src={bolaA} alt="D" style={{ width: 14, height: 14, marginLeft: 4, verticalAlign: 'middle' }} />
                    </span>
                  ); })()}
                </td>
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
                    onClick={(e) => { e.stopPropagation(); copyJSON(r); }}
                    title="Copiar JSON"
                  >Copiar</button>
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

  // Grouped by difficulty pair (L vs D)
  return (
    <div className="infoia__table-wrapper" style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th className="text-center" title="Dificultad vs Dificultad (L vs D)">Dificultad vs Dificultad</th>
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
            <Fragment key={`g-${g.key}`}>
              <tr
                className={expandedGroup === g.key ? 'row--expanded' : ''}
                onClick={() => toggleGroup(g.key)}
                title="Click para ver partidas del grupo"
              >
                <td className="text-center">
                  <span>
                    {g.depthL}
                    <img src={bolaB} alt="L" style={{ width: 14, height: 14, marginLeft: 4, verticalAlign: 'middle' }} />
                    <span style={{ margin: '0 6px' }}>vs</span>
                    {g.depthD}
                    <img src={bolaA} alt="D" style={{ width: 14, height: 14, marginLeft: 4, verticalAlign: 'middle' }} />
                  </span>
                </td>
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
                    onClick={(e) => { e.stopPropagation(); toggleGroup(g.key); }}
                    title={expandedGroup === g.key ? 'Ocultar partidas del grupo' : 'Ver partidas del grupo'}
                  >
                    {expandedGroup === g.key ? 'Ocultar' : 'Ver' }
                  </button>
                  <button
                    className="chip-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const payload = {
                        depthL: g.depthL,
                        depthD: g.depthD,
                        stats: g.stats,
                        count: g.records.length,
                        records: g.records,
                      };
                      copyJSON(payload);
                    }}
                    title="Copiar JSON del grupo al portapapeles"
                  >Copiar</button>
                  <button
                    className="chip-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const payload = {
                        depthL: g.depthL,
                        depthD: g.depthD,
                        stats: g.stats,
                        count: g.records.length,
                        records: g.records,
                      };
                      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `pylos-infoia-group-dL${g.depthL}-dD${g.depthD}.json`;
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
                        const ok = window.confirm(`¿Eliminar ${g.records.length} partidas del grupo dL=${g.depthL}, dD=${g.depthD}? Esta acción no se puede deshacer.`);
                        if (!ok) return;
                        for (const rec of g.records) onDelete(rec.id);
                      }}
                      title="Eliminar todas las partidas del grupo"
                    >Eliminar</button>
                  )}
                </td>
              </tr>
              {expandedGroup === g.key && (
                <tr className="expand">
                  <td colSpan={9} style={{ background: 'rgba(2,6,23,0.4)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table table--compact">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th className="text-center">Dificultad vs Dificultad</th>
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
                                  <td className="text-center">
                                    {(() => { const { l, d } = depthVs(r); return (
                                      <span>
                                        {l}
                                        <img src={bolaB} alt="L" style={{ width: 14, height: 14, marginLeft: 4, verticalAlign: 'middle' }} />
                                        <span style={{ margin: '0 6px' }}>vs</span>
                                        {d}
                                        <img src={bolaA} alt="D" style={{ width: 14, height: 14, marginLeft: 4, verticalAlign: 'middle' }} />
                                      </span>
                                    ); })()}
                                  </td>
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
                                      onClick={(e) => { e.stopPropagation(); copyJSON(r); }}
                                      title="Copiar JSON"
                                    >Copiar</button>
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
  // Resolve bitboards usage per player from first occurrence
  const bbL = (() => {
    const m = per.find((pm) => pm.player === 'L' && typeof pm.bitboardsUsed === 'boolean');
    return typeof m?.bitboardsUsed === 'boolean' ? m!.bitboardsUsed : undefined;
  })();
  const bbD = (() => {
    const m = per.find((pm) => pm.player === 'D' && typeof pm.bitboardsUsed === 'boolean');
    return typeof m?.bitboardsUsed === 'boolean' ? m!.bitboardsUsed : undefined;
  })();
  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className="badge">ID: <span className="mono">{r.id}</span>{usedBook ? ' (Book)' : ''}</span>
        <span className="badge">Fecha: {fmtDate(r.createdAt)}</span>
        <span className="badge">Dificultad: {(Number.isFinite(r.depthL as number)? r.depthL : r.depth)} vs {(Number.isFinite(r.depthD as number)? r.depthD : r.depth)}</span>
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
        {typeof r.seed === 'number' && (
          <span className="badge" title="Semilla de partida">Seed: {r.seed}</span>
        )}
        {typeof r.bookEnabled === 'boolean' && (
          <span className="badge" title="Uso de libro de aperturas">Book: {r.bookEnabled ? 'on' : 'off'}</span>
        )}
        {typeof r.startRandomFirstMove === 'boolean' && (
          <span className="badge" title="Política de primer movimiento">Start: {r.startRandomFirstMove ? 'random' : 'determinista'}</span>
        )}
        {typeof r.startSeed === 'number' && (
          <span className="badge" title="Semilla de inicio (si aplica)">Start seed: {r.startSeed}</span>
        )}
        {typeof bbL === 'boolean' && (
          <span className="badge" title="Bitboards activados para L">BB L: {bbL ? 'on' : 'off'}</span>
        )}
        {typeof bbD === 'boolean' && (
          <span className="badge" title="Bitboards activados para D">BB D: {bbD ? 'on' : 'off'}</span>
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
              <th className="text-right" title="Profundidad máxima de búsqueda alcanzada durante la jugada">prof</th>
              <th className="text-right" title="Número de nodos evaluados para esta jugada">nodes</th>
              <th className="text-right" title="Nodos por segundo; rendimiento del motor durante la jugada">NPS</th>
              <th className="text-right" title="Valor de evaluación de la jugada desde la perspectiva del jugador actual">score</th>
              <th className="text-center" title="Origen de la jugada (book/start/search)">Origen</th>
              <th className="text-center" title="Uso de bitboards en esta jugada">BB</th>
              <th className="text-right" title="Workers utilizados por el motor en esta jugada">workers</th>
              <th className="text-right" title="Reservas L antes/después">rL b/a</th>
              <th className="text-right" title="Reservas D antes/después">rD b/a</th>
              <th className="text-right" title="Bolas recuperadas en esta jugada">rec</th>
              <th className="text-right" title="Repetición antes de mover">repB</th>
              <th className="text-right" title="Profundidad objetivo para esta jugada">depth tgt</th>
              <th className="text-right" title="Presupuesto de tiempo efectivo (s)">tBudget</th>
              <th className="text-center" title="Diversificación en raíz">div</th>
              <th className="text-right" title="Top-K en raíz">k</th>
              <th className="text-center" title="Jitter en raíz">jit</th>
              <th className="text-center" title="LMR en raíz">LMR</th>
              <th className="text-right" title="epsilon / tieDelta usados">eps/tie</th>
              <th className="text-center" title="Fase tras aplicar (play/recover)">ph</th>
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
                <td className="text-right">{Number.isFinite(m.nps as number) ? Number(m.nps).toFixed(3) : '—'}</td>
                <td className="text-right">{Number.isFinite(m.score as number) ? Number(m.score).toFixed(3) : '—'}</td>
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
                <td className="text-center">{typeof m.bitboardsUsed === 'boolean' ? (m.bitboardsUsed ? '✓' : '—') : '—'}</td>
                <td className="text-right">{Number.isFinite(m.workersUsed as number) ? m.workersUsed : '—'}</td>
                <td className="text-right">{
                  (() => {
                    const b = Number.isFinite(m.reservesLBefore as number) ? (m.reservesLBefore as number) : undefined;
                    const a = Number.isFinite(m.reservesLAfter as number) ? (m.reservesLAfter as number) : undefined;
                    if (b == null && a == null) return '—';
                    return `${b ?? '?'} / ${a ?? '?'}`;
                  })()
                }</td>
                <td className="text-right">{
                  (() => {
                    const b = Number.isFinite(m.reservesDBefore as number) ? (m.reservesDBefore as number) : undefined;
                    const a = Number.isFinite(m.reservesDAfter as number) ? (m.reservesDAfter as number) : undefined;
                    if (b == null && a == null) return '—';
                    return `${b ?? '?'} / ${a ?? '?'}`;
                  })()
                }</td>
                <td className="text-right">{Number.isFinite(m.recoveredThisMove as number) ? m.recoveredThisMove : '—'}</td>
                <td className="text-right">{Number.isFinite(m.repCountBefore as number) ? m.repCountBefore : '—'}</td>
                <td className="text-right">{Number.isFinite(m.depthTarget as number) ? m.depthTarget : '—'}</td>
                <td className="text-right">{Number.isFinite(m.timeBudgetMs as number) ? fmtSecOrMinSec((m.timeBudgetMs as number) / 1000, 2) : '—'}</td>
                <td className="text-center">{m.diversify ?? '—'}</td>
                <td className="text-right">{Number.isFinite(m.rootTopKUsed as number) ? m.rootTopKUsed : '—'}</td>
                <td className="text-center">{typeof m.rootJitterUsed === 'boolean' ? (m.rootJitterUsed ? '✓' : '—') : '—'}</td>
                <td className="text-center">{typeof m.rootLMRUsed === 'boolean' ? (m.rootLMRUsed ? '✓' : '—') : '—'}</td>
                <td className="text-right">{
                  (() => {
                    const e = Number.isFinite(m.epsilonUsed as number) ? (m.epsilonUsed as number) : undefined;
                    const t = Number.isFinite(m.tieDeltaUsed as number) ? (m.tieDeltaUsed as number) : undefined;
                    if (e == null && t == null) return '—';
                    const eStr = e != null ? e.toFixed(2) : '?';
                    return `${eStr}/${t ?? '?'}`;
                  })()
                }</td>
                <td className="text-center">{m.phaseAfter ?? '—'}</td>
                <td className="mono" title={Number.isFinite(m.keyHi as number) ? String(((m.keyHi as number) >>> 0)) : undefined}>{
                  Number.isFinite(m.keyHi as number)
                    ? (String(((m.keyHi as number) >>> 0)).slice(0, 3) + '...')
                    : '—'
                }</td>
                <td className="mono" title={Number.isFinite(m.keyLo as number) ? String(((m.keyLo as number) >>> 0)) : undefined}>{
                  Number.isFinite(m.keyLo as number)
                    ? (String(((m.keyLo as number) >>> 0)).slice(0, 3) + '...')
                    : '—'
                }</td>
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
