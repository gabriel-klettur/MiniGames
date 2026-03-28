import React from 'react';
import ToggleButton from '../components/ToggleButton';
import styles from '../AssetsPopover.module.css';

export interface VisibilitySectionProps {
  fullBg: boolean;
  onToggleFullBg: () => void;
}

export const VisibilitySection: React.FC<VisibilitySectionProps> = ({
  fullBg,
  onToggleFullBg,
}) => {
  return (
    <div className="vsai-section" aria-label="Visibilidad del tablero">      
      <div className={["vsai-options", styles.optionsGroup].join(' ')} role="group" aria-label="Alternar visibilidad fondo y madera">
        <ToggleButton
          onClick={onToggleFullBg}
          pressed={fullBg}
          title={fullBg ? 'Fondo + tablero' : 'Solo fondo'}
          label={fullBg ? 'Fondo + tablero' : 'Solo fondo'}
        />
      </div>
    </div>
  );
};

export default VisibilitySection;
