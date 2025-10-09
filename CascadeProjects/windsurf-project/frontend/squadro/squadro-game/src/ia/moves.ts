import type { GameState, Player } from '../game/types';
import { movePiece as applyMoveRules } from '../game/rules';

/**
 * generateMoves — retorna IDs de piezas movibles del jugador en turno.
 */
export function generateMoves(gs: GameState): string[] {
  return gs.pieces
    .filter((p) => p.owner === gs.turn && p.state !== 'retirada')
    .map((p) => p.id);
}

/**
 * applyMove — aplica un movimiento (ID de pieza) clonando el estado.
 * Devuelve el nuevo GameState tras aplicar reglas.
 */
export function applyMove(state: GameState, moveId: string): GameState {
  const clone = deepClone(state);
  applyMoveRules(clone, moveId);
  return clone;
}

/**
 * orderMoves — heurística simple para ordenar movimientos.
 * Prioriza:
 * 1) Movimientos que retiran una pieza.
 * 2) Movimientos que realizan salto(s).
 * 3) Progreso neto estimado.
 * 4) Heurística de historia/killers (si se provee).
 */
export function orderMoves(
  gs: GameState,
  moves: string[],
  me: Player,
  opts?: {
    hashMove?: string | null;
    killers?: string[]; // máx 2 sugeridos
    history?: Map<string, number>; // key = `${player}:${moveId}`
  },
): string[] {
  const entries = moves.map((m) => {
    const beforeScore = roughProgress(gs, me);
    const child = applyMove(gs, m);
    const afterScore = roughProgress(child, me);
    const gain = afterScore - beforeScore;
    const didRetire = completesNow(child, me, m);
    const opp: Player = me === 'Light' ? 'Dark' : 'Light';
    const jumpDeltaOpp = approxOppSendBackCount(gs, child, opp); // opp_loss
    const didJump = jumpDeltaOpp > 0;

    // Penalize if opponent (to move in child) can immediately jump us
    const oppImmediateJump = opponentHasImmediateJump(child);

    // Safe progress: favor gain but subtract exposure penalty
    const safeProg = gain - (oppImmediateJump ? 200 : 0);

    const histKey = `${me}:${m}`;
    const hist = opts?.history?.get(histKey) ?? 0;

    let pri = 0;
    if (opts?.hashMove && m === opts.hashMove) pri += 10000;
    if (opts?.killers && opts.killers.includes(m)) pri += 8000;
    if (didRetire) pri += 10000; // completing now is top priority
    if (didJump) pri += 2500 + 500 * Math.min(3, jumpDeltaOpp);
    pri += Math.max(-600, Math.min(600, safeProg));
    pri += Math.min(1000, hist);

    return { m, pri };
  });
  entries.sort((a, b) => b.pri - a.pri);
  return entries.map((e) => e.m);
}

// --- helpers ---

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function roughProgress(gs: GameState, side: Player): number {
  let score = 0;
  for (const p of gs.pieces) {
    const lane = gs.lanesByPlayer[p.owner][p.laneIndex];
    const full = lane.length * 2;
    let prog = 0;
    if (p.state === 'retirada') prog = full + 1;
    else if (p.state === 'en_ida') prog = p.pos;
    else prog = lane.length + (lane.length - p.pos);
    score += (p.owner === side ? +prog : -prog);
  }
  return score;
}

function didLastMoveRetire(gs: GameState, side: Player): boolean {
  // Si alguna pieza del lado 'side' pasó a 'retirada', el progreso incremental suele ser alto.
  return gs.pieces.some((p) => p.owner === side && p.state === 'retirada');
}

function approximateDidJump(before: GameState, after: GameState): boolean {
  // Heurística: si el número de piezas en posición de borde (pos==0 o pos==L) del rival aumenta,
  // es probable que haya habido salto que las envió atrás.
  const countEdge = (gs: GameState, owner: Player) => {
    let c = 0;
    for (const p of gs.pieces) {
      if (p.owner !== owner || p.state === 'retirada') continue;
      const L = gs.lanesByPlayer[p.owner][p.laneIndex].length;
      if (p.pos === 0 || p.pos === L) c++;
    }
    return c;
  };
  const opp: Player = before.turn === 'Light' ? 'Dark' : 'Light';
  return countEdge(after, opp) > countEdge(before, opp);
}

// ===== Enhancements for client heuristic =====
function completesNow(after: GameState, me: Player, moveId: string): boolean {
  const p = after.pieces.find((x) => x.id === moveId);
  return !!p && p.owner === me && p.state === 'retirada';
}

function approxOppSendBackCount(before: GameState, after: GameState, opp: Player): number {
  const countEdge = (gs: GameState, owner: Player) => {
    let c = 0;
    for (const p of gs.pieces) {
      if (p.owner !== owner || p.state === 'retirada') continue;
      const L = gs.lanesByPlayer[p.owner][p.laneIndex].length;
      if (p.pos === 0 || p.pos === L) c++;
    }
    return c;
  };
  return Math.max(0, countEdge(after, opp) - countEdge(before, opp));
}

function opponentHasImmediateJump(child: GameState): boolean {
  const opp: Player = child.turn; // after our move, it's opponent's turn
  for (const q of child.pieces) {
    if (q.owner !== opp || q.state === 'retirada') continue;
    const lane = child.lanesByPlayer[q.owner][q.laneIndex];
    const dir = q.state === 'en_ida' ? +1 : -1;
    const speed = q.state === 'en_ida' ? lane.speedOut : lane.speedBack;
    const maxProbe = Math.min(Math.abs(speed), 2);
    for (let s = 1; s <= maxProbe; s++) {
      const pos = q.pos + dir * s;
      if (pos < 0 || pos > lane.length) break;
      if (anyOppAt(child, q.owner, q.laneIndex, pos)) return true;
    }
  }
  return false;
}

function anyOppAt(gs: GameState, owner: Player, laneIndex: number, pos: number): boolean {
  const opp = owner === 'Light' ? 'Dark' : 'Light';
  const { row: tr, col: tc } = coordOf(owner, laneIndex, pos, gs);
  for (const p of gs.pieces) {
    if (p.owner !== opp || p.state === 'retirada') continue;
    const { row, col } = coordOf(p.owner, p.laneIndex, p.pos, gs);
    if (row === tr && col === tc) return true;
  }
  return false;
}

function coordOf(owner: Player, laneIndex: number, pos: number, gs: GameState): { row: number; col: number } {
  const L = gs.lanesByPlayer[owner][laneIndex].length;
  const offset = 1;
  if (owner === 'Light') return { row: laneIndex + offset, col: L - pos };
  return { row: L - pos, col: laneIndex + offset };
}
