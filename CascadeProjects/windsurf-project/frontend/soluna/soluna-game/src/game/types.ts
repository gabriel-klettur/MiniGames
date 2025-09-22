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
}

export type GameAction =
  | { type: 'select'; id: string }
  | { type: 'attempt-merge'; targetId: string }
  | { type: 'move-tower'; id: string; pos: { x: number; y: number } }
  | { type: 'new-round' }
  | { type: 'reset-game' };
