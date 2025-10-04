import type { FC } from 'react';
import type { WinnerFilter } from '../hooks/useRecordsFilter';

interface Props {
  winnerFilter: WinnerFilter;
  setWinnerFilter: (v: WinnerFilter) => void;
  minDur: string;
  setMinDur: (v: string) => void;
  maxDur: string;
  setMaxDur: (v: string) => void;
  groupMode: 'set' | 'depth' | 'none';
  setGroupMode: (v: 'set' | 'depth' | 'none') => void;
}

const FilterBar: FC<Props> = ({ winnerFilter, setWinnerFilter, minDur, setMinDur, maxDur, setMaxDur, groupMode, setGroupMode }) => (
  <div className="row" style={{ gap: 10, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
    <label className="kpi" style={{ gap: 6 }}>
      <strong>Ganador</strong>
      <select value={winnerFilter} onChange={(e) => setWinnerFilter(e.target.value as any)} style={{ background: 'transparent', color: 'inherit', border: 0 }}>
        <option value="all">Todos</option>
        <option value="1">J1</option>
        <option value="2">J2</option>
        <option value="0">Empate</option>
      </select>
    </label>
    <label className="kpi" style={{ gap: 6 }}>
      <strong>Duración (s)</strong>
      <input placeholder="min" value={minDur} onChange={e => setMinDur(e.target.value)} style={{ width: 64, background: 'transparent', color: 'inherit', border: 0 }} />
      /
      <input placeholder="máx" value={maxDur} onChange={e => setMaxDur(e.target.value)} style={{ width: 64, background: 'transparent', color: 'inherit', border: 0 }} />
    </label>
    <label className="kpi" style={{ gap: 6 }}>
      <strong>Agrupar por</strong>
      <select value={groupMode} onChange={(e) => setGroupMode(e.target.value as any)} style={{ background: 'transparent', color: 'inherit', border: 0 }}>
        <option value="set">Set</option>
        <option value="depth">Dificultad</option>
        <option value="none">Ninguno</option>
      </select>
    </label>
  </div>
);

export default FilterBar;
