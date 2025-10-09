import type { GameState, Player, Piece } from '../game/types';

/**
 * evaluate — Heurística para Squadro.
 *
 * Componentes:
 * - Carrera en turnos (no solo distancia): menos turnos restantes es mejor.
 * - Choques inminentes: medir swing de turnos (opp_loss - my_loss) en horizonte corto.
 * - Sprint final: priorizar cierre cuando alguna pieza está a <= thr turnos.
 * - Congestión local: estimar sobrecoste por rivales en próximos segmentos.
 */
export function evaluate(gs: GameState, root: Player): number {
  const me = root;
  const opp = other(root);

  // Terminal handling: treat wins/losses as near-mate scores so the engine can detect
  // forced outcomes and stop early during iterative deepening.
  // Note: we don't incorporate ply distance here; negamax will still break on large magnitude.
  if (gs.winner) {
    return gs.winner === me ? 100000 : -100000;
  }

  const params = EVAL_PARAMS;

  // 1) Carrera: bonus por retiradas y por tener menos turnos restantes
  const ownDone = countRetired(gs, me);
  const oppDone = countRetired(gs, opp);
  const ownTurnsLeft = sumTurnsLeft(gs, me);
  const oppTurnsLeft = sumTurnsLeft(gs, opp);
  const raceScore = params.done_bonus * (ownDone - oppDone) + (oppTurnsLeft - ownTurnsLeft);

  // 2) Choques inminentes: aproximación ligera a 1-2 plies
  const clashDelta = scanImminentClashes(gs, 2); // (opp_loss - my_loss)

  // 3) Sprint: priorizar cierre cuando hay pieza a <= thr turnos
  const sprint = sprintTerm(gs, me, opp, params.sprint_threshold);

  // 4) Bloqueos útiles vs exposición (documento del cliente)
  const block = blockQuality(gs, me, opp);

  // 4) Tempo (iniciativa) suave
  const tempo = gs.turn === me ? 5 : 0;

  return (
    params.w_race * raceScore +
    params.w_clash * clashDelta +
    params.w_sprint * sprint +
    params.w_block * block +
    tempo
  );
}

function other(p: Player): Player {
  return p === 'Light' ? 'Dark' : 'Light';
}

function countRetired(gs: GameState, owner: Player): number {
  return gs.pieces.filter((p) => p.owner === owner && p.state === 'retirada').length;
}

// ===== Carrera en turnos (con congestión ligera) =====
function sumTurnsLeft(gs: GameState, side: Player): number {
  let s = 0;
  for (const p of gs.pieces) {
    if (p.owner !== side) continue;
    s += estimateTurnsLeft(gs, p);
  }
  return s;
}

function estimateTurnsLeft(gs: GameState, piece: Piece): number {
  const lane = gs.lanesByPlayer[piece.owner][piece.laneIndex];
  if (piece.state === 'retirada') return 0;
  if (piece.state === 'en_ida') {
    const distOut = Math.max(0, lane.length - piece.pos);
    const outMoves = Math.ceil(distOut / Math.max(1, lane.speedOut));
    // vuelta completa
    const backMoves = Math.ceil(lane.length / Math.max(1, lane.speedBack));
    const congestion = countRivalsOnRoute(gs, piece, 2);
    return outMoves + backMoves + congestion;
  }
  // en_vuelta
  const distBack = Math.max(0, piece.pos);
  const backMoves = Math.ceil(distBack / Math.max(1, lane.speedBack));
  const congestion = countRivalsOnRoute(gs, piece, 2);
  return backMoves + congestion;
}

function countRivalsOnRoute(gs: GameState, piece: Piece, segments: number): number {
  // cuenta rivales en las próximas `segments` intersecciones del trayecto del piece
  const lane = gs.lanesByPlayer[piece.owner][piece.laneIndex];
  const dir = piece.state === 'en_ida' ? +1 : (piece.state === 'en_vuelta' ? -1 : 0);
  if (dir === 0) return 0;
  let hits = 0;
  for (let step = 1; step <= segments; step++) {
    const next = piece.pos + dir * step;
    if (next < 0 || next > lane.length) break;
    if (anyOppAt(gs, piece.owner, piece.laneIndex, next)) hits++;
  }
  return hits;
}

// ===== Choques inminentes: delta de turnos (opp_loss - my_loss) =====
function scanImminentClashes(gs: GameState, horizon: number): number {
  // Aprox: si en el próximo movimiento mío puedo saltar a alguien => opp_loss += 1
  // y si en el próximo movimiento del rival puede saltarme a mí => my_loss += 1
  const me = gs.turn;
  const opp = other(me);
  let myLoss = 0;
  let oppLoss = 0;

  // Turno actual: puedo saltar si en mis próximos speed pasos hay rivales consecutivos
  for (const p of gs.pieces) {
    if (p.owner !== me || p.state === 'retirada') continue;
    const lane = gs.lanesByPlayer[p.owner][p.laneIndex];
    const dir = p.state === 'en_ida' ? +1 : -1;
    const speed = p.state === 'en_ida' ? lane.speedOut : lane.speedBack;
    const maxProbe = Math.min(Math.abs(speed), horizon);
    let sawAny = false;
    for (let s = 1; s <= maxProbe; s++) {
      const pos = p.pos + dir * s;
      if (pos < 0 || pos > lane.length) break;
      if (anyOppAt(gs, p.owner, p.laneIndex, pos)) { sawAny = true; break; }
    }
    if (sawAny) oppLoss += 1;
  }

  // Siguiente turno del rival: simular 1-ply a futuro de manera barata
  const afterMy = shallowApplyBestProgress(gs);
  for (const q of afterMy.pieces) {
    if (q.owner !== opp || q.state === 'retirada') continue;
    const lane = afterMy.lanesByPlayer[q.owner][q.laneIndex];
    const dir = q.state === 'en_ida' ? +1 : -1;
    const speed = q.state === 'en_ida' ? lane.speedOut : lane.speedBack;
    const maxProbe = Math.min(Math.abs(speed), Math.max(1, horizon - 1));
    let canHit = false;
    for (let s = 1; s <= maxProbe; s++) {
      const pos = q.pos + dir * s;
      if (pos < 0 || pos > lane.length) break;
      if (anyOppAt(afterMy, q.owner, q.laneIndex, pos)) { canHit = true; break; }
    }
    if (canHit) myLoss += 1;
  }

  return (oppLoss - myLoss);
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

const EVAL_PARAMS = {
  w_race: 1.0,
  w_clash: 0.8,
  w_sprint: 0.6,
  w_block: 0.3,
  done_bonus: 5.0,
  sprint_threshold: 2,
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

  return useful - 0.7 * exposure;
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
