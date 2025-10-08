import { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import UIUX from './UIUX/UIUX';
import Button from '../ui/Button';
import AIDiagnosticsPanel from '../IA/IAPanel';

export default function DevToolsPanel() {
  const { winner } = useAppSelector((s: RootState) => s.game);
  const [activeTab, setActiveTab] = useState<'IA' | 'UIUX' | null>('IA');

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-neutral-300">DevTools</h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeTab === 'IA' ? 'primary' : 'neutral'}
            onClick={() => setActiveTab(activeTab === 'IA' ? null : 'IA')}
            pressed={activeTab === 'IA'}
            aria-label="Mostrar/Ocultar IA"
            title="Mostrar/Ocultar IA"
          >
            IA
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'UIUX' ? 'primary' : 'neutral'}
            onClick={() => setActiveTab(activeTab === 'UIUX' ? null : 'UIUX')}
            pressed={activeTab === 'UIUX'}
            aria-label="Mostrar/Ocultar UI/UX"
            title="Mostrar/Ocultar UI/UX"
          >
            UI/UX
          </Button>
          {winner && (
            <div className="text-xs text-neutral-400">Ganador: {winner}</div>
          )}
        </div>
      </div>
      {activeTab === 'IA' && <AIDiagnosticsPanel />}
      {activeTab === 'UIUX' && <UIUX />}
    </div>
  );
}


