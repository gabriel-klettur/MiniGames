import React from 'react';
import InfoPanel from './InfoPanel';
import Board from './Board';
import type { GameState } from '../game/types';
import type { Position } from '../game/types';

type Props = {
  state: GameState;
  aiEnemy: 'L' | 'D' | null;
  aiThinking: boolean;
  aiThinkingSide?: 'L' | 'D' | null;
  lastActorL?: 'ai' | 'human';
  lastActorD?: 'ai' | 'human';
  reservesOverride?: { L: number; D: number } | null;
  currentPieceRef: React.MutableRefObject<HTMLSpanElement | null>;
  reserveLightRef: React.MutableRefObject<HTMLSpanElement | null>;
  reserveDarkRef: React.MutableRefObject<HTMLSpanElement | null>;
  // Board props
  onCellClick: (pos: Position) => void;
  onDragStart: (pos: Position) => void;
  onDragEnd: () => void;
  highlights: Set<string>;
  selected: Position | undefined;
  posKey: (p: Position) => string;
  appearKeys: Set<string>;
  flashKeys: Set<string>;
  noShade: { 0: boolean; 1: boolean; 2: boolean; 3: boolean };
  shadeOnlyHoles: boolean;
  showHoleBorders: boolean;
  hiddenKeys: Set<string>;
};

export default function GameView(props: Props) {
  const {
    state,
    aiEnemy,
    aiThinking,
    aiThinkingSide,
    lastActorL,
    lastActorD,
    reservesOverride,
    currentPieceRef,
    reserveLightRef,
    reserveDarkRef,
    onCellClick,
    onDragStart,
    onDragEnd,
    highlights,
    selected,
    posKey,
    appearKeys,
    flashKeys,
    noShade,
    shadeOnlyHoles,
    showHoleBorders,
    hiddenKeys,
  } = props;

  return (
    <>
      <InfoPanel
        state={state}
        aiEnemy={aiEnemy}
        aiThinking={aiThinking}
        aiThinkingSide={aiThinkingSide}
        lastActorL={lastActorL}
        lastActorD={lastActorD}
        reservesOverride={reservesOverride || undefined}
        currentPieceRef={currentPieceRef}
        reserveLightRef={reserveLightRef}
        reserveDarkRef={reserveDarkRef}
      />
      <Board
        state={state}
        onCellClick={onCellClick}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        highlights={highlights}
        selected={selected}
        posKey={posKey}
        appearKeys={appearKeys}
        flashKeys={flashKeys}
        noShade={noShade}
        shadeOnlyHoles={shadeOnlyHoles}
        showHoleBorders={showHoleBorders}
        hiddenKeys={hiddenKeys}
      />
    </>
  );
}
