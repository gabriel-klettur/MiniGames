import React, { useMemo, useState } from 'react';
import RecordActions from './components/RecordActions';
import WinnerIcon from './components/WinnerIcon';

export interface TablaIAProps {
  records: Array<{
    id: string;
    startedAt: number;
    durationMs: number;
    moves: number;
    winner: 0 | 1 | 2;
    p1Depth: number;
    p2Depth: number;
    setId?: string;
    details?: Array<{ index: number; elapsedMs: number; depthReached?: number; nodes?: number; nps?: number; score?: number; at?: number }>
  }>;
  loading?: boolean;
  allowDelete?: boolean;
  onDelete?: (id: string) => void;
  groupByDepth?: boolean;
  groupBySet?: boolean;
  onToast?: (msg: string) => void;
  onViewRecord?: (id: string) => void;
  onCopyRecord?: (id: string) => void;
  onDownloadRecord?: (id: string) => void;
  onDeleteRecord?: (id: string) => void;
}

const TablaIA: React.FC<TablaIAProps> = ({ records, loading, groupByDepth = false, groupBySet = false, onViewRecord, onCopyRecord, onDownloadRecord, onDeleteRecord }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [openSet, setOpenSet] = useState<Record<string, boolean>>({});
  const fmtDate = (ms: number | undefined) => (ms ? new Date(ms).toLocaleString() : '');
  const fmtTime = (ms: number | undefined) => (ms ? new Date(ms).toLocaleTimeString() : '');
  const grouped = useMemo(() => {
    const map: Record<string, typeof records> = {};
    if (groupBySet) {
      // Compute sets by chronological order: end a set when a player reaches 4 wins
      const sorted = [...records].sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0));
      let p1 = 0, p2 = 0, setIndex = 1;
      let key = `Set ${setIndex}`;
      map[key] = [] as typeof records;
      for (const r of sorted) {
        (map[key] = map[key] || []).push(r);
        if (r.winner === 1) p1 += 1; else if (r.winner === 2) p2 += 1;
        if (p1 >= 4 || p2 >= 4) {
          // Close current set and start a new one for subsequent rounds
          setIndex += 1;
          key = `Set ${setIndex}`;
          p1 = 0; p2 = 0;
          // Do not create empty group at the end; lazily create on next iteration
        }
      }
      // Remove any last empty group if no records were added
      if (map[key] && map[key].length === 0) delete map[key];
      return map;
    }
    if (groupByDepth) {
      for (const r of records) {
        const key = `${r.p1Depth} vs ${r.p2Depth}`;
        (map[key] = map[key] || []).push(r);
      }
      return map;
    }
    return { all: records } as Record<string, typeof records>;
  }, [records, groupByDepth, groupBySet]);

  if (loading) return <div className="kpi kpi--muted">Cargando…</div>;
  return (
    <div className="table" style={{ marginTop: 8, overflowX: 'auto' }}>
      {groupBySet && (
        <div className="row" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button className="btn btn-secondary" onClick={() => {
            const next: Record<string, boolean> = {};
            for (const k of Object.keys(grouped)) next[k] = true;
            setOpenSet(next);
          }}>Expandir todo</button>
          <button className="btn btn-secondary" onClick={() => {
            const next: Record<string, boolean> = {};
            for (const k of Object.keys(grouped)) next[k] = false;
            setOpenSet(next);
          }}>Contraer todo</button>
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>#</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Winner</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Movs</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Inicio</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Duración (s)</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>P1 Depth</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>P2 Depth</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([key, list]) => {
            const wins1 = list.filter(r => r.winner === 1).length;
            const wins2 = list.filter(r => r.winner === 2).length;
            const rounds = list.length;
            const totalMs = list.reduce((a, r) => a + r.durationMs, 0);
            const avgMs = rounds ? totalMs / rounds : 0;
            const denom = rounds || 1;
            const wr1 = (wins1 / denom) * 100;
            const isOpen = openSet[key] !== false;
            const toggleSet = () => setOpenSet(s => ({ ...s, [key]: !(s[key] !== false) }));
            return (
              <React.Fragment key={key}>
                {(groupBySet || groupByDepth) && (
                  <tr onClick={toggleSet} style={{ cursor: 'pointer' }}>
                    <td colSpan={8} style={{ padding: '6px 8px', background: '#0f172a', color: '#93c5fd', fontWeight: 600 }}>
                      <span style={{ marginRight: 8 }}>{isOpen ? '▾' : '▸'}</span>
                      <strong>{key}</strong>
                      {groupBySet && (
                        <>
                          <span style={{ marginLeft: 8, color: wins1 >= 4 ? '#22c55e' : wins2 >= 4 ? '#ef4444' : '#93c5fd' }}>
                            {wins1 >= 4 ? '(4–' + wins2 + ')' : wins2 >= 4 ? '(' + wins1 + '–4)' : '(' + wins1 + '–' + wins2 + ')'}
                          </span>
                          <span style={{ marginLeft: 10, opacity: 0.95 }}>— J1 ⭐ {wins1} · J2 ⭐ {wins2} · Rondas {rounds} · Total {(totalMs/1000).toFixed(2)}s · Prom {(avgMs/1000).toFixed(2)}s · WR J1 {wr1.toFixed(1)}%</span>
                          <span style={{ float: 'right' }} onClick={(e) => e.stopPropagation()}>
                            <button className="btn btn-secondary" onClick={() => {
                              try {
                                const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url; a.download = `${key.toLowerCase().replace(/\s+/g, '-')}.json`; a.click();
                                URL.revokeObjectURL(url);
                              } catch {}
                            }}>Exportar set</button>
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                )}
                {isOpen && list.map((r, i) => (
                  <React.Fragment key={r.id}>
                    <tr style={{ borderTop: '1px solid #30363d', cursor: 'pointer' }} onClick={() => setOpen(o => ({ ...o, [r.id]: !o[r.id] }))}>
                      <td style={{ padding: '6px 8px' }}>{i + 1}</td>
                      <td style={{ padding: '6px 8px' }}><WinnerIcon winner={r.winner} /></td>
                      <td style={{ padding: '6px 8px' }}>{r.moves}</td>
                      <td style={{ padding: '6px 8px' }}>{fmtDate(r.startedAt)}</td>
                      <td style={{ padding: '6px 8px' }}>{(r.durationMs / 1000).toFixed(2)}</td>
                      <td style={{ padding: '6px 8px' }}>{r.p1Depth}</td>
                      <td style={{ padding: '6px 8px' }}>{r.p2Depth}</td>
                      <td style={{ padding: '6px 8px' }} onClick={(e) => e.stopPropagation()}>
                        <RecordActions
                          onView={() => onViewRecord?.(r.id)}
                          onCopy={() => onCopyRecord?.(r.id)}
                          onDownload={() => onDownloadRecord?.(r.id)}
                          onDelete={() => onDeleteRecord?.(r.id)}
                        />
                      </td>
                    </tr>
                    {open[r.id] && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0 }}>
                          <div style={{ padding: '8px 8px 10px 8px', background: '#0b1220' }}>
                            {r.details && r.details.length > 0 ? (
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left', padding: '4px 6px' }}>#</th>
                                    <th style={{ textAlign: 'left', padding: '4px 6px' }}>t (s)</th>
                                    <th style={{ textAlign: 'left', padding: '4px 6px' }}>Hora</th>
                                    <th style={{ textAlign: 'left', padding: '4px 6px' }}>Depth</th>
                                    <th style={{ textAlign: 'left', padding: '4px 6px' }}>Nodes</th>
                                    <th style={{ textAlign: 'left', padding: '4px 6px' }}>NPS</th>
                                    <th style={{ textAlign: 'left', padding: '4px 6px' }}>Score</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {r.details.map(d => (
                                    <tr key={d.index}>
                                      <td style={{ padding: '4px 6px' }}>{d.index}</td>
                                      <td style={{ padding: '4px 6px' }}>{(d.elapsedMs / 1000).toFixed(2)}</td>
                                      <td style={{ padding: '4px 6px' }}>{fmtTime(d.at)}</td>
                                      <td style={{ padding: '4px 6px' }}>{d.depthReached ?? ''}</td>
                                      <td style={{ padding: '4px 6px' }}>{d.nodes?.toLocaleString?.() ?? ''}</td>
                                      <td style={{ padding: '4px 6px' }}>{d.nps?.toLocaleString?.() ?? ''}</td>
                                      <td style={{ padding: '4px 6px' }}>{d.score ?? ''}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="kpi kpi--muted">Sin desglose</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TablaIA;
