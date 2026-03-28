import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import type { GameState, Position } from '../game/types';
import { LEVELS, getCell, isFree, isSupported, levelSize } from '../game/board';
import { validMoveDestinations } from '../game/rules';
import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';

export interface BoardProps {
  state: GameState;
  onCellClick: (pos: Position) => void;
  onDragStart?: (pos: Position) => void;
  onDrop?: (pos: Position) => void;
  onDragEnd?: () => void;
  highlights?: Set<string>; // position keys to highlight
  selected?: Position | undefined;
  posKey: (p: Position) => string;
  appearKeys?: Set<string>;
  flashKeys?: Set<string>;
  viewMode?: 'pyramid' | 'stacked';
  debugHitTest?: boolean;
  // Fine-grained debug overlays (active only if debugHitTest)
  debugShowGrid?: boolean;
  debugShowOverlays?: boolean;
  debugShowCellOutlines?: boolean;
  debugShowDisabledCells?: boolean;
  debugShowClickable?: boolean;
  // Control de sombreado por nivel (L0..L3). true = ocultar sombreado
  noShade?: { 0?: boolean; 1?: boolean; 2?: boolean; 3?: boolean };
  // Modo: sombreado solo huecos disponibles (celdas soportadas vacías)
  shadeOnlyHoles?: boolean;
  // Mostrar borde blanco en huecos disponibles (controlado por DevTools UX)
  showHoleBorders?: boolean;
  // Optional style to inject CSS custom properties (scaling, etc.) on the board root
  style?: CSSProperties;
  // Claves de celdas a ocultar temporalmente (p.ej., origen durante una elevación)
  hiddenKeys?: Set<string>;
}

export function Board({ state, onCellClick, onDragStart, onDragEnd, highlights, selected, posKey, appearKeys, flashKeys, viewMode = 'pyramid', debugHitTest = false, debugShowGrid = true, debugShowOverlays = true, debugShowCellOutlines = true, debugShowDisabledCells = true, debugShowClickable = true, noShade = {}, shadeOnlyHoles = false, showHoleBorders = false, style, hiddenKeys }: BoardProps) {
  // Helper to render a single cell button with interactivity constraints
  const renderCellBtn = (pos: Position) => {
    const cell = getCell(state.board, pos);
    const key = posKey(pos);
    const isHighlighted = highlights?.has(key) ?? false;
    const isSelected = selected && posKey(selected) === key;
    const free = cell ? isFree(state.board, pos) : false;
    const supported = !cell && isSupported(state.board, pos);
    const isAppearing = appearKeys?.has(key) ?? false;
    const isFlashing = flashKeys?.has(key) ?? false;
    // Compute per-cell offsets from the grid center in units of cell centers
    const sizeForLevel = levelSize(pos.level);
    const centerIndex = (sizeForLevel - 1) / 2;
    const dxUnits = pos.col - centerIndex; // +right, -left
    const dyUnits = pos.row - centerIndex; // +down, -up
    // A cell is clickable only if it's a highlighted destination, or it's a free own piece WITH MOVES (to select/move)
    const hasMoves = !!cell && state.currentPlayer === cell && free && validMoveDestinations(state.board, pos).length > 0;
    const canClickOwnFreePiece = hasMoves && state.phase === 'play';
    const canClickEmptyBase = !cell && state.phase === 'play' && (viewMode !== 'pyramid' || pos.level === 0) && supported;
    // During selection phase, allow clicking:
    // - the currently selected source (to cancel), and
    // - any other own free piece with moves (to switch source).
    const isSelectedWhenSelecting = isSelected && state.phase === 'selectMoveDest';
    const canSwitchSource = state.phase === 'selectMoveDest' && hasMoves;
    const interactive = isHighlighted || canClickOwnFreePiece || canSwitchSource || canClickEmptyBase || isSelectedWhenSelecting;
    // Passive-ghost click: only for occupied cells on level 2 (2x2), when nothing actionable can be done
    const canGhostClick = !!cell && pos.level === 2 && !interactive && state.phase !== 'recover';
    // In pyramid view we allow base-level empty cells to receive clicks even if not highlighted,
    // to compensate for overlays that may occlude them visually. Do NOT enable this for occupied cells.
    const baseEmptyOverride = !cell && state.phase === 'play' && viewMode === 'pyramid' && pos.level === 0;
    // A unified flag for actual clickability (used for classes and pointer-events)
    const clickable = interactive || baseEmptyOverride;
    const canDrag = !!cell && state.currentPlayer === cell && free && hasMoves && state.phase !== 'recover';

    return (
      <button
        key={key}
        data-poskey={key}
        className={[
          'cell',
          isHighlighted ? 'cell--highlight' : '',
          supported ? 'cell--supported' : '',
          isSelected ? 'cell--selected' : '',
          isFlashing ? 'cell--flash' : '',
          clickable ? 'cell--clickable' : '',
          baseEmptyOverride ? 'cell--base-override' : '',
          !clickable ? 'cell--disabled' : '',
        ].join(' ')}
        style={{
          // Allow pointer events if clickable OR if we want to capture a passive ghost click
          pointerEvents: (clickable || canGhostClick) ? 'auto' : 'none',
          ['--cell-dx' as any]: String(dxUnits),
          ['--cell-dy' as any]: String(dyUnits),
        }}
        // Attach game click handler only when interactive or base empty override applies;
        // otherwise, if canGhostClick, trigger a visual-only fade animation on the piece.
        onClick={
          clickable
            ? (() => {
                if (debugHitTest) {
                  console.log('cell-click', { pos, level: pos.level, highlighted: isHighlighted, selected: isSelected, free, supported, cell, baseEmptyOverride });
                }
                onCellClick(pos);
              })
            : (canGhostClick
                ? ((e) => {
                    if (debugHitTest) {
                      console.log('ghost-click', { pos, level: pos.level });
                    }
                    const btn = e.currentTarget as HTMLButtonElement;
                    const pieceEl = btn.querySelector('.piece');
                    if (pieceEl) {
                      // Restart animation if already applied
                      pieceEl.classList.remove('piece--ghost');
                      // Force reflow to allow restarting the CSS animation
                      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                      (pieceEl as HTMLElement).offsetWidth;
                      pieceEl.classList.add('piece--ghost');
                      // Clean up class after animation ends (3s total)
                      window.setTimeout(() => {
                        pieceEl.classList.remove('piece--ghost');
                      }, 3000);
                    }
                  })
                : undefined)
        }
        onDragOver={isHighlighted ? ((e) => { e.preventDefault(); }) : undefined}
        onDrop={isHighlighted ? ((e) => { e.preventDefault(); (state.phase !== 'recover') && (onCellClick(pos)); }) : undefined}
        title={`L${pos.level} (${pos.row},${pos.col})`}
      >
        {cell && !(hiddenKeys?.has(key)) && (
          <span
            className={[
              'piece',
              cell === 'L' ? 'piece--light' : 'piece--dark',
              free ? 'piece--free' : 'piece--fixed',
              isSelected ? 'piece--selected' : '',
              isAppearing ? 'piece--appear' : '',
            ].join(' ')}
            draggable={canDrag}
            onDragStart={(e) => {
              if (canDrag) {
                e.dataTransfer.setData('text/plain', key);
                onDragStart?.(pos);
              }
            }}
            onDragEnd={() => { onDragEnd?.(); }}
          >
            <img
              src={cell === 'L' ? bolaB : bolaA}
              alt={cell === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
              className="piece__img"
              draggable={false}
            />
          </span>
        )}
      </button>
    );
  };

  // Two rendering modes: stacked (vertical levels) or pyramid (overlays)
  if (viewMode === 'stacked') {
    const shadeClasses = [
      noShade[0] ? 'no-shade-l0' : '',
      noShade[1] ? 'no-shade-l1' : '',
      noShade[2] ? 'no-shade-l2' : '',
      noShade[3] ? 'no-shade-l3' : '',
    ].filter(Boolean).join(' ');
    return (
      <div className={[
        'board',
        'board--stacked',
        debugHitTest ? 'board--debug' : '',
        debugHitTest && debugShowGrid ? 'board--dbg-grid' : '',
        debugHitTest && debugShowOverlays ? 'board--dbg-overlays' : '',
        debugHitTest && debugShowCellOutlines ? 'board--dbg-cells' : '',
        debugHitTest && debugShowDisabledCells ? 'board--dbg-disabled' : '',
        debugHitTest && debugShowClickable ? 'board--dbg-clickable' : '',
        shadeClasses,
        shadeOnlyHoles ? 'shade-only-holes' : '',
        showHoleBorders ? 'hole-borders' : ''
      ].join(' ').trim()}>
        {Array.from({ length: LEVELS }).map((_, level) => {
          const size = levelSize(level);
          return (
            <div
              key={`stack-${level}`}
              className={["level", level === 0 ? "level--board" : ""].join(' ')}
              data-level={level}
              style={{ gridTemplateColumns: `repeat(${size}, var(--cell-size))`, justifyContent: 'center' }}
            >
              {Array.from({ length: size }).map((_, r) => (
                <Fragment key={`L${level}-R${r}`}>
                  {Array.from({ length: size }).map((_, c) => renderCellBtn({ level, row: r, col: c }))}
                </Fragment>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // Render base level as the visual board container, then overlay upper levels absolutely
  const baseSize = levelSize(0);
  return (
    <div className={["board", "board--pyramid", debugHitTest ? "board--debug" : "",
      debugHitTest && debugShowGrid ? 'board--dbg-grid' : '',
      debugHitTest && debugShowOverlays ? 'board--dbg-overlays' : '',
      debugHitTest && debugShowCellOutlines ? 'board--dbg-cells' : '',
      debugHitTest && debugShowDisabledCells ? 'board--dbg-disabled' : '',
      debugHitTest && debugShowClickable ? 'board--dbg-clickable' : '',
      noShade[0] ? 'no-shade-l0' : '',
      noShade[1] ? 'no-shade-l1' : '',
      noShade[2] ? 'no-shade-l2' : '',
      noShade[3] ? 'no-shade-l3' : '',
      shadeOnlyHoles ? 'shade-only-holes' : '',
      showHoleBorders ? 'hole-borders' : ''
    ].join(' ').trim()} style={style}>
      <div
        className={["level", "level--board"].join(' ')}
        data-level={0}
        style={{ gridTemplateColumns: `repeat(${baseSize}, var(--cell-size))`, justifyContent: 'center' }}
      >
        {Array.from({ length: baseSize }).map((_, r) => (
          <Fragment key={`L0-R${r}`}>
            {Array.from({ length: baseSize }).map((_, c) => renderCellBtn({ level: 0, row: r, col: c }))}
          </Fragment>
        ))}

        {/* Overlay upper levels centered over the base */}
        {Array.from({ length: LEVELS - 1 }).map((_, idx) => {
          const level = idx + 1;
          const size = levelSize(level);
          return (
            <div
              key={`overlay-${level}`}
              className={["level", "level--overlay"].join(' ')}
              data-overlay-cols={size}
              data-level={level}
              style={{
                gridTemplateColumns: `repeat(${size}, var(--cell-size))`,
                justifyContent: 'center',
                ['--overlay-cols' as any]: size,
                zIndex: 10 + level, // ensure overlays (>=11) sit above base (z-index: 2)
              }}
            >
              {Array.from({ length: size }).map((_, r) => (
                <Fragment key={`L${level}-R${r}`}>
                  {Array.from({ length: size }).map((_, c) => renderCellBtn({ level, row: r, col: c }))}
                </Fragment>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Board;
