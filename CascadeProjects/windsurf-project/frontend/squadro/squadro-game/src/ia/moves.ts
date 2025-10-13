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
    jitter?: number; // optional symmetric jitter in priority, ~Uniform(-eps, +eps)
  },
): string[] {
  const entries = moves.map((m) => {
    const beforeScore = roughProgress(gs, me);
    const child = applyMove(gs, m);
    const afterScore = roughProgress(child, me);
    const gain = afterScore - beforeScore;
    const didRetire = completesNow(child, me, m);
    const opp: Player = me === 'Light' ? 'Dark' : 'Light';
    const chain = sendBackCount(gs, child, opp); // cuenta precisa de rivales devueltos
    const didJump = chain > 0;

    // Penalize if opponent (to move in child) can immediately jump us
    const oppImmediateJump = opponentHasImmediateJump(child);
    const oppImmediateJumpsCount = countOpponentImmediateJumps(child);

    // Amenaza a 1‑ply en nuestro siguiente turno (aprox)
    const threat = createsThreatNext(child, me) ? 1 : 0;

    // Waste move en borde sin conceder captura inmediata
    const waste = isWasteMove(child, me, m) && !oppImmediateJump ? 1 : 0;

    // SEE-like term: reward our jump potential, penalize opponent's immediate jump capacity
    const seeTerm = (didJump ? (800 + 300 * Math.min(3, chain)) : 0) - (oppImmediateJumpsCount * 700);

    // Safe progress: favor gain but subtract exposure penalties
    const safeProg = gain - (oppImmediateJump ? 300 : 0) - (oppImmediateJumpsCount * 250);

    const histKey = `${me}:${m}`;
    const hist = opts?.history?.get(histKey) ?? 0;

    let pri = 0;
    if (opts?.hashMove && m === opts.hashMove) pri += 10000;
    if (opts?.killers && opts.killers.includes(m)) pri += 8000;
    // 1) Terminar ahora: máximo
    if (didRetire) pri += 10000;
    // 2) Capturas que devuelven 2+ rivales
    if (chain >= 2) pri += 6000 + 800 * Math.min(3, chain - 1);
    // 3) Captura simple
    else if (chain === 1) pri += 3500;
    // 4) Amenaza de captura al siguiente turno (segura)
    if (threat) pri += 1200;
    // 5) Waste move en borde sin riesgo
    if (waste) pri += 800;
    pri += Math.max(-600, Math.min(600, safeProg));
    // SEE term bounded to avoid domination
    pri += Math.max(-800, Math.min(800, seeTerm));
    pri += Math.min(1000, hist);
    // Apply tiny jitter to break ties deterministically across runs when enabled
    const eps = typeof opts?.jitter === 'number' ? Math.max(0, opts.jitter) : 0;
    if (eps > 0) {
      // Uniform in [-eps, +eps]
      pri += (Math.random() * 2 * eps) - eps;
    }

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

// ===== Enhancements for client heuristic =====
export function completesNow(after: GameState, me: Player, moveId: string): boolean {
  const p = after.pieces.find((x) => x.id === moveId);
  return !!p && p.owner === me && p.state === 'retirada';
}

export function approxOppSendBackCount(before: GameState, after: GameState, opp: Player): number {
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

// Preciso: cuenta cuántos rivales fueron devueltos a su posición de reset según su estado previo
function sendBackCount(before: GameState, after: GameState, opp: Player): number {
  let c = 0;
  for (const qb of before.pieces) {
    if (qb.owner !== opp || qb.state === 'retirada') continue;
    const lane = before.lanesByPlayer[qb.owner][qb.laneIndex];
    const resetPos = qb.state === 'en_ida' ? 0 : lane.length;
    if (qb.pos === resetPos) continue; // ya estaba en reset antes
    const qa = after.pieces.find((x) => x.id === qb.id);
    if (!qa) continue;
    if (qa.pos === resetPos) c++;
  }
  return c;
}

function opponentHasImmediateJump(child: GameState): boolean {
  const opp: Player = child.turn; // after our move, it's opponent's turn
  for (const q of child.pieces) {
    if (q.owner !== opp || q.state === 'retirada') continue;
    const lane = child.lanesByPlayer[q.owner][q.laneIndex];
    const dir = q.state === 'en_ida' ? +1 : -1;
    const speed = q.state === 'en_ida' ? lane.speedOut : lane.speedBack;
    const maxProbe = Math.min(Math.abs(speed), 3);
    for (let s = 1; s <= maxProbe; s++) {
      const pos = q.pos + dir * s;
      if (pos < 0 || pos > lane.length) break;
      if (anyOppAt(child, q.owner, q.laneIndex, pos)) return true;
    }
  }
  return false;
}

// Count number of opponent pieces that have at least one immediate jump after our move
function countOpponentImmediateJumps(child: GameState): number {
  const opp: Player = child.turn; // after our move, it's opponent's turn
  let count = 0;
  for (const q of child.pieces) {
    if (q.owner !== opp || q.state === 'retirada') continue;
    const lane = child.lanesByPlayer[q.owner][q.laneIndex];
    const dir = q.state === 'en_ida' ? +1 : -1;
    const speed = q.state === 'en_ida' ? lane.speedOut : lane.speedBack;
    const maxProbe = Math.min(Math.abs(speed), 3);
    let canJump = false;
    for (let s = 1; s <= maxProbe; s++) {
      const pos = q.pos + dir * s;
      if (pos < 0 || pos > lane.length) break;
      if (anyOppAt(child, q.owner, q.laneIndex, pos)) { canJump = true; break; }
    }
    if (canJump) count++;
  }
  return count;
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

/**
 * generateTacticalMoves — subconjunto de movimientos "tácticos" para Quiescence.
 * Incluye:
 * - Movimientos que retiran una pieza propia en este mismo turno.
 * - Movimientos que provocan cadena de send-backs (>=1) detectada con precisión.
 * - Movimientos que crean amenaza clara a 1‑ply para el siguiente turno propio.
 */
export function generateTacticalMoves(gs: GameState): string[] {
  const side: Player = gs.turn;
  const opp: Player = side === 'Light' ? 'Dark' : 'Light';
  const moves = generateMoves(gs);
  const tactical: string[] = [];
  for (const m of moves) {
    const child = applyMove(gs, m);
    const didRetire = completesNow(child, side, m);
    const chain = sendBackCount(gs, child, opp);
    const didJump = chain > 0;
    const threat = createsThreatNext(child, side);
    if (didRetire || didJump || threat) tactical.push(m);
  }
  return tactical;
}

// Amenaza a 1‑ply aproximada: en el child (mueve el rival), ¿alguna pieza nuestra quedará a 1 paso de saltar
// sobre una pieza rival en nuestro siguiente turno, por pura geometría y velocidades actuales?
function createsThreatNext(child: GameState, me: Player): boolean {
  // Miramos posiciones de child (turno del rival). Si en nuestro próximo turno
  // cualquiera de nuestras piezas podría alcanzar una intersección ocupada por el rival con un paso realista,
  // lo consideramos amenaza.
  for (const my of child.pieces) {
    if (my.owner !== me || my.state === 'retirada') continue;
    const lane = child.lanesByPlayer[my.owner][my.laneIndex];
    const dir = my.state === 'en_ida' ? +1 : -1;
    const speed = my.state === 'en_ida' ? lane.speedOut : lane.speedBack;
    const maxProbe = Math.min(Math.abs(speed), 3);
    for (let s = 1; s <= maxProbe; s++) {
      const np = my.pos + dir * s;
      if (np < 0 || np > lane.length) break;
      if (anyOppAt(child, my.owner, my.laneIndex, np)) return true;
    }
  }
  return false;
}

// Waste move: el movimiento termina en borde (0 o L) del carril de la pieza movida en child.
function isWasteMove(child: GameState, me: Player, moveId: string): boolean {
  const p = child.pieces.find((x) => x.id === moveId);
  if (!p || p.owner !== me) return false;
  const L = child.lanesByPlayer[p.owner][p.laneIndex].length;
  // consideramos waste si termina exactamente en borde; no comprobamos sobras de paso explícitas
  return p.pos === 0 || p.pos === L;
}
