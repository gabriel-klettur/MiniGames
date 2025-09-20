import type { Board, GameState, Player, Position } from './types';
import { LEVELS, canPlaceAt, cloneBoard, createEmptyBoard, getCell, isEmpty, isFree, isSupported, levelSize, positions, setCell } from './board';
import { otherPlayer } from './types';

// Helpers to detect patterns
function hasSquareAt(board: Board, player: Player, level: number, row: number, col: number): boolean {
  if (level < 0 || level >= LEVELS) return false;
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
  // Only squares that include the affected destination can be newly formed.
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
  if (level === 0) return 4; // 4 in a row on base
  if (level === 1) return 3; // 3 in a row on second level
  return null; // others not counted for variant
}

function formsAnyNewLine(boardBefore: Board, boardAfter: Board, player: Player, affected: Position): boolean {
  const req = lineLengthRequired(affected.level);
  if (!req) return false;
  const size = levelSize(affected.level);
  // Check all windows of length req in row and column that include affected.col or affected.row
  // Row check
  for (let start = 0; start + req - 1 < size; start++) {
    const end = start + req - 1;
    if (affected.col < start || affected.col > end) continue;
    const now = Array.from({ length: req }).every((_, i) => getCell(boardAfter, { level: affected.level, row: affected.row, col: start + i }) === player);
    if (!now) continue;
    const before = Array.from({ length: req }).every((_, i) => getCell(boardBefore, { level: affected.level, row: affected.row, col: start + i }) === player);
    if (!before) return true;
  }
  // Column check
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

function freePiecesOf(board: Board, player: Player): Position[] {
  return positions().filter((p) => getCell(board, p) === player && isFree(board, p));
}

// Exported helper for UI highlighting during recovery phase
export function recoverablePositions(board: Board, player: Player): Position[] {
  return freePiecesOf(board, player);
}

export function initialState(): GameState {
  const board = createEmptyBoard();
  return {
    board,
    currentPlayer: 'L',
    reserves: { L: 15, D: 15 },
    phase: 'play',
    selectedSource: undefined,
    recovery: undefined,
  };
}

export function validReserveDestinations(board: Board): Position[] {
  return positions().filter((p) => canPlaceAt(board, p));
}

export function validMoveDestinations(board: Board, source: Position): Position[] {
  // must move upwards only; simulate removing the source before checking support
  const temp = setCell(board, source, null);
  return positions().filter((p) => p.level > source.level && isEmpty(board, p) && isSupported(temp, p));
}

export type ActionResult = {
  state: GameState;
  error?: string;
};

function startRecoveryIfAny(previousBoard: Board, state: GameState, affected: Position): GameState {
  const player = state.currentPlayer;
  const formedSquare = formsAnyNewSquare(previousBoard, state.board, player, affected);
  const formedLine = formsAnyNewLine(previousBoard, state.board, player, affected);
  const scored = formedSquare || formedLine;
  try {
    console.info('[rules] startRecoveryIfAny', { player, affected, formedSquare, formedLine, scored });
  } catch {}
  if (!scored) {
    return { ...state, phase: 'play' };
  }
  const free = freePiecesOf(state.board, player);
  const available = free.length;
  // If there are no free pieces to recover, skip recovery phase entirely.
  // Caller will handle switching the turn when phase !== 'recover'.
  if (available === 0) {
    try { console.info('[rules] skip recover — no free pieces'); } catch {}
    return { ...state, phase: 'play' };
  }
  const remaining = Math.min(2, available);
  const minRequired = 1;
  try { console.info('[rules] enter recover', { available, remaining, minRequired }); } catch {}
  return {
    ...state,
    phase: 'recover',
    recovery: {
      player,
      remaining,
      minRequired,
      removedSoFar: 0,
    },
  };
}

export function placeFromReserve(state: GameState, dest: Position): ActionResult {
  if (state.phase !== 'play') return { state, error: 'No es el momento de colocar desde reserva.' };
  if (state.reserves[state.currentPlayer] <= 0) return { state, error: 'No quedan bolas en la reserva.' };
  if (!canPlaceAt(state.board, dest)) return { state, error: 'Casilla no válida para colocar.' };

  const before = cloneBoard(state.board);
  let board = setCell(state.board, dest, state.currentPlayer);
  const reserves = { ...state.reserves, [state.currentPlayer]: state.reserves[state.currentPlayer] - 1 };
  let next: GameState = { ...state, board, reserves };
  next = startRecoveryIfAny(before, next, dest);
  try { console.info('[rules] placeFromReserve -> after scoring check', { dest, phase: next.phase, recovery: next.recovery }); } catch {}
  if (next.phase !== 'recover') {
    next.currentPlayer = otherPlayer(state.currentPlayer);
  }
  return { state: next };
}

export function selectMoveSource(state: GameState, source: Position): ActionResult {
  if (state.phase !== 'play') return { state, error: 'No es el momento de seleccionar una pieza a mover.' };
  const owner = getCell(state.board, source);
  if (owner !== state.currentPlayer) return { state, error: 'Debes elegir una pieza propia.' };
  if (!isFree(state.board, source)) {
    try { console.info('[rules] selectMoveSource rejected — not free/supporting', { source }); } catch {}
    return { state, error: 'Esa pieza no está libre para mover.' };
  }
  // Only allow selection if there is at least one valid upward destination.
  const moves = validMoveDestinations(state.board, source);
  if (moves.length === 0) {
    try { console.info('[rules] selectMoveSource rejected — no valid destinations', { source }); } catch {}
    return { state, error: 'Esa pieza no tiene destinos válidos para subir.' };
  }
  try { console.info('[rules] selectMoveSource ok', { source }); } catch {}
  return { state: { ...state, selectedSource: source, phase: 'selectMoveDest' } };
}

export function cancelMoveSelection(state: GameState): ActionResult {
  if (state.phase !== 'selectMoveDest') return { state };
  return { state: { ...state, selectedSource: undefined, phase: 'play' } };
}

export function movePiece(state: GameState, dest: Position): ActionResult {
  if (state.phase !== 'selectMoveDest' || !state.selectedSource) return { state, error: 'No hay movimiento en curso.' };
  const src = state.selectedSource;
  if (dest.level <= src.level) return { state, error: 'Solo puedes subir piezas.' };
  // Validate destination with source removed: cannot use the source as one of the supports
  if (!isEmpty(state.board, dest)) return { state, error: 'Destino inválido (ocupado).' };
  const temp = setCell(state.board, src, null);
  if (!isSupported(temp, dest)) return { state, error: 'Destino inválido (sin soporte suficiente).' };

  const before = cloneBoard(state.board);
  let board = setCell(state.board, src, null);
  board = setCell(board, dest, state.currentPlayer);
  let next: GameState = { ...state, board, selectedSource: undefined, phase: 'play' };
  next = startRecoveryIfAny(before, next, dest);
  try { console.info('[rules] movePiece -> after scoring check', { src, dest, phase: next.phase, recovery: next.recovery }); } catch {}
  if (next.phase !== 'recover') {
    next.currentPlayer = otherPlayer(state.currentPlayer);
  }
  return { state: next };
}

export function recoverPiece(state: GameState, pos: Position): ActionResult {
  const rec = state.recovery;
  if (state.phase !== 'recover' || !rec) return { state, error: 'No se pueden recuperar piezas ahora.' };
  if (rec.player !== state.currentPlayer) return { state, error: 'No es tu turno para recuperar.' };
  if (getCell(state.board, pos) !== rec.player) return { state, error: 'Solo puedes recuperar piezas propias.' };
  if (!isFree(state.board, pos)) return { state, error: 'Solo puedes recuperar piezas libres.' };
  if (rec.remaining <= 0) return { state, error: 'Ya recuperaste el máximo permitido.' };

  const board = setCell(state.board, pos, null);
  const reserves = { ...state.reserves, [rec.player]: state.reserves[rec.player] + 1 };
  const removedSoFar = rec.removedSoFar + 1;
  const remaining = rec.remaining - 1;

  let next: GameState = {
    ...state,
    board,
    reserves,
    recovery: { ...rec, removedSoFar, remaining },
  };
  try { console.info('[rules] recoverPiece', { pos, removedSoFar, remaining }); } catch {}

  // If no more remaining or no more free pieces, finish recovery automatically
  const stillFree = freePiecesOf(board, rec.player).length;
  if (remaining <= 0 || stillFree <= 0) {
    try { console.info('[rules] recoverPiece -> auto finish', { stillFree }); } catch {}
    return finishRecovery(next);
  }
  return { state: next };
}

export function finishRecovery(state: GameState): ActionResult {
  const rec = state.recovery;
  if (state.phase !== 'recover' || !rec) return { state };
  if (rec.removedSoFar < rec.minRequired) {
    return { state, error: `Debes recuperar al menos ${rec.minRequired} pieza(s).` };
  }
  const next: GameState = {
    ...state,
    phase: 'play',
    recovery: undefined,
    currentPlayer: otherPlayer(state.currentPlayer),
  };
  try { console.info('[rules] finishRecovery', { removedSoFar: rec.removedSoFar, minRequired: rec.minRequired }); } catch {}
  return { state: next };
}

export function isGameOver(state: GameState): { over: boolean; winner?: Player; reason?: string } {
  // Win conditions:
  // 1) A player places the last ball at the top (level 3, 0,0)
  const top = getCell(state.board, { level: 3, row: 0, col: 0 });
  if (top !== null) {
    return { over: true, winner: top, reason: 'La cima de la pirámide fue ocupada.' };
  }
  // 2) Opponent has no reserves and no movable/free pieces? Official rule says: a player who runs out of balls loses
  // Interpret: If current player must play and has no reserve and no legal moves, then they lose.
  const p = state.currentPlayer;
  const canPlace = state.reserves[p] > 0 && validReserveDestinations(state.board).length > 0;
  const canMove = positions()
    .some((src) => getCell(state.board, src) === p && isFree(state.board, src) && validMoveDestinations(state.board, src).length > 0);
  if (!canPlace && !canMove) {
    return { over: true, winner: otherPlayer(p), reason: 'El jugador activo no puede jugar (sin bolas ni movimientos).' };
  }
  return { over: false };
}
