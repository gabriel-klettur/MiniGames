import React from 'react';
import type { TabKey } from '../types';

interface SegmentedTabsProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

export function SegmentedTabs({ active, onChange }: SegmentedTabsProps) {
  return (
    <div className="ia__tabs segmented" role="tablist" aria-label="Secciones del Panel de IA" style={{ marginTop: 8 }}>
      <button
        className={active === 'control' ? 'active' : ''}
        role="tab"
        aria-selected={active === 'control'}
        onClick={() => onChange('control')}
        title="Controles y acciones de cálculo"
      >
        Control
      </button>
      <button
        className={active === 'analysis' ? 'active' : ''}
        role="tab"
        aria-selected={active === 'analysis'}
        onClick={() => onChange('analysis')}
        title="Evaluación, PV, métricas y top jugadas"
      >
        Análisis
      </button>
    </div>
  );
}

export default SegmentedTabs;
