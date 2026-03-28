import React from 'react';
import type { RefObject } from 'react';

export interface NewGamePopoverProps {
  anchorRect: DOMRect | null;
  popRef: RefObject<HTMLDivElement | null>;
  onPickRandom: () => void;
  onPickManual?: () => void;
}

const NewGamePopover: React.FC<NewGamePopoverProps> = ({
  anchorRect,
  popRef,
  onPickRandom,
  onPickManual,
}) => {
  return (
    <div
      id="newgame-popover"
      ref={popRef}
      className={["popover", "vsai-popover", "newgame-popover"].join(' ')}
      role="dialog"
      aria-label="Nueva partida"
      style={{
        position: 'fixed',
        top: anchorRect ? anchorRect.bottom + 8 : 8,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <div className="vsai-section" aria-label="Tipo de partida">
        <div className="vsai-title">Nueva partida</div>
        <div className="vsai-options" role="listbox" aria-label="Opciones de inicio">
          <button onClick={onPickRandom} title="Crear partida Aleatoreo (actual)">
            <span>Aleatoreo</span>
          </button>
          <button
            onClick={onPickManual}
            disabled={!onPickManual}
            title={onPickManual ? 'Configurar tablero manualmente' : 'NO Aleatoreo (no disponible)'}
          >
            <span>NO Aleatoreo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGamePopover;
