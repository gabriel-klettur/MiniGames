import type { InfoIAGameRecord } from '../../../../../utils/infoiaDb';
import { fmtDate, fmtSecOrMinSec } from '../../utils/date';
import { useState, useMemo, Fragment } from 'react';
import { computeDifficultyGroups } from '../../utils/aggregates';
import DifficultyVs from './components/DifficultyVs';
import WinnerIcon from './components/WinnerIcon';
import RecordActions from './components/RecordActions';
import GroupActions from './components/GroupActions';
import GameDetails from './components/GameDetails';
import { useI18n } from '../../../../../i18n';

export type TablaIAProps = {
  records: InfoIAGameRecord[];
  loading?: boolean;
  allowDelete?: boolean;
  onDelete?: (id: string) => void;
  groupByDepth?: boolean;
  onToast?: (message: string, kind?: 'success' | 'error' | 'info') => void;
};

export default function TablaIA({ records, loading = false, allowDelete = true, onDelete, groupByDepth = false, onToast }: TablaIAProps) {
  const { t } = useI18n();
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
  // copyJSON moved to useCopyJSON hook (see hooks/useCopyJSON)
  if (loading) {
    return (
      <div className="infoia__table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="table"><tbody><tr><td colSpan={14}>{t.infoIA.loading}</td></tr></tbody></table>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="infoia__table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="table"><tbody><tr><td colSpan={14}>{t.infoIA.noRecordsYet}</td></tr></tbody></table>
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
                    <DifficultyVs l={l} d={d} />
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
                  <WinnerIcon winner={r.winner ?? null} />
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
                  <RecordActions record={r} allowDelete={allowDelete} onDelete={onDelete} onToast={onToast} />
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
            <th className="text-right" title="Victorias y WR — Claras">WR (%) <WinnerIcon winner="L" size={14} /></th>
            <th className="text-right" title="Victorias y WR — Oscuras">WR (%) <WinnerIcon winner="D" size={14} /></th>
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
                  <DifficultyVs l={g.depthL} d={g.depthD} />
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
                  <GroupActions depthL={g.depthL} depthD={g.depthD} stats={g.stats} records={g.records} allowDelete={allowDelete} onDelete={onDelete} onToast={onToast} />
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
                                      <DifficultyVs l={l} d={d} />
                                    ); })()}
                                  </td>
                                  <td className="text-center"><span className="badge">{r.timeMode === 'auto' ? 'Auto (∞)' : fmtSecOrMinSec(r.timeSeconds ?? 0, 3, true)}</span></td>
                                  <td className="text-right">{r.moves}</td>
                                  <td className="text-right">{fmtSecOrMinSec(r.avgThinkMs / 1000, 3)}</td>
                                  <td className="text-right">{fmtSecOrMinSec(min / 1000, 3)}</td>
                                  <td className="text-right">{fmtSecOrMinSec(max / 1000, 3)}</td>
                                  <td className="text-right">{fmtSecOrMinSec(r.totalThinkMs / 1000, 3)}</td>
                                  <td className="text-center"><WinnerIcon winner={r.winner ?? null} /></td>
                                  <td className="text-center">
                                    <RecordActions record={r} allowDelete={allowDelete} onDelete={onDelete} onToast={onToast} />
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
// GameDetails moved to ./components/GameDetails
