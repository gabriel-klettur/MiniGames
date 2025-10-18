import React from 'react';
import type { RefObject } from 'react';

export interface VsAiPopoverProps {
  anchorRect: DOMRect | null;
  popRef: RefObject<HTMLDivElement | null>;
  selectedSide: 1 | 2 | null;
  onSelectSide: (side: 1 | 2) => void;
  onPickDifficulty: (d: number) => void;
}

export const VsAiPopover: React.FC<VsAiPopoverProps> = ({
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
            className={selectedSide === 1 ? 'active' : ''}
            onClick={() => onSelectSide(1)}
            aria-selected={selectedSide === 1}
          >
            <span>Jugador 1</span>
          </button>
          <button
            className={selectedSide === 2 ? 'active' : ''}
            onClick={() => onSelectSide(2)}
            aria-selected={selectedSide === 2}
          >
            <span>Jugador 2</span>
          </button>
        </div>
      </div>
      <div className="vsai-section" aria-label="Seleccionar dificultad">
        <div className="vsai-title">Dificultad</div>
        <div className="vsai-diffs" role="listbox" aria-label="Nivel de dificultad">
          {[10,11,12,13,14,15,16,17,18,19].map((d) => (
            <button
              key={d}
              onClick={() => onPickDifficulty(d)}
              disabled={!selectedSide}
              title={selectedSide ? `Comenzar vs IA (nivel ${d})` : 'Elige un lado primero'}
            >{d}</button>
          ))}
        </div>
        <div className="vsai-hint">El juego comienza tras elegir dificultad.</div>
      </div>
    </div>
  );
};

export default VsAiPopover;
