import React from 'react';

export interface CountPickerPopoverProps {
  onPick: (count: number) => void;
  onClose?: () => void;
}

const NUMBERS = [0, 1, 2, 3, 4, 5, 6];

const CountPickerPopover: React.FC<CountPickerPopoverProps> = ({ onPick, onClose }) => {
  return (
    <div
      id="number-picker"
      className={["popover", "vsai-popover", "number-picker-popover"].join(' ')}
      role="dialog"
      aria-label="Seleccionar cantidad"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      onPointerDown={(e) => { e.stopPropagation(); }}
      onClick={(e) => { e.stopPropagation(); }}
    >
      <div className="vsai-section" aria-label="Elige cantidad">
        <div className="vsai-title">Cantidad (0–6)</div>
        <div className="vsai-options number-options" role="listbox" aria-label="Lista de cantidades">
          {NUMBERS.map((n) => (
            <button
              key={n}
              className="number-btn"
              onClick={(e) => { e.stopPropagation(); onPick(n); onClose?.(); }}
              title={`Elegir ${n}`}
              aria-label={`Elegir ${n}`}
            >
              <span>{n}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountPickerPopover;
