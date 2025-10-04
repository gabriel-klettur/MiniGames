import type { FC } from 'react';
import { useMemo } from 'react';
import type { InfoIARecord } from '../types';

interface Props {
  records: InfoIARecord[];
}

const Summary: FC<Props> = ({ records }) => {
  const data = useMemo(() => {
    const rounds = records.length;
    const w1 = records.filter(r => r.winner === 1).length;
    const w2 = records.filter(r => r.winner === 2).length;
    const ties = records.filter(r => r.winner === 0).length;
    const wr1 = rounds ? (w1 / rounds) : 0;
    const wr2 = rounds ? (w2 / rounds) : 0;
    const minMs = rounds ? Math.min(...records.map(r => r.durationMs)) : 0;
    const maxMs = rounds ? Math.max(...records.map(r => r.durationMs)) : 0;
    const totalMs = records.reduce((a, r) => a + r.durationMs, 0);
    const setIds = Array.from(new Set(records.map(r => r.setId || 'set:unknown')));
    const sets = setIds.length;
    const roundsPerSet = sets ? (rounds / sets) : 0;
    return { rounds, w1, w2, ties, wr1, wr2, minMs, maxMs, totalMs, sets, roundsPerSet };
  }, [records]);

  return (
    <div className="summary row" style={{ justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <span className="kpi"><strong>Distintas vs Unlisted</strong> <span className="kpi kpi--muted">—</span></span>
        <span className="kpi"><strong>Rondas</strong> {data.rounds}</span>
        <span className="kpi"><strong>Sets</strong> {data.sets}</span>
        <span className="kpi"><strong>Rondas/Set</strong> {data.roundsPerSet.toFixed(2)}</span>
        <span className="kpi"><strong>WR (1)</strong> {(data.wr1*100).toFixed(1)}%</span>
        <span className="kpi"><strong>WR (2)</strong> {(data.wr2*100).toFixed(1)}%</span>
        <span className="kpi"><strong>Empates</strong> {data.ties}</span>
      </div>
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <span className="kpi"><strong>Min (s)</strong> {(data.minMs/1000).toFixed(2)}</span>
        <span className="kpi"><strong>Máx (s)</strong> {(data.maxMs/1000).toFixed(2)}</span>
        <span className="kpi"><strong>Total (s)</strong> {(data.totalMs/1000).toFixed(2)}</span>
      </div>
    </div>
  );
};

export default Summary;
