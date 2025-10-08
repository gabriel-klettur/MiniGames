import React, { type RefObject } from 'react';
import type { Player } from '../../../game/types';

export interface VsAiPopoverProps {
  anchorRect: DOMRect | null;
  popRef: RefObject<HTMLDivElement | null>;
  selectedSide: Player | null;
  onSelectSide: (side: Player) => void;
  onPickDifficulty: (d: number) => void;
}

const VsAiPopover: React.FC<VsAiPopoverProps> = ({
  anchorRect,
  popRef,
  selectedSide,
  onSelectSide,
  onPickDifficulty,
}) => {
  return (
    <div
      id="vsai-popover"
      ref={popRef}
      className="popover vsai-popover"
      role="dialog"
      aria-label="Configurar partida vs IA"
      style={{
        position: 'fixed',
        top: anchorRect ? anchorRect.bottom + 8 : 8,
        right: 8,
      }}
    >
      <div className="vsai-section" aria-label="Seleccionar lado">
        <div className="vsai-title">VS</div>
        <div className="vsai-options" role="listbox" aria-label="Lado enemigo">
          <button
            className={selectedSide === 'Light' ? 'active' : ''}
            onClick={() => onSelectSide('Light')}
            aria-selected={selectedSide === 'Light'}
            title="IA juega como Light"
          >
            <span>Jugador 1</span>
          </button>
          <button
            className={selectedSide === 'Dark' ? 'active' : ''}
            onClick={() => onSelectSide('Dark')}
            aria-selected={selectedSide === 'Dark'}
            title="IA juega como Dark"
          >
            <span>Jugador 2</span>
          </button>
        </div>
      </div>
      <div className="vsai-section" aria-label="Seleccionar dificultad">
        <div className="vsai-title">Dificultad</div>
        <div className="vsai-diffs" role="listbox" aria-label="Nivel de dificultad">
          {[1,2,3,4,5,6,7,8,9,10].map((d) => (
            <button
              key={d}
              onClick={() => onPickDifficulty(d)}
              disabled={!selectedSide}
              title={selectedSide ? `Comenzar vs IA (nivel ${d})` : 'Elige un lado primero'}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="vsai-hint">El juego comienza tras elegir dificultad.</div>
      </div>
    </div>
  );
};

export default VsAiPopover;

