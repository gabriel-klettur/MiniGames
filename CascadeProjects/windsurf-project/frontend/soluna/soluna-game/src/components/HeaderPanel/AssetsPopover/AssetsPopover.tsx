import React from 'react';
import type { RefObject } from 'react';
import type { BgItem } from '../../../hooks/useBackgroundCatalog';
import type { BoardItem } from '../../../hooks/useBoardCatalog';
import styles from './AssetsPopover.module.css';
import { VisibilitySection } from './sections/VisibilitySection';
import { BackgroundSection } from './sections/BackgroundSection';
import { TokenSetSection } from './sections/TokenSetSection';
import { BoardSection } from './sections/BoardSection';

export interface AssetsPopoverProps {
  anchorRect: DOMRect | null;
  popRef: RefObject<HTMLDivElement | null>;
  bgHidden: boolean;
  woodHidden: boolean;
  fullBg: boolean;
  selectedBgUrl: string | null;
  selectedBoardUrl: string | null;
  onToggleHideBoardBg: () => void;
  onToggleFullBg: () => void;
  onToggleHideWoodBoard: () => void;
  onApplyBoardImage: (url: string | null) => void;
  onApplyBoardTexture: (url: string | null) => void;
  bgCatalog: BgItem[];
  boardCatalog: BoardItem[];
}

export const AssetsPopover: React.FC<AssetsPopoverProps> = ({
  anchorRect,
  popRef,
  bgHidden,
  woodHidden,
  fullBg,
  selectedBgUrl,
  selectedBoardUrl,
  onToggleHideBoardBg,
  onToggleFullBg,
  onToggleHideWoodBoard,
  onApplyBoardImage,
  onApplyBoardTexture,
  bgCatalog,
  boardCatalog,
}) => {
  return (
    <div
      id="bg-popover"
      ref={popRef}
      className={["popover", "vsai-popover", "bg-popover", styles.container].join(' ')}
      role="dialog"
      aria-label="Opciones de fondo del tablero"
      style={{
        position: 'fixed',
        top: anchorRect ? anchorRect.bottom + 8 : 8,
        left: 8,
        right: 8,
      }}
    >
      <VisibilitySection
        bgHidden={bgHidden}
        fullBg={fullBg}
        woodHidden={woodHidden}
        onToggleHideBoardBg={onToggleHideBoardBg}
        onToggleFullBg={onToggleFullBg}
        onToggleHideWoodBoard={onToggleHideWoodBoard}
      />

      <BackgroundSection
        bgCatalog={bgCatalog}
        selectedBgUrl={selectedBgUrl}
        onApplyBoardImage={onApplyBoardImage}
      />

      <BoardSection
        boardCatalog={boardCatalog}
        selectedBoardUrl={selectedBoardUrl}
        onApplyBoardTexture={onApplyBoardTexture}
      />

      <TokenSetSection />
    </div>
  );
};

export default AssetsPopover;
