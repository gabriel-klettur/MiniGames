import React from 'react';
import type { BgItem } from '../../../../hooks/useBackgroundCatalog';
import styles from '../AssetsPopover.module.css';
import BackgroundThumb from '../components/BackgroundThumb';

export interface BackgroundSectionProps {
  bgCatalog: BgItem[];
  selectedBgUrl: string | null;
  onApplyBoardImage: (url: string | null) => void;
  bgHidden: boolean;
  onToggleHideBoardBg: () => void;
}

export const BackgroundSection: React.FC<BackgroundSectionProps> = ({
  bgCatalog,
  selectedBgUrl,
  onApplyBoardImage,
  bgHidden,
  onToggleHideBoardBg,
}) => {
  return (
    <div className="vsai-section" aria-label="Seleccionar textura de fondo">      
      <div role="listbox" aria-label="Catálogo de fondos" className={styles.gridBgThumbs}>
        {bgCatalog.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'left', opacity: 0.8 }}>
            No se han encontrado fondos en <code>src/assets/backgrounds/</code>.
          </div>
        ) : (
          bgCatalog.map((bg) => (
            <BackgroundThumb
              key={bg.url}
              url={bg.url}
              name={bg.name}
              selected={!bgHidden && (selectedBgUrl ? selectedBgUrl.includes(bg.url) : false)}
              onClick={() => { if (bgHidden) onToggleHideBoardBg(); onApplyBoardImage(bg.url); }}
            />
          ))
        )}
        <button
          onClick={() => { if (bgHidden) onToggleHideBoardBg(); onApplyBoardImage(null); }}
          aria-selected={!bgHidden && selectedBgUrl === null}
          title="Default"
          className={[
            styles.defaultThumb,
            !bgHidden && selectedBgUrl === null ? styles.defaultThumbSelected : ''
          ].join(' ').trim()}
        >
          Default
        </button>
        <button
          onClick={() => { if (!bgHidden) onToggleHideBoardBg(); }}
          aria-pressed={bgHidden}
          title={bgHidden ? 'Mostrar fondo' : 'Ocultar fondo'}
          className={[styles.defaultThumb, bgHidden ? styles.defaultThumbSelected : ''].join(' ').trim()}
        >
          None
        </button>
      </div>
    </div>
  );
};

export default BackgroundSection;
