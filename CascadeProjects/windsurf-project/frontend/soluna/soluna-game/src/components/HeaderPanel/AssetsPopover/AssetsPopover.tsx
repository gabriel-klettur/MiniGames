import React from 'react';
import type { RefObject } from 'react';
import type { BgItem } from '../../../hooks/useBackgroundCatalog';
import styles from './AssetsPopover.module.css';
import { VisibilitySection } from './sections/VisibilitySection';
import { BackgroundSection } from './sections/BackgroundSection';
import { TokenSetSection } from './sections/TokenSetSection';

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

      <TokenSetSection />
    </div>
  );
};

export default AssetsPopover;
