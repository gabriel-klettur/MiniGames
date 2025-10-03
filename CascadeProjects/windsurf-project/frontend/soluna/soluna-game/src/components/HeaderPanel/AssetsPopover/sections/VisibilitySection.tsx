import React from 'react';
import ToggleButton from '../components/ToggleButton';
import styles from '../AssetsPopover.module.css';

export interface VisibilitySectionProps {
  bgHidden: boolean;
  fullBg: boolean;
  woodHidden: boolean;
  onToggleHideBoardBg: () => void;
  onToggleFullBg: () => void;
  onToggleHideWoodBoard: () => void;
}

export const VisibilitySection: React.FC<VisibilitySectionProps> = ({
  bgHidden,
  fullBg,
  woodHidden,
  onToggleHideBoardBg,
  onToggleFullBg,
  onToggleHideWoodBoard,
}) => {
  return (
    <div className="vsai-section" aria-label="Visibilidad del tablero">
      <div className="vsai-title">Visibilidad</div>
      <div className={["vsai-options", styles.optionsGroup].join(' ')} role="group" aria-label="Alternar visibilidad fondo y madera">
        <ToggleButton
          onClick={onToggleHideBoardBg}
          pressed={bgHidden}
          title={bgHidden ? 'Mostrar fondo' : 'Ocultar fondo'}
          label={bgHidden ? 'Mostrar fondo' : 'Ocultar fondo'}
        />
        <ToggleButton
          onClick={onToggleFullBg}
          pressed={fullBg}
          title={fullBg ? 'Fondo + tablero' : 'Solo fondo'}
          label={fullBg ? 'Fondo + tablero' : 'Solo fondo'}
        />
        <ToggleButton
          onClick={onToggleHideWoodBoard}
          pressed={woodHidden}
          title={woodHidden ? 'Mostrar tablero de madera' : 'Ocultar tablero de madera'}
          label={woodHidden ? 'Mostrar tablero' : 'Ocultar tablero'}
        />
      </div>
    </div>
  );
};

export default VisibilitySection;
