import React from 'react';
import type { BgItem } from '../../../../hooks/useBackgroundCatalog';
import styles from '../AssetsPopover.module.css';
import BackgroundThumb from '../components/BackgroundThumb';

export interface BackgroundSectionProps {
  bgCatalog: BgItem[];
  selectedBgUrl: string | null;
  onApplyBoardImage: (url: string | null) => void;
}

export const BackgroundSection: React.FC<BackgroundSectionProps> = ({
  bgCatalog,
  selectedBgUrl,
  onApplyBoardImage,
}) => {
  return (
    <div className="vsai-section" aria-label="Seleccionar textura de fondo">      
      <div role="listbox" aria-label="Catálogo de fondos" className={styles.gridBgThumbs}>
        {bgCatalog.map((bg) => (
          <BackgroundThumb
            key={bg.url}
            url={bg.url}
            name={bg.name}
            selected={selectedBgUrl ? selectedBgUrl.includes(bg.url) : false}
            onClick={() => onApplyBoardImage(bg.url)}
          />
        ))}
        <button
          onClick={() => onApplyBoardImage(null)}
          aria-selected={selectedBgUrl === null}
          title="Default"
          className={[styles.defaultThumb, selectedBgUrl === null ? styles.defaultThumbSelected : ''].join(' ').trim()}
        >
          Default
        </button>
      </div>
    </div>
  );
};

export default BackgroundSection;
