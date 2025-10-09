import React from 'react';
import Button from '../../../ui/Button';

export type CompareHead = { id: string; name: string; color: string };

export interface CompareBarProps {
  compareSets: CompareHead[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const CompareBar: React.FC<CompareBarProps> = ({ compareSets, onAdd, onRemove, onClear }) => {
  return (
    <div className="compare-bar flex items-center flex-wrap gap-2 my-2">
      <Button size="sm" variant="neutral" onClick={onAdd} title="Agregar dataset externo">Agregar</Button>
      <Button size="sm" variant="outline" onClick={onClear} disabled={compareSets.length === 0} title="Limpiar lista de datasets">Limpiar</Button>
      <div className="flex items-center flex-wrap gap-2">
        {compareSets.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs"
            style={{ background: s.color }}
            title={s.name}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-white/80" />
            <span className="font-medium drop-shadow-sm">{s.name}</span>
            <Button size="sm" variant="danger" onClick={() => onRemove(s.id)} title="Eliminar dataset">
              <svg width="12" height="12" viewBox="0 0 24 24" className="pointer-events-none" aria-hidden>
                <path d="M6 7h12M9 7v10m6-10v10M10 4h4l1 2H9l1-2Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default CompareBar;
