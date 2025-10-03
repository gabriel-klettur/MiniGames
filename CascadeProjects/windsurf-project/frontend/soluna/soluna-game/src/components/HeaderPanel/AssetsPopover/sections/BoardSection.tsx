import React from 'react';
import type { BoardItem } from '../../../../hooks/useBoardCatalog';
import styles from '../AssetsPopover.module.css';
import BackgroundThumb from '../components/BackgroundThumb';

export interface BoardSectionProps {
  boardCatalog: BoardItem[];
  selectedBoardUrl: string | null;
  onApplyBoardTexture: (url: string | null) => void;
}

export const BoardSection: React.FC<BoardSectionProps> = ({
  boardCatalog,
  selectedBoardUrl,
  onApplyBoardTexture,
}) => {
  return (
    <div className="vsai-section" aria-label="Seleccionar tipo de tablero">
      <div role="listbox" aria-label="Catálogo de tableros" className={styles.gridBgThumbs}>
        {boardCatalog.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'left', opacity: 0.8 }}>
            No se han encontrado texturas en <code>src/assets/table/</code>.
          </div>
        ) : (
          boardCatalog.map((b) => (
            <BackgroundThumb
              key={b.url}
              url={b.url}
              name={b.name}
              selected={selectedBoardUrl ? selectedBoardUrl.includes(b.url) : false}
              onClick={() => onApplyBoardTexture(b.url)}
            />
          ))
        )}
        <button
          onClick={() => onApplyBoardTexture(null)}
          aria-selected={selectedBoardUrl === null}
          title="Default"
          className={[styles.defaultThumb, selectedBoardUrl === null ? styles.defaultThumbSelected : ''].join(' ').trim()}
        >
          Default
        </button>
      </div>
    </div>
  );
};

export default BoardSection;
