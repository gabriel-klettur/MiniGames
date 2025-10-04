import React from 'react';

export type CompareHead = { id: string; name: string; color: string };

export interface CompareBarProps {
  compareSets: CompareHead[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const CompareBar: React.FC<CompareBarProps> = ({ compareSets, onAdd, onRemove, onClear }) => {
  return (
    <div className="compare-bar" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8, marginBottom: 8 }}>
      <button className="btn btn-secondary" onClick={onAdd}>Agregar</button>
      <button className="btn btn-secondary" onClick={onClear} disabled={compareSets.length === 0}>Limpiar</button>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {compareSets.map(s => (
          <span key={s.id} className={'chip'} style={{ padding: '4px 8px', borderRadius: 999, background: s.color, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {s.name}
            <button className="btn btn-danger btn-sm" style={{ marginLeft: 6 }} onClick={() => onRemove(s.id)}>x</button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default CompareBar;
