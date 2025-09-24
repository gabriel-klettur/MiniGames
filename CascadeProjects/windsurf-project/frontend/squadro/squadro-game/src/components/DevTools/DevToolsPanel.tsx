import { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import UIUX from './UIUX';
import EstadoTableroPanel from './EstadoTableroPanel';
import Button from '../ui/Button';

export default function DevToolsPanel() {
  const { turn, winner } = useAppSelector((s: RootState) => s.game);
  const [showUIUX, setShowUIUX] = useState(false);
  const [showEstado, setShowEstado] = useState(true);

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-neutral-300">DevTools</h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowEstado((v) => !v)}
            pressed={showEstado}
            aria-label="Mostrar/Ocultar Estado"
            title="Mostrar/Ocultar Estado"
          >
            Estado
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowUIUX((v) => !v)}
            pressed={showUIUX}
            aria-label="Mostrar/Ocultar UI/UX"
            title="Mostrar/Ocultar UI/UX"
          >
            UI/UX
          </Button>
          <div className="text-xs text-neutral-400">Turno: {turn}{winner ? ` • Ganador: ${winner}` : ''}</div>
        </div>
      </div>
      {showEstado && <EstadoTableroPanel />}
      {showUIUX && <UIUX />}
    </div>
  );
}


