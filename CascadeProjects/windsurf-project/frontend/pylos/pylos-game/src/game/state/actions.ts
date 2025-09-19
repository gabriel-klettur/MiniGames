import type { Cell } from '../types';

export type GameAction =
  | { type: 'PLACE'; cell: Cell }
  | { type: 'CLIMB'; src: Cell; dst: Cell }
  | { type: 'REMOVE'; cell: Cell }
  | { type: 'FINISH_REMOVAL' }
  | { type: 'RESET'; expertMode?: boolean }
  | { type: 'SET_EXPERT_MODE'; value: boolean };
