import React from 'react';
import type { RefObject } from 'react';
import type { BgItem } from '../../hooks/useBackgroundCatalog';
import { useTokenSet } from '../../contexts/TokenSetContext';

export interface AssetsPopoverProps {
  anchorRect: DOMRect | null;
  popRef: RefObject<HTMLDivElement | null>;
  bgHidden: boolean;
  woodHidden: boolean;
  fullBg: boolean;
  selectedBgUrl: string | null;
  onToggleHideBoardBg: () => void;
  onToggleFullBg: () => void;
  onToggleHideWoodBoard: () => void;
  onApplyBoardImage: (url: string | null) => void;
  bgCatalog: BgItem[];
}

export const AssetsPopover: React.FC<AssetsPopoverProps> = ({
  anchorRect,
  popRef,
  bgHidden,
  woodHidden,
  fullBg,
  selectedBgUrl,
  onToggleHideBoardBg,
  onToggleFullBg,
  onToggleHideWoodBoard,
  onApplyBoardImage,
  bgCatalog,
}) => {
  const { sets, selectedSet, selectSet } = useTokenSet();
  return (
    <div
      id="bg-popover"
      ref={popRef}
      className="popover vsai-popover bg-popover"
      role="dialog"
      aria-label="Opciones de fondo del tablero"
      style={{
        position: 'fixed',
        top: anchorRect ? anchorRect.bottom + 8 : 8,
        left: 8,
        right: 8,
      }}
    >
      <div className="vsai-section" aria-label="Visibilidad del tablero">
        <div className="vsai-title">Visibilidad</div>
        <div className="vsai-options" role="group" aria-label="Alternar visibilidad fondo y madera">
          <button
            onClick={onToggleHideBoardBg}
            aria-pressed={bgHidden}
            title={bgHidden ? 'Mostrar fondo' : 'Ocultar fondo'}
          >
            {bgHidden ? 'Mostrar fondo' : 'Ocultar fondo'}
          </button>
          <button
            onClick={onToggleFullBg}
            aria-pressed={fullBg}
            title={fullBg ? 'Fondo + tablero' : 'Solo fondo'}
          >
            {fullBg ? 'Fondo + tablero' : 'Solo fondo'}
          </button>
          <button
            onClick={onToggleHideWoodBoard}
            aria-pressed={woodHidden}
            title={woodHidden ? 'Mostrar tablero de madera' : 'Ocultar tablero de madera'}
          >
            {woodHidden ? 'Mostrar tablero' : 'Ocultar tablero'}
          </button>
        </div>
      </div>

      <div className="vsai-section" aria-label="Seleccionar textura de fondo">
        <div className="vsai-title">Fondos</div>
        <div
          role="listbox"
          aria-label="Catálogo de fondos"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}
        >
          {bgCatalog.map((bg) => {
            const isSelected = selectedBgUrl ? selectedBgUrl.includes(bg.url) : false;
            return (
              <button
                key={bg.url}
                onClick={() => onApplyBoardImage(bg.url)}
                aria-selected={isSelected}
                title={bg.name}
                style={{
                  width: 56,
                  height: 42,
                  borderRadius: 8,
                  backgroundImage: `url('${bg.url}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: isSelected ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.18)',
                }}
              />
            );
          })}
          {/* Opción: Default (sin imagen) */}
          <button
            onClick={() => onApplyBoardImage(null)}
            aria-selected={selectedBgUrl === null}
            title="Default"
            style={{
              width: 56,
              height: 42,
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(17,24,39,0.55)',
              color: '#e5e7eb',
              border: selectedBgUrl === null ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.18)',
              fontSize: 11,
            }}
          >
            Default
          </button>
        </div>
      </div>

      {/* Nueva sección: Sets de fichas */}
      <div className="vsai-section" aria-label="Seleccionar set de fichas">
        <div className="vsai-title">Fichas</div>
        <div
          role="listbox"
          aria-label="Catálogo de sets de fichas"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}
        >
          {sets.map((set) => {
            const isSel = set.name === selectedSet;
            const imgStyle: React.CSSProperties = {
              width: 24,
              height: 24,
              objectFit: 'contain',
              display: 'block',
            };
            return (
              <button
                key={set.name}
                onClick={() => selectSet(set.name)}
                aria-selected={isSel}
                title={set.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gridTemplateRows: 'repeat(2, 1fr)',
                  gap: 4,
                  alignItems: 'center',
                  justifyItems: 'center',
                  width: 90,
                  height: 64,
                  padding: 6,
                  borderRadius: 8,
                  background: 'rgba(17,24,39,0.55)',
                  border: isSel ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.18)',
                  color: '#e5e7eb',
                }}
              >
                <img src={set.images.sol} alt={`Sol - ${set.name}`} style={imgStyle} />
                <img src={set.images.luna} alt={`Luna - ${set.name}`} style={imgStyle} />
                <img src={set.images.estrella} alt={`Estrella - ${set.name}`} style={imgStyle} />
                <img src={set.images.fugaz} alt={`Fugaz - ${set.name}`} style={imgStyle} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssetsPopover;
