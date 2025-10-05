import React from 'react';
import type { RefObject } from 'react';
import type { SymbolType } from '../../game/types';
import { SymbolIcon } from '../Icons';

export interface CellTokenPickerProps {
  anchorRect: DOMRect | null;
  popRef: RefObject<HTMLDivElement | null>;
  onPick: (symbol: SymbolType) => void;
}

const OPTIONS: { key: SymbolType; label: string }[] = [
  { key: 'sol', label: 'Sol' },
  { key: 'luna', label: 'Luna' },
  { key: 'estrella', label: 'Estrella' },
  { key: 'fugaz', label: 'Fugaz' },
];

const CellTokenPicker: React.FC<CellTokenPickerProps> = ({ popRef, onPick }: CellTokenPickerProps) => {
  return (
    <div
      id="cell-token-picker"
      ref={popRef}
      className={["popover", "vsai-popover", "cell-picker-popover"].join(' ')}
      role="dialog"
      aria-label="Seleccionar ficha"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      onPointerDown={(e) => { e.stopPropagation(); }}
      onClick={(e) => { e.stopPropagation(); }}
    >
      <div className="vsai-section" aria-label="Elige símbolo">
        <div className="vsai-options symbol-options" role="listbox" aria-label="Lista de símbolos">
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className="symbol-btn"
              onClick={(e) => { e.stopPropagation(); onPick(opt.key); }}
              title={`Elegir ${opt.label}`}
              aria-label={`Elegir ${opt.label}`}
            >
              <div className="symbol-figure" aria-hidden="true">
                <SymbolIcon type={opt.key} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CellTokenPicker;
