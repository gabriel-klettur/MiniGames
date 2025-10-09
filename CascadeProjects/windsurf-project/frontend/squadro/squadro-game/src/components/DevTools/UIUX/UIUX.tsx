import { useState } from 'react';
import Button from '../../ui/Button.tsx';
import CalibrationPanel from './panels/CalibrationPanel.tsx';
import PiecesPanel from './panels/PiecesPanel.tsx';
import AnimationsPanel from './panels/AnimationsPanel.tsx';

export default function UIUX() {
  // Local tab state
  const [tab, setTab] = useState<'calib' | 'fichas' | 'animaciones'>('calib');

  return (
    <div className="mt-3 w-full rounded-lg border border-neutral-800 bg-neutral-900/70 p-3 overflow-hidden">
      {/* Tabs header */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant={tab === 'calib' ? 'primary' : 'neutral'} onClick={() => setTab('calib')}>Calibración de Tablero</Button>
        <Button size="sm" variant={tab === 'fichas' ? 'primary' : 'neutral'} onClick={() => setTab('fichas')}>Fichas</Button>
        <Button size="sm" variant={tab === 'animaciones' ? 'primary' : 'neutral'} onClick={() => setTab('animaciones')}>Animaciones</Button>
      </div>

      {tab === 'calib' && <CalibrationPanel />}
      {tab === 'fichas' && <PiecesPanel />}
      {tab === 'animaciones' && <AnimationsPanel />}
    </div>
  );
}
