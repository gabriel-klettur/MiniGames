import type { GameState, Player, Position, Board } from '../game/types';
import { positions, getCell, isEmpty, isSupported, setCell, levelSize, isFree } from '../game/board';

export type PlaceMove = { kind: 'place'; dest: Position; recovers?: Position[] };
export type LiftMove = { kind: 'lift'; src: Position; dest: Position; recovers?: Position[] };
export type AIMove = PlaceMove | LiftMove;

function other(p: Player): Player { return p === 'L' ? 'D' : 'L'; }

// Pattern detection (aligned with rules.ts)
function hasSquareAt(board: Board, player: Player, level: number, row: number, col: number): boolean {
  if (level < 0 || level >= 4) return false;
  const size = levelSize(level);
  if (row < 0 || col < 0 || row + 1 >= size || col + 1 >= size) return false;
  return (
    getCell(board, { level, row, col }) === player &&
    getCell(board, { level, row: row + 1, col }) === player &&
    getCell(board, { level, row, col: col + 1 }) === player &&
    getCell(board, { level, row: row + 1, col: col + 1 }) === player
  );
}

function formsAnyNewSquare(boardBefore: Board, boardAfter: Board, player: Player, affected: Position): boolean {
  const l = affected.level;
  for (let dr = -1; dr <= 0; dr++) {
    for (let dc = -1; dc <= 0; dc++) {
      const r = affected.row + dr;
      const c = affected.col + dc;
      const now = hasSquareAt(boardAfter, player, l, r, c);
      if (!now) continue;
      const before = hasSquareAt(boardBefore, player, l, r, c);
      if (!before) return true;
    }
  }
  return false;
}

function lineLengthRequired(level: number): number | null {
  if (level === 0) return 4;
  if (level === 1) return 3;
  return null;
}

function formsAnyNewLine(boardBefore: Board, boardAfter: Board, player: Player, affected: Position): boolean {
  const req = lineLengthRequired(affected.level);
  if (!req) return false;
  const size = levelSize(affected.level);
  // Row windows
  for (let start = 0; start + req - 1 < size; start++) {
    const end = start + req - 1;
    if (affected.col < start || affected.col > end) continue;
    const now = Array.from({ length: req }).every((_, i) => getCell(boardAfter, { level: affected.level, row: affected.row, col: start + i }) === player);
    if (!now) continue;
    const before = Array.from({ length: req }).every((_, i) => getCell(boardBefore, { level: affected.level, row: affected.row, col: start + i }) === player);
    if (!before) return true;
  }
  // Column windows
  for (let start = 0; start + req - 1 < size; start++) {
    const end = start + req - 1;
    if (affected.row < start || affected.row > end) continue;
    const now = Array.from({ length: req }).every((_, i) => getCell(boardAfter, { level: affected.level, row: start + i, col: affected.col }) === player);
    if (!now) continue;
    const before = Array.from({ length: req }).every((_, i) => getCell(boardBefore, { level: affected.level, row: start + i, col: affected.col }) === player);
    if (!before) return true;
  }
  return false;
}

function validMoveDestinations(board: Board, source: Position): Position[] {
  // must move upwards only; simulate removing the source before checking support
  const temp = setCell(board, source, null);
  const all = positions();
  return all.filter((p) => p.level > source.level && isEmpty(board, p) && isSupported(temp, p));
}

function freePiecesOf(board: Board, player: Player): Position[] {
  return positions().filter((p) => getCell(board, p) === player && isFree(board, p));
}

export function generateBaseMoves(state: GameState): AIMove[] {
  const moves: AIMove[] = [];
  const me = state.currentPlayer;
  // Placements
  if (state.reserves[me] > 0) {
    for (const p of positions()) {
      if (isEmpty(state.board, p) && isSupported(state.board, p)) {
        moves.push({ kind: 'place', dest: p });
      }
    }
  }
  // Lifts
  for (const src of positions()) {
    if (getCell(state.board, src) !== me) continue;
    if (!isFree(state.board, src)) continue;
    const dests = validMoveDestinations(state.board, src);
    for (const dest of dests) {
      moves.push({ kind: 'lift', src, dest });
    }
  }
  return moves;
}

function applyBase(board: Board, player: Player, mv: AIMove): Board {
  if (mv.kind === 'place') {
    return setCell(board, mv.dest, player);
  } else {
    let tmp = setCell(board, mv.src, null);
    tmp = setCell(tmp, mv.dest, player);
    return tmp;
  }
}

function withRecover(board: Board, player: Player, recovers: Position[] | undefined): { board: Board; recovered: number } {
  let out = board;
  let cnt = 0;
  if (recovers && recovers.length > 0) {
    for (const pos of recovers) {
      if (getCell(out, pos) === player && isFree(out, pos)) {
        out = setCell(out, pos, null);
        cnt += 1;
      }
    }
  }
  return { board: out, recovered: cnt };
}

function scored(previous: Board, after: Board, player: Player, affected: Position): boolean {
  return formsAnyNewSquare(previous, after, player, affected) || formsAnyNewLine(previous, after, player, affected);
}

export function expandWithRecover(state: GameState, base: AIMove): AIMove[] {
  const me = state.currentPlayer;
  const before = state.board;
  const after = applyBase(before, me, base);
  const affected = base.kind === 'place' ? base.dest : base.dest;
  if (!scored(before, after, me, affected)) {
    return [base];
  }
  // Must recover at least 1 and up to 2 free pieces (if available)
  const free = freePiecesOf(after, me);
  const limited = free.slice(0, 4); // limit branching (reduce branching factor)
  const expansions: AIMove[] = [];
  for (let i = 0; i < limited.length; i++) {
    const one = limited[i];
    expansions.push({ ...(base as any), recovers: [one] });
    for (let j = i + 1; j < limited.length; j++) {
      const two = limited[j];
      expansions.push({ ...(base as any), recovers: [one, two] });
    }
  }
  return expansions.length > 0 ? expansions : [base];
}

export function applyMove(state: GameState, mv: AIMove): GameState {
  const me = state.currentPlayer;
  const opp = other(me);
  let board = state.board;
  let reserves = { ...state.reserves } as typeof state.reserves;

  if (mv.kind === 'place') {
    board = setCell(board, mv.dest, me);
    reserves = { ...reserves, [me]: reserves[me] - 1 };
  } else {
    board = setCell(board, mv.src, null);
    board = setCell(board, mv.dest, me);
  }

  const recovered = withRecover(board, me, mv.recovers);
  board = recovered.board;
  reserves = { ...reserves, [me]: reserves[me] + recovered.recovered };

  const next: GameState = {
    ...state,
    board,
    reserves,
    currentPlayer: opp,
    phase: 'play',
    selectedSource: undefined,
    recovery: undefined,
  };
  return next;
}

export function generateAllMoves(state: GameState): AIMove[] {
  const base = generateBaseMoves(state);
  const out: AIMove[] = [];
  for (const m of base) {
    const exps = expandWithRecover(state, m);
    for (const e of exps) out.push(e);
  }
  return out;
}
