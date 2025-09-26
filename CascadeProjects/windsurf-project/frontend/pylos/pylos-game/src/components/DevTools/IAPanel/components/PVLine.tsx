import { fmtMove } from '../utils/format';

export interface PVLineProps {
  pv: any[] | undefined;
  depthReached: number | null | undefined;
  limit?: number;
}

export default function PVLine({ pv, depthReached, limit = 8 }: PVLineProps) {
  const text = (pv && pv.length) ? pv.slice(0, limit).map((m) => fmtMove(m as any)).join(' → ') : 'NO INFO';
  return (
    <div className="pv row info">PV {depthReached !== null && depthReached !== undefined ? `(d=${depthReached})` : ''}: {text}</div>
  );
}

