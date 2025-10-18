import type { GameState, Player, Piece } from '../game/types';
import type { EvalParams } from './evalTypes';
import { generateMoves, generateTacticalMoves, applyMove, approxOppSendBackCount } from './moves';

/**
 * evaluate — Heurística para Squadro.
 *
 * Componentes principales (escala del documento Heuristica_v2):
 * - Ventaja de carrera en "acciones" (top-4 sin interacción): 100 pts por tempo de ventaja.
 * - Finalizadas (diferencia): 200 pts por pieza.
 * - Captura inmediata (aprox): 50 pts por rival devuelto (aprox por delta en borde).
 * - Sprint/bloqueo (moderadores): pequeños términos auxiliares (mantener hasta completar las 12 señales).
 */
export interface Features12 {
  race: number;        // 100 * (oppTop4 - myTop4)
  done: number;        // (ownDone - oppDone) — to be multiplied by done_bonus
  clash: number;       // 50 * (oppLoss - myLoss) immed
  chain: number;       // 15 * extras
  sprint: number;      // sprint term already in points
  block: number;       // block term already in points
  parity: number;      // 12 * crossingsWon
  struct: number;      // 10 * chokedLines
  ones: number;        // +30/-30
  ret: number;         // +5/-5
  waste: number;       // 8 * (mine - opp)
  mob: number;         // 6 * (mine - opp)
}

export function computeFeatures(gs: GameState, me: Player, sprintThr: number): Features12 {
  const opp = other(me);
  // Carrera (base)
  const myTop4 = top4TurnsNoInteraction(gs, me);
  const oppTop4 = top4TurnsNoInteraction(gs, opp);
  const race = 100 * (oppTop4 - myTop4);
  // Finalizadas (delta sin pesar)
  const ownDone = countRetired(gs, me);
  const oppDone = countRetired(gs, opp);
  const done = (ownDone - oppDone);
  // Choque inmediato y cadenas
  const clash = 50 * immediateClashDelta(gs);
  const chain = bestMyChain(gs, me); // ya en puntos (15 por extra)
  // Sprint y bloqueo
  const sprint = sprintTerm(gs, me, opp, sprintThr);
  const block = blockQuality(gs, me, opp);
  // Paridad y estructurales
  const parity = parityCrossingScore(gs, me);
  const struct = structuralBlocksScore(gs, me);
  // Ones y retorno
  const ones = onesScoreTerm(gs, me, opp);
  const ret = valueReturn(gs, me, opp);
  // Waste y movilidad
  const wasteMine = hasWasteMove(gs, me) ? 1 : 0;
  const wasteOpp = hasWasteMove(gs, opp) ? 1 : 0;
  const waste = 8 * (wasteMine - wasteOpp);
  const mob = 6 * (safeMobilityCount(gs, me) - safeMobilityCount(gs, opp));
  return { race, done, clash, chain, sprint, block, parity, struct, ones, ret, waste, mob };
}

export function evaluate(gs: GameState, root: Player): number {
  const me = root;

  // Terminal handling: treat wins/losses as near-mate scores so the engine can detect
  // forced outcomes and stop early during iterative deepening.
  // Note: we don't incorporate ply distance here; negamax will still break on large magnitude.
  if (gs.winner) {
    return gs.winner === me ? 100000 : -100000;
  }


  // Allow per-player override from game state (InfoIA/IAPanel can set gs.ai.evalWeights)
  // Merge overrides with defaults to avoid undefined weights causing NaN in evaluation
  const overrides = (gs.ai as any)?.evalWeights?.[me] as Partial<EvalParams> | undefined;
  const params: EvalParams = { ...EVAL_PARAMS, ...(overrides || {}) } as EvalParams;

  const phi = computeFeatures(gs, me, params.sprint_threshold);
  return (
    params.w_race * phi.race +
    params.done_bonus * phi.done +
    params.w_clash * phi.clash +
    (params.w_chain ?? 1) * phi.chain +
    params.w_sprint * phi.sprint +
    params.w_block * phi.block +
    (params.w_parity ?? 1) * phi.parity +
    (params.w_struct ?? 1) * phi.struct +
    (params.w_ones ?? 1) * phi.ones +
    (params.w_return ?? 1) * phi.ret +
    (params.w_waste ?? 1) * phi.waste +
    (params.w_mob ?? 1) * phi.mob
  );
}

// Mejor cadena de send-backs del jugador en turno (máximo número de rivales devueltos por una jugada propia)
function bestMyChain(gs: GameState, me: Player): number {
  if (gs.turn !== me) return 0;
  const opp = other(me);
  const moves = generateMoves(gs);
  let best = 0;
  for (const m of moves) {
    const child = applyMove(gs, m);
    const c = sendBackCountLocal(gs, child, opp);
    if (c > best) best = c;
    if (best >= 3) break; // cap razonable
  }
  return 15 * Math.max(0, best - 1); // 15 por pieza adicional en cadena (extras)
}

function onesScoreTerm(gs: GameState, me: Player, opp: Player): number {
  const safeOnes = countSafeOnes(gs, me);
  const vulnOppOnes = countVulnerableOnes(gs, opp, me);
  return 30 * safeOnes - 30 * vulnOppOnes;
}

function other(p: Player): Player {
  return p === 'Light' ? 'Dark' : 'Light';
}

function countRetired(gs: GameState, owner: Player): number {
  return gs.pieces.filter((p) => p.owner === owner && p.state === 'retirada').length;
}

// ===== Carrera en turnos (con congestión ligera) =====
// ===== Carrera (top-4 sin interacción) =====
function top4TurnsNoInteraction(gs: GameState, side: Player): number {
  const times: number[] = [];
  for (const p of gs.pieces) {
    if (p.owner !== side) continue;
    times.push(estimateTurnsLeftNoInter(gs, p));
  }
  times.sort((a, b) => a - b);
  // sum de las 4 más rápidas; si hay menos de 4 (no debería), suma las disponibles
  let s = 0;
  for (let i = 0; i < Math.min(4, times.length); i++) s += times[i];
  return s;
}

function estimateTurnsLeft(gs: GameState, piece: Piece): number {
  const lane = gs.lanesByPlayer[piece.owner][piece.laneIndex];
  if (piece.state === 'retirada') return 0;
  if (piece.state === 'en_ida') {
    const distOut = Math.max(0, lane.length - piece.pos);
    const vOut = Math.max(1, lane.speedOut);
    const outMoves = Math.ceil(distOut / vOut);
    // Then a full back trip from lane end
    const vBack = Math.max(1, lane.speedBack);
    const backMoves = Math.ceil(lane.length / vBack);
    // Congestion: check landing squares for next 2 moves along current direction
    const congestion = countRivalsOnRoute(gs, piece, 2);
    return outMoves + backMoves + congestion;
  }
  // en_vuelta
  const distBack = Math.max(0, piece.pos);
  const vBack = Math.max(1, lane.speedBack);
  const backMoves = Math.ceil(distBack / vBack);
  const congestion = countRivalsOnRoute(gs, piece, 2);
  return backMoves + congestion;
}

// Versión sin interacción (ignora rivales y congestión) para la métrica del documento
function estimateTurnsLeftNoInter(gs: GameState, piece: Piece): number {
  const lane = gs.lanesByPlayer[piece.owner][piece.laneIndex];
  if (piece.state === 'retirada') return 0;
  if (piece.state === 'en_ida') {
    const distOut = Math.max(0, lane.length - piece.pos);
    const vOut = Math.max(1, lane.speedOut);
    const outMoves = Math.ceil(distOut / vOut);
    const vBack = Math.max(1, lane.speedBack);
    const backMoves = Math.ceil(lane.length / vBack);
    return outMoves + backMoves;
  }
  // en_vuelta
  const distBack = Math.max(0, piece.pos);
  const vBack = Math.max(1, lane.speedBack);
  return Math.ceil(distBack / vBack);
}

function countRivalsOnRoute(gs: GameState, piece: Piece, lookaheadMoves: number): number {
  // Cuenta rivales en los próximos aterrizajes reales (1..lookaheadMoves) según la velocidad del carril
  const lane = gs.lanesByPlayer[piece.owner][piece.laneIndex];
  const dir = piece.state === 'en_ida' ? +1 : (piece.state === 'en_vuelta' ? -1 : 0);
  if (dir === 0) return 0;
  const v = piece.state === 'en_ida' ? Math.max(1, lane.speedOut) : Math.max(1, lane.speedBack);
  let hits = 0;
  for (let k = 1; k <= lookaheadMoves; k++) {
    const target = piece.pos + dir * (k * v);
    if (target < 0 || target > lane.length) break;
    if (anyOppAt(gs, piece.owner, piece.laneIndex, target)) hits++;
  }
  return hits;
}

// ===== Choques inminentes: delta de capturas (opp_loss - my_loss) =====
function immediateClashDelta(gs: GameState): number {
  const side = gs.turn;
  const opp = other(side);
  // Prefer tactical moves for clash estimation; fallback to all legal moves
  const tact = generateTacticalMoves(gs);
  const moves = tact.length > 0 ? tact : generateMoves(gs);
  if (moves.length === 0) return 0;
  let best = 0;
  for (const m of moves) {
    const child = applyMove(gs, m);
    const oppLoss = approxOppSendBackCount(gs, child, opp);
    let myLoss = 0;
    for (const my of child.pieces) {
      if (my.owner !== side || my.state === 'retirada') continue;
      if (rivalReachesHereSoon(child, opp, my.laneIndex, my.pos, 1)) myLoss += 1;
    }
    const delta = oppLoss - myLoss;
    if (delta > best) best = delta;
  }
  return best;
}

function anyOppAt(gs: GameState, owner: Player, laneIndex: number, pos: number): boolean {
  const opp = owner === 'Light' ? 'Dark' : 'Light';
  const { row: targetRow, col: targetCol } = coordOf(owner, laneIndex, pos, gs);
  for (const q of gs.pieces) {
    if (q.owner !== opp || q.state === 'retirada') continue;
    const { row, col } = coordOf(q.owner, q.laneIndex, q.pos, gs);
    if (row === targetRow && col === targetCol) return true;
  }
  return false;
}

function coordOf(owner: Player, laneIndex: number, pos: number, gs: GameState): { row: number; col: number } {
  const L = gs.lanesByPlayer[owner][laneIndex].length;
  const offset = 1;
  if (owner === 'Light') return { row: laneIndex + offset, col: L - pos };
  return { row: L - pos, col: laneIndex + offset };
}

// ===== Paridad de cruces =====
function movesToReachPosNoInter(gs: GameState, p: Piece, targetPos: number): number {
  const lane = gs.lanesByPlayer[p.owner][p.laneIndex];
  const L = lane.length;
  if (p.state === 'retirada') return 1e9;
  if (p.state === 'en_ida') {
    if (targetPos >= p.pos) {
      const v = Math.max(1, lane.speedOut);
      return Math.ceil((targetPos - p.pos) / v);
    } else {
      // Llegar a L, girar, y volver hasta targetPos
      const vOut = Math.max(1, lane.speedOut);
      const toL = Math.ceil((L - p.pos) / vOut);
      const vBack = Math.max(1, lane.speedBack);
      const back = Math.ceil((L - targetPos) / vBack);
      return toL + back;
    }
  }
  // en_vuelta: solo podemos decrementar pos hasta 0; si target > pos, es inalcanzable
  if (targetPos > p.pos) return 1e9;
  const vBack = Math.max(1, lane.speedBack);
  return Math.ceil((p.pos - targetPos) / vBack);
}

function pieceOnLane(gs: GameState, owner: Player, laneIndex: number): Piece | null {
  return gs.pieces.find((x) => x.owner === owner && x.laneIndex === laneIndex) ?? null;
}

function parityCrossingScore(gs: GameState, me: Player): number {
  const opp = other(me);
  const lanes = gs.lanesByPlayer[me].length;
  const L = gs.lanesByPlayer[me][0].length;
  let diff = 0;
  for (let i = 0; i < lanes; i++) {
    const myPiece = pieceOnLane(gs, me, i);
    if (!myPiece || myPiece.state === 'retirada') continue;
    for (let j = 0; j < lanes; j++) {
      const oppPiece = pieceOnLane(gs, opp, j);
      if (!oppPiece || oppPiece.state === 'retirada') continue;
      // Intersección (row_i, col_j) => Light: col = j+1 => targetPos = L-(j+1); Dark: row = i+1 => targetPos = L-(i+1)
      const myTarget = (me === 'Light') ? (L - (j + 1)) : (L - (i + 1));
      const oppTarget = (opp === 'Light') ? (L - (j + 1)) : (L - (i + 1));
      const myT = movesToReachPosNoInter(gs, myPiece, myTarget);
      const opT = movesToReachPosNoInter(gs, oppPiece, oppTarget);
      if (myT >= 1e9 || opT >= 1e9) continue;
      if (myT < opT) diff += 1; else if (opT < myT) diff -= 1;
    }
  }
  return 12 * diff;
}

// Consideramos una línea rival "sofocada" si nuestra llegada al cruce de esa línea se adelanta en ≥2 acciones
function structuralBlocksScore(gs: GameState, me: Player): number {
  const opp = other(me);
  const lanes = gs.lanesByPlayer[me].length;
  const L = gs.lanesByPlayer[me][0].length;
  let count = 0;
  for (let j = 0; j < lanes; j++) {
    const oppPiece = pieceOnLane(gs, opp, j);
    if (!oppPiece || oppPiece.state === 'retirada') continue;
    // Elegimos nuestra pieza en el carril i = j (aprox simétrica) como representante
    const i = j;
    const myPiece = pieceOnLane(gs, me, i);
    if (!myPiece || myPiece.state === 'retirada') continue;
    const myTarget = (me === 'Light') ? (L - (j + 1)) : (L - (i + 1));
    const oppTarget = (opp === 'Light') ? (L - (j + 1)) : (L - (i + 1));
    const myT = movesToReachPosNoInter(gs, myPiece, myTarget);
    const opT = movesToReachPosNoInter(gs, oppPiece, oppTarget);
    if (myT < 1e9 && opT < 1e9 && (opT - myT) >= 2) count += 1;
  }
  return 10 * count;
}

// (Sin moduladores de ciclo/tempo: solo 12 puntos)

// ===== Helpers adicionales (señales del documento) =====
function currentSpeed(gs: GameState, p: Piece): number {
  const lane = gs.lanesByPlayer[p.owner][p.laneIndex];
  return p.state === 'en_ida' ? Math.max(1, lane.speedOut) : (p.state === 'en_vuelta' ? Math.max(1, lane.speedBack) : 0);
}

function isSafeFromOppImmediate(gs: GameState, me: Player, laneIndex: number, pos: number): boolean {
  const opp = other(me);
  return !rivalReachesHereSoon(gs, opp, laneIndex, pos, 1);
}

function countSafeOnes(gs: GameState, me: Player): number {
  let c = 0;
  for (const p of gs.pieces) {
    if (p.owner !== me || p.state === 'retirada') continue;
    if (currentSpeed(gs, p) === 1 && isSafeFromOppImmediate(gs, me, p.laneIndex, p.pos)) c++;
  }
  return c;
}

function myReachesHereSoon(gs: GameState, me: Player, laneIndex: number, pos: number, horizon: number): boolean {
  for (const q of gs.pieces) {
    if (q.owner !== me || q.state === 'retirada') continue;
    const lane = gs.lanesByPlayer[q.owner][q.laneIndex];
    const dir = q.state === 'en_ida' ? +1 : -1;
    const speed = q.state === 'en_ida' ? lane.speedOut : lane.speedBack;
    const maxProbe = Math.min(Math.abs(speed), Math.max(1, horizon));
    for (let s = 1; s <= maxProbe; s++) {
      const np = q.pos + dir * s;
      if (np < 0 || np > lane.length) break;
      const { row, col } = coordOf(q.owner, q.laneIndex, np, gs);
      const { row: tr, col: tc } = coordOf(q.owner === 'Light' ? 'Dark' : 'Light', laneIndex, pos, gs);
      if (row === tr && col === tc) return true;
    }
  }
  return false;
}

function countVulnerableOnes(gs: GameState, opp: Player, me: Player): number {
  let c = 0;
  for (const p of gs.pieces) {
    if (p.owner !== opp || p.state === 'retirada') continue;
    if (currentSpeed(gs, p) === 1 && myReachesHereSoon(gs, me, p.laneIndex, p.pos, 1)) c++;
  }
  return c;
}

function valueReturn(gs: GameState, me: Player, opp: Player): number {
  let s = 0;
  for (const p of gs.pieces) {
    if (p.owner === me && p.state === 'en_vuelta') s += 5;
    if (p.owner === opp && p.state === 'en_ida') s -= 5;
  }
  return s;
}

function opponentHasImmediateJump(gs: GameState): boolean {
  const opp: Player = gs.turn;
  for (const q of gs.pieces) {
    if (q.owner !== opp || q.state === 'retirada') continue;
    const lane = gs.lanesByPlayer[q.owner][q.laneIndex];
    const dir = q.state === 'en_ida' ? +1 : -1;
    const speed = q.state === 'en_ida' ? lane.speedOut : lane.speedBack;
    const maxProbe = Math.min(Math.abs(speed), 3);
    for (let s = 1; s <= maxProbe; s++) {
      const np = q.pos + dir * s;
      if (np < 0 || np > lane.length) break;
      if (anyOppAt(gs, q.owner, q.laneIndex, np)) return true;
    }
  }
  return false;
}

function hasWasteMove(gs: GameState, side: Player): boolean {
  if (gs.turn !== side) return false;
  const moves = generateMoves(gs);
  for (const m of moves) {
    const child = applyMove(gs, m);
    // moved piece ends on edge?
    const p = child.pieces.find((x) => x.id === m);
    if (!p || p.owner !== side) continue;
    const L = child.lanesByPlayer[p.owner][p.laneIndex].length;
    const endsOnEdge = (p.pos === 0 || p.pos === L);
    if (endsOnEdge && !opponentHasImmediateJump(child)) return true;
  }
  return false;
}

function safeMobilityCount(gs: GameState, side: Player): number {
  if (gs.turn !== side) return 0;
  const moves = generateMoves(gs);
  let c = 0;
  for (const m of moves) {
    const child = applyMove(gs, m);
    if (!opponentHasImmediateJump(child)) c++;
  }
  return c;
}

function sendBackCountLocal(before: GameState, after: GameState, opp: Player): number {
  let c = 0;
  for (const qb of before.pieces) {
    if (qb.owner !== opp || qb.state === 'retirada') continue;
    const lane = before.lanesByPlayer[qb.owner][qb.laneIndex];
    const resetPos = qb.state === 'en_ida' ? 0 : lane.length;
    if (qb.pos === resetPos) continue;
    const qa = after.pieces.find((x) => x.id === qb.id);
    if (!qa) continue;
    if (qa.pos === resetPos) c++;
  }
  return c;
}

// ===== Sprint final =====
function sprintTerm(gs: GameState, me: Player, opp: Player, thr: number): number {
  const my = gs.pieces.filter((p) => p.owner === me);
  const op = gs.pieces.filter((p) => p.owner === opp);
  if (my.length === 0 || op.length === 0) return 0;
  const myBest = Math.min(...my.map((p) => estimateTurnsLeft(gs, p)));
  const opBest = Math.min(...op.map((p) => estimateTurnsLeft(gs, p)));
  let s = 0;
  if (myBest <= thr) s += (thr - myBest + 1);
  if (opBest <= thr) s -= (thr - opBest + 1);
  return s;
}

// ===== Utilidades =====
function shallowApplyBestProgress(gs: GameState): GameState {
  // clona estado y aplica un movimiento de "mejor progreso" muy barato para estimar turno rival
  const clone = deepClone(gs);
  const me = gs.turn;
  let bestId: string | null = null;
  let bestGain = -Infinity;
  for (const p of clone.pieces) {
    if (p.owner !== me || p.state === 'retirada') continue;
    const before = estimateTurnsLeft(clone, p);
    // simulate naive step towards edge
    const lane = clone.lanesByPlayer[p.owner][p.laneIndex];
    const dir = p.state === 'en_ida' ? +1 : -1;
    const speed = p.state === 'en_ida' ? lane.speedOut : lane.speedBack;
    const pos = Math.max(0, Math.min(lane.length, p.pos + dir * Math.max(1, speed)));
    const old = p.pos; p.pos = pos; const after = estimateTurnsLeft(clone, p); p.pos = old;
    const gain = before - after;
    if (gain > bestGain) { bestGain = gain; bestId = p.id; }
  }
  if (bestId) {
    // apply real rules using a cheap JSON clone + rules in calling search would be better
    // but here stay shallow to keep independence
    const idx = clone.pieces.findIndex((x) => x.id === bestId);
    if (idx >= 0) {
      const p = clone.pieces[idx];
      const lane = clone.lanesByPlayer[p.owner][p.laneIndex];
      const dir = p.state === 'en_ida' ? +1 : -1;
      const speed = p.state === 'en_ida' ? lane.speedOut : lane.speedBack;
      p.pos = Math.max(0, Math.min(lane.length, p.pos + dir * Math.max(1, speed)));
      if (p.pos === lane.length && p.state === 'en_ida') p.state = 'en_vuelta';
      else if (p.pos === 0 && p.state === 'en_vuelta') p.state = 'retirada';
      clone.turn = other(p.owner);
    }
  }
  return clone;
}

// Valores por defecto alineados con la escala del documento:
// - Carrera: raceScore ya viene en puntos (100 por tempo). Usamos w_race=1.
// - Finalizadas: 200 por pieza (done_bonus).
// - Capturas inmediatas: 50 por captura (modelado vía w_clash=50 sobre clashDelta de capturas).
// - Sprint/bloqueo: moderadores pequeños por ahora (se ajustarán al completar 12 señales).
const EVAL_PARAMS: EvalParams = {
  // Default heuristic (user-provided) for VS IA
  w_race: 2.2,
  w_clash: 1.0,
  w_sprint: 5.365895487831215,
  w_block: 6.0,
  done_bonus: 199.50580333275943,
  sprint_threshold: 3,
  w_waste: 0.5,
  w_mob: 0.5,
  // Extended multipliers default to 1 unless provided via gs.ai.evalWeights
  // (kept implicit to avoid changing type expectations)
};

function deepClone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

// ===== Bloqueo útil y exposición =====
function blockQuality(gs: GameState, me: Player, opp: Player): number {
  // Útil: piezas propias que están en la ruta inmediata del rival (1..2 pasos)
  // Exposición: piezas propias que el rival puede saltar en su siguiente turno (1..2 pasos) tras un avance ligero mío
  let useful = 0;
  let exposure = 0;

  // Ruta rival hacia nosotros: si un rival alcanza nuestra intersección en <=2, cuenta como tap útil
  for (const my of gs.pieces) {
    if (my.owner !== me || my.state === 'retirada') continue;
    if (rivalReachesHereSoon(gs, opp, my.laneIndex, my.pos, 2)) useful++;
  }

  // Exposición: tras un avance superficial de mi mejor pieza, ¿puede el rival golpearme fácil?
  const afterMy = shallowApplyBestProgress(gs);
  for (const my of afterMy.pieces) {
    if (my.owner !== me || my.state === 'retirada') continue;
    if (rivalReachesHereSoon(afterMy, opp, my.laneIndex, my.pos, 2)) exposure++;
  }

  return useful - 0.5 * exposure;
}

function rivalReachesHereSoon(gs: GameState, rival: Player, laneIndex: number, pos: number, horizon: number): boolean {
  const { row: tr, col: tc } = coordOf(rival === 'Light' ? 'Dark' : 'Light', laneIndex, pos, gs);
  for (const q of gs.pieces) {
    if (q.owner !== rival || q.state === 'retirada') continue;
    const lane = gs.lanesByPlayer[q.owner][q.laneIndex];
    const dir = q.state === 'en_ida' ? +1 : -1;
    const speed = q.state === 'en_ida' ? lane.speedOut : lane.speedBack;
    const maxProbe = Math.min(Math.abs(speed), Math.max(1, horizon));
    for (let s = 1; s <= maxProbe; s++) {
      const np = q.pos + dir * s;
      if (np < 0 || np > lane.length) break;
      const { row, col } = coordOf(q.owner, q.laneIndex, np, gs);
      if (row === tr && col === tc) return true;
    }
  }
  return false;
}
