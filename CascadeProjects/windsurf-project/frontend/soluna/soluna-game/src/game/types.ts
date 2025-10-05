export type SymbolType = 'sol' | 'luna' | 'estrella' | 'fugaz';

export interface Tower {
  id: string;
  stack: SymbolType[]; // bottom -> top
  height: number; // equals stack.length
  top: SymbolType; // equals stack[stack.length - 1]
  // Normalized position inside play area ellipse [0..1]
  pos: { x: number; y: number };
}

export interface PlayerState {
  stars: number;
}

export interface GameState {
  towers: Tower[];
  selectedId: string | null;
  currentPlayer: 1 | 2;
  lastMover: 1 | 2 | null;
  roundOver: boolean;
  gameOver: boolean;
  players: { 1: PlayerState; 2: PlayerState };
  // Transient merge effect info to trigger UI animations
  mergeFx: MergeFx | null;
  // Game mode: in 'normal' we wait for animations to end before switching turns.
  // In 'simulation' we skip animations and change turns immediately.
  mode?: 'normal' | 'simulation';
  // When in 'normal' mode, store the next player to switch to once the merge animation ends
  pendingTurn?: 1 | 2 | null;
  // Custom setup state (NO Aleatoreo): when open, board shows 4x3 empty grid for selecting symbols
  customSetup?: {
    open: boolean;
    // 12 cells, row-major, values are selected symbol or null if empty
    cells: (SymbolType | null)[];
  };
}

export interface MergeFx {
  mergedId: string; // id of the resulting merged tower
  fromId: string; // source tower id (placed on top)
  targetId: string; // target tower id (base)
  at: number; // timestamp (ms)
  from: { x: number; y: number }; // normalized source position
  to: { x: number; y: number };   // normalized target position
  sourceStack: SymbolType[];      // stack that is flying
  // Optional absolute pixel positions relative to play-field at dispatch time
  fromPx?: { x: number; y: number };
  toPx?: { x: number; y: number };
  // Post-merge state to commit after the flight animation ends (normal mode)
  // These fields allow deferring the visual update until onAnimationEnd.
  towersAfter: Tower[];
  playersAfter: { 1: PlayerState; 2: PlayerState };
  roundOverAfter: boolean;
  gameOverAfter: boolean;
  lastMoverAfter: 1 | 2 | null;
}

export type GameAction =
  | { type: 'select'; id: string }
  | { type: 'attempt-merge'; sourceId: string; targetId: string; from?: { x: number; y: number }; to?: { x: number; y: number }; fromPx?: { x: number; y: number }; toPx?: { x: number; y: number } }
  | { type: 'move-tower'; id: string; pos: { x: number; y: number }; minD?: number }
  | { type: 'resolve-overlaps'; id: string; minD?: number }
  | { type: 'resolve-all-overlaps'; minD?: number }
  | { type: 'new-round' }
  | { type: 'reset-game' }
  | { type: 'commit-merge' }
  | { type: 'clear-merge-fx' }
  | { type: 'set-mode'; mode: 'normal' | 'simulation' }
  // Custom setup actions
  | { type: 'enter-custom-setup' }
  | { type: 'set-custom-cell'; index: number; symbol: SymbolType }
  | { type: 'confirm-custom-setup' }
  | { type: 'cancel-custom-setup' };
