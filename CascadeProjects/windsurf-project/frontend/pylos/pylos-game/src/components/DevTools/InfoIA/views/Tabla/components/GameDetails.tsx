import { useMemo } from 'react';
import type { InfoIAGameRecord } from '../../../../../../utils/infoiaDb';
import { fmtDate, fmtSecOrMinSec } from '../../../utils/date';
import bolaA from '../../../../../../assets/bola_a.webp';
import bolaB from '../../../../../../assets/bola_b.webp';
import MoveTimeChart from '../../Chart/MoveTimeChart';

export default function GameDetails({ record: r }: { record: InfoIAGameRecord }) {
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

  // Total nodes across the game
  const nodesTotal = per.reduce((acc, pm) => acc + (Number.isFinite(pm.nodes as number) ? (pm.nodes as number) : 0), 0);

  // Remaining nodes per move (total - accumulated up to and including this move)
  const nodesRemaining: number[] = [];
  {
    let acc = 0;
    for (let i = 0; i < per.length; i++) {
      const cur = Number.isFinite(per[i].nodes as number) ? (per[i].nodes as number) : 0;
      const rem = Math.max(0, nodesTotal - acc - cur);
      nodesRemaining.push(rem);
      acc += cur;
    }
  }

  // Resolve bitboards usage per player from first occurrence
  const bbL = (() => {
    const m = per.find((pm) => pm.player === 'L' && typeof pm.bitboardsUsed === 'boolean');
    return typeof m?.bitboardsUsed === 'boolean' ? m!.bitboardsUsed : undefined;
  })();
  const bbD = (() => {
    const m = per.find((pm) => pm.player === 'D' && typeof pm.bitboardsUsed === 'boolean');
    return typeof m?.bitboardsUsed === 'boolean' ? m!.bitboardsUsed : undefined;
  })();

  // Split moves by player to render separate charts (L on the left, D on the right)
  const perL = useMemo(() => per.filter((m: any) => m.player === 'L'), [per]);
  const perD = useMemo(() => per.filter((m: any) => m.player === 'D'), [per]);

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className="badge">ID: <span className="mono">{r.id}</span>{usedBook ? ' (Book)' : ''}</span>
        <span className="badge">Fecha: {fmtDate(r.createdAt)}</span>
        <span className="badge">Dificultad: {(Number.isFinite(r.depthL as number)? r.depthL : r.depth)} vs {(Number.isFinite(r.depthD as number)? r.depthD : r.depth)}</span>
        <span className="badge">Tiempo: {r.timeMode === 'auto' ? 'Auto (∞)' : fmtSecOrMinSec(r.timeSeconds, 1, true)}</span>
        <span className="badge">Jugadas: {r.moves}</span>
        <span className="badge">Promedio: {fmtSecOrMinSec(r.avgThinkMs / 1000, 3)}</span>
        <span className="badge">Total: {fmtSecOrMinSec(r.totalThinkMs / 1000, 3)}</span>
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
        <span className="badge" style={{ background: '#f59e0b', color: '#111' }}>aleatorio</span>
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
              <th className="text-right" title="Nodos: jugada/restantes/totales">nodes</th>
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
                  <td className="text-right">
                    {Number.isFinite(m.nodes as number) ? `${m.nodes}/${nodesRemaining[i]}/${nodesTotal}` : '—'}
                  </td>
                  <td className="text-right">{Number.isFinite(m.nps as number) ? Number(m.nps).toFixed(3) : '—'}</td>
                  <td className="text-right">{Number.isFinite(m.score as number) ? Number(m.score).toFixed(3) : '—'}</td>
                  <td className="text-center">
                    {(() => {
                      const s = (m as any)?.source as ('book' | 'start' | 'search' | 'random' | undefined);
                      if (!s) return '—';
                      const style =
                        s === 'book'
                          ? { background: '#16a34a', color: '#fff' }
                          : s === 'start'
                          ? { background: '#7c3aed', color: '#fff' }
                          : s === 'random'
                          ? { background: '#f59e0b', color: '#111' }
                          : { background: '#2563eb', color: '#fff' };
                      const label = (s === 'random') ? 'aleatorio' : s;
                      return (
                        <span className="badge" style={style as any}>
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="text-center">{typeof m.bitboardsUsed === 'boolean' ? (m.bitboardsUsed ? '✓' : '—') : '—'}</td>
                  <td className="text-right">{Number.isFinite(m.workersUsed as number) ? m.workersUsed : '—'}</td>
                  <td className="text-right">
                    {(() => {
                      const b = Number.isFinite(m.reservesLBefore as number) ? (m.reservesLBefore as number) : undefined;
                      const a = Number.isFinite(m.reservesLAfter as number) ? (m.reservesLAfter as number) : undefined;
                      if (b == null && a == null) return '—';
                      return `${b ?? '?'} / ${a ?? '?'}`;
                    })()}
                  </td>
                  <td className="text-right">
                    {(() => {
                      const b = Number.isFinite(m.reservesDBefore as number) ? (m.reservesDBefore as number) : undefined;
                      const a = Number.isFinite(m.reservesDAfter as number) ? (m.reservesDAfter as number) : undefined;
                      if (b == null && a == null) return '—';
                      return `${b ?? '?'} / ${a ?? '?'}`;
                    })()}
                  </td>
                  <td className="text-right">{Number.isFinite(m.recoveredThisMove as number) ? m.recoveredThisMove : '—'}</td>
                  <td className="text-right">{Number.isFinite(m.repCountBefore as number) ? m.repCountBefore : '—'}</td>
                  <td className="text-right">{Number.isFinite(m.depthTarget as number) ? m.depthTarget : '—'}</td>
                  <td className="text-right">{Number.isFinite(m.timeBudgetMs as number) ? fmtSecOrMinSec((m.timeBudgetMs as number) / 1000, 2) : '—'}</td>
                  <td className="text-center">{m.diversify ?? '—'}</td>
                  <td className="text-right">{Number.isFinite(m.rootTopKUsed as number) ? m.rootTopKUsed : '—'}</td>
                  <td className="text-center">{typeof m.rootJitterUsed === 'boolean' ? (m.rootJitterUsed ? '✓' : '—') : '—'}</td>
                  <td className="text-center">{typeof m.rootLMRUsed === 'boolean' ? (m.rootLMRUsed ? '✓' : '—') : '—'}</td>
                  <td className="text-right">
                    {(() => {
                      const e = Number.isFinite(m.epsilonUsed as number) ? (m.epsilonUsed as number) : undefined;
                      const t = Number.isFinite(m.tieDeltaUsed as number) ? (m.tieDeltaUsed as number) : undefined;
                      if (e == null && t == null) return '—';
                      const eStr = e != null ? e.toFixed(2) : '?';
                      return `${eStr}/${t ?? '?'}`;
                    })()}
                  </td>
                  <td className="text-center">{m.phaseAfter ?? '—'}</td>
                  <td className="mono" title={Number.isFinite(m.keyHi as number) ? String(((m.keyHi as number) >>> 0)) : undefined}>
                    {Number.isFinite(m.keyHi as number) ? String(((m.keyHi as number) >>> 0)).slice(0, 3) + '...' : '—'}
                  </td>
                  <td className="mono" title={Number.isFinite(m.keyLo as number) ? String(((m.keyLo as number) >>> 0)) : undefined}>
                    {Number.isFinite(m.keyLo as number) ? String(((m.keyLo as number) >>> 0)).slice(0, 3) + '...' : '—'}
                  </td>
                  <td className="mono">{Number.isFinite(m.moveSig as number) ? ((m.moveSig as number) >>> 0) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ color: '#e5e7eb', fontSize: 12, marginBottom: 6, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Tiempo por jugada (s) — L</span>
              <img src={bolaB} alt="L" style={{ width: 14, height: 14 }} />
            </div>
            <MoveTimeChart perMoves={perL} />
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ color: '#e5e7eb', fontSize: 12, marginBottom: 6, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Tiempo por jugada (s) — D</span>
              <img src={bolaA} alt="D" style={{ width: 14, height: 14 }} />
            </div>
            <MoveTimeChart perMoves={perD} />
          </div>
        </div>
      </div>
    </div>
  );
}
