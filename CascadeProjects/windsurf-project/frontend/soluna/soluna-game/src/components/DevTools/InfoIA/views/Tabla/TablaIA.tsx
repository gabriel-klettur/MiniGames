import React, { useMemo, useState } from 'react';
import RecordActions from './components/RecordActions';
import WinnerIcon from './components/WinnerIcon';

export interface TablaIAProps {
  records: Array<{ id: string; durationMs: number; moves: number; winner: 0 | 1 | 2; p1Depth: number; p2Depth: number; details?: Array<{ index: number; elapsedMs: number; depthReached?: number; nodes?: number; nps?: number; score?: number }> }>;
  loading?: boolean;
  allowDelete?: boolean;
  onDelete?: (id: string) => void;
  groupByDepth?: boolean;
  onToast?: (msg: string) => void;
  onViewRecord?: (id: string) => void;
  onCopyRecord?: (id: string) => void;
  onDownloadRecord?: (id: string) => void;
  onDeleteRecord?: (id: string) => void;
}

const TablaIA: React.FC<TablaIAProps> = ({ records, loading, groupByDepth = false, onViewRecord, onCopyRecord, onDownloadRecord, onDeleteRecord }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const grouped = useMemo(() => {
    if (!groupByDepth) return { all: records } as Record<string, typeof records>;
    const map: Record<string, typeof records> = {};
    for (const r of records) {
      const key = `${r.p1Depth} vs ${r.p2Depth}`;
      (map[key] = map[key] || []).push(r);
    }
    return map;
  }, [records, groupByDepth]);

  if (loading) return <div className="kpi kpi--muted">Cargando…</div>;
  return (
    <div className="table" style={{ marginTop: 8, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>#</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Winner</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Movs</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Duración (s)</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>P1 Depth</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>P2 Depth</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([key, list]) => (
            <React.Fragment key={key}>
              {groupByDepth && (
                <tr>
                  <td colSpan={7} style={{ padding: '6px 8px', background: '#0f172a', color: '#93c5fd', fontWeight: 600 }}>{key}</td>
                </tr>
              )}
              {list.map((r, i) => (
                <React.Fragment key={r.id}>
                  <tr style={{ borderTop: '1px solid #30363d', cursor: 'pointer' }} onClick={() => setOpen(o => ({ ...o, [r.id]: !o[r.id] }))}>
                    <td style={{ padding: '6px 8px' }}>{i + 1}</td>
                    <td style={{ padding: '6px 8px' }}><WinnerIcon winner={r.winner} /></td>
                    <td style={{ padding: '6px 8px' }}>{r.moves}</td>
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
                      <td colSpan={7} style={{ padding: 0 }}>
                        <div style={{ padding: '8px 8px 10px 8px', background: '#0b1220' }}>
                          {r.details && r.details.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '4px 6px' }}>#</th>
                                  <th style={{ textAlign: 'left', padding: '4px 6px' }}>t (s)</th>
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaIA;
