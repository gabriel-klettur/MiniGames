import React from 'react';

export type CompareHead = { id: string; name: string; color: string };

export interface CompareBarProps {
  compareSets: CompareHead[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onAdd: () => void;
}

const CompareBar: React.FC<CompareBarProps> = ({ compareSets, activeId, onSelect, onRemove, onClear, onAdd }) => {
  return (
    <div className="compare-bar" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8, marginBottom: 8 }}>
      <button className="btn btn-secondary" onClick={onAdd}>Agregar</button>
      <button className="btn btn-secondary" onClick={onClear} disabled={compareSets.length === 0}>Limpiar</button>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className={`chip ${activeId === 'local' ? 'active' : ''}`} style={{ padding: '4px 8px', borderRadius: 999, background: activeId === 'local' ? '#2563eb' : '#1f2937', cursor: 'pointer' }} onClick={() => onSelect('local')}>Local</span>
        {compareSets.map(s => (
          <span key={s.id} className={`chip ${activeId === s.id ? 'active' : ''}`} style={{ padding: '4px 8px', borderRadius: 999, background: activeId === s.id ? s.color : '#1f2937', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => onSelect(s.id)}>
            <span style={{ width: 8, height: 8, background: '#fff', borderRadius: 999, opacity: 0.8 }} />
            {s.name}
            <button className="btn btn-danger btn-sm" style={{ marginLeft: 6 }} onClick={(e) => { e.stopPropagation(); onRemove(s.id); }}>x</button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default CompareBar;
