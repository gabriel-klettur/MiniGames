from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Sequence, Tuple

from ..game.state import GameState, Player, Piece
from ..game.state import clone_state
from ..game.rules import legal_moves, move_piece
from ..game.rules import coord_of
from .interfaces import PolicyValueFn


@dataclass
class EvalParams:
    """Weights for the 12-feature Squadro heuristic.

    This mirrors the TypeScript EvalParams / EVAL_PARAMS defaults.
    """

    w_race: float = 2.2
    w_clash: float = 1.0
    w_sprint: float = 5.365895487831215
    w_block: float = 6.0
    # Optional multipliers default to 1.0
    w_chain: float = 1.0
    w_parity: float = 1.0
    w_struct: float = 1.0
    w_ones: float = 1.0
    w_return: float = 1.0
    w_waste: float = 0.5
    w_mob: float = 0.5
    done_bonus: float = 199.50580333275943
    sprint_threshold: int = 3


DEFAULT_PARAMS = EvalParams()


@dataclass
class Features12:
    race: float
    done: float
    clash: float
    chain: float
    sprint: float
    block: float
    parity: float
    struct: float
    ones: float
    ret: float
    waste: float
    mob: float


# --- Basic helpers ---------------------------------------------------------


def other(player: Player) -> Player:
    return "Dark" if player == "Light" else "Light"


def count_retired(gs: GameState, owner: Player) -> int:
    return sum(1 for p in gs.pieces if p.owner == owner and p.state == "retirada")


# --- Core evaluation API ---------------------------------------------------


def compute_features(gs: GameState, me: Player, params: EvalParams) -> Features12:
    opp: Player = other(me)

    # Carrera (base) top-4 sin interacción
    my_top4 = top4_turns_no_interaction(gs, me)
    opp_top4 = top4_turns_no_interaction(gs, opp)
    race = 100.0 * (opp_top4 - my_top4)

    # Finalizadas (delta sin pesar)
    own_done = count_retired(gs, me)
    opp_done = count_retired(gs, opp)
    done = float(own_done - opp_done)

    # Choque inmediato y cadenas
    clash = 50.0 * immediate_clash_delta(gs)
    chain = best_my_chain(gs, me)  # ya en puntos (15 por extra)

    # Sprint y bloqueo
    sprint = sprint_term(gs, me, opp, params.sprint_threshold)
    block = block_quality(gs, me, opp)

    # Paridad y estructurales
    parity = parity_crossing_score(gs, me)
    struct = structural_blocks_score(gs, me)

    # Ones y retorno
    ones = ones_score_term(gs, me, opp)
    ret = value_return(gs, me, opp)

    # Waste y movilidad
    waste_mine = 1.0 if has_waste_move(gs, me) else 0.0
    waste_opp = 1.0 if has_waste_move(gs, opp) else 0.0
    waste = 8.0 * (waste_mine - waste_opp)
    mob = 6.0 * (safe_mobility_count(gs, me) - safe_mobility_count(gs, opp))

    return Features12(
        race=race,
        done=done,
        clash=clash,
        chain=chain,
        sprint=sprint,
        block=block,
        parity=parity,
        struct=struct,
        ones=ones,
        ret=ret,
        waste=waste,
        mob=mob,
    )


def evaluate_strong(gs: GameState, root: Player, params: EvalParams | None = None) -> float:
    """Strong handcrafted evaluation for Squadro.

    Returns a large positive score if the position is good for ``root``, and a
    large negative score if it is good for the opponent. Terminal wins/losses
    are mapped to ±100000 as in the TypeScript engine.
    """

    me = root
    if gs.winner is not None:
        return 100000.0 if gs.winner == me else -100000.0

    p = params or DEFAULT_PARAMS
    phi = compute_features(gs, me, p)

    return (
        p.w_race * phi.race
        + p.done_bonus * phi.done
        + p.w_clash * phi.clash
        + p.w_chain * phi.chain
        + p.w_sprint * phi.sprint
        + p.w_block * phi.block
        + p.w_parity * phi.parity
        + p.w_struct * phi.struct
        + p.w_ones * phi.ones
        + p.w_return * phi.ret
        + p.w_waste * phi.waste
        + p.w_mob * phi.mob
    )


# --- Race terms ------------------------------------------------------------


def top4_turns_no_interaction(gs: GameState, side: Player) -> float:
    times: List[float] = []
    for p in gs.pieces:
        if p.owner != side:
            continue
        times.append(estimate_turns_left_no_inter(gs, p))
    times.sort()
    s = 0.0
    for i in range(min(4, len(times))):
        s += times[i]
    return s


def estimate_turns_left(gs: GameState, piece: Piece) -> float:
    lane = gs.lanes_by_player[piece.owner][piece.lane_index]
    if piece.state == "retirada":
        return 0.0
    if piece.state == "en_ida":
        dist_out = max(0, lane.length - piece.pos)
        v_out = max(1, lane.speed_out)
        out_moves = (dist_out + v_out - 1) // v_out
        v_back = max(1, lane.speed_back)
        back_moves = (lane.length + v_back - 1) // v_back
        congestion = count_rivals_on_route(gs, piece, 2)
        return float(out_moves + back_moves + congestion)
    # en_vuelta
    dist_back = max(0, piece.pos)
    v_back = max(1, lane.speed_back)
    back_moves = (dist_back + v_back - 1) // v_back
    congestion = count_rivals_on_route(gs, piece, 2)
    return float(back_moves + congestion)


def estimate_turns_left_no_inter(gs: GameState, piece: Piece) -> float:
    lane = gs.lanes_by_player[piece.owner][piece.lane_index]
    if piece.state == "retirada":
        return 0.0
    if piece.state == "en_ida":
        dist_out = max(0, lane.length - piece.pos)
        v_out = max(1, lane.speed_out)
        out_moves = (dist_out + v_out - 1) // v_out
        v_back = max(1, lane.speed_back)
        back_moves = (lane.length + v_back - 1) // v_back
        return float(out_moves + back_moves)
    # en_vuelta
    dist_back = max(0, piece.pos)
    v_back = max(1, lane.speed_back)
    return float((dist_back + v_back - 1) // v_back)


def count_rivals_on_route(gs: GameState, piece: Piece, lookahead_moves: int) -> int:
    lane = gs.lanes_by_player[piece.owner][piece.lane_index]
    if piece.state == "retirada":
        return 0
    direction = 1 if piece.state == "en_ida" else -1
    if direction == 0:
        return 0
    speed = lane.speed_out if piece.state == "en_ida" else lane.speed_back
    v = max(1, speed)
    hits = 0
    for k in range(1, lookahead_moves + 1):
        target = piece.pos + direction * (k * v)
        if target < 0 or target > lane.length:
            break
        if any_opp_at(gs, piece.owner, piece.lane_index, target):
            hits += 1
    return hits


def any_opp_at(gs: GameState, owner: Player, lane_index: int, pos: int) -> bool:
    opp = other(owner)
    target_row, target_col = coord_of(owner, lane_index, pos)
    for q in gs.pieces:
        if q.owner != opp or q.state == "retirada":
            continue
        row, col = coord_of(q.owner, q.lane_index, q.pos)
        if row == target_row and col == target_col:
            return True
    return False


# --- Clash / chains --------------------------------------------------------


def immediate_clash_delta(gs: GameState) -> float:
    side = gs.turn
    opp = other(side)
    moves = legal_moves(gs)
    if not moves:
        return 0.0
    best = 0
    for m in moves:
        before = gs
        child = clone_state(before)
        move_piece(child, m)
        opp_loss = send_back_count_local(before, child, opp)
        my_loss = 0
        for my in child.pieces:
            if my.owner != side or my.state == "retirada":
                continue
            if rival_reaches_here_soon(child, opp, my.lane_index, my.pos, 1):
                my_loss += 1
        delta = opp_loss - my_loss
        if delta > best:
            best = delta
    return float(best)


def best_my_chain(gs: GameState, me: Player) -> float:
    if gs.turn != me:
        return 0.0
    opp = other(me)
    moves = legal_moves(gs)
    best = 0
    for m in moves:
        before = gs
        child = clone_state(before)
        move_piece(child, m)
        c = send_back_count_local(before, child, opp)
        if c > best:
            best = c
        if best >= 3:
            break
    # 15 por pieza adicional en cadena (extras)
    return 15.0 * float(max(0, best - 1))


def send_back_count_local(before: GameState, after: GameState, opp: Player) -> int:
    c = 0
    for qb in before.pieces:
        if qb.owner != opp or qb.state == "retirada":
            continue
        lane = before.lanes_by_player[qb.owner][qb.lane_index]
        reset_pos = 0 if qb.state == "en_ida" else lane.length
        if qb.pos == reset_pos:
            continue
        qa = next((x for x in after.pieces if x.id == qb.id), None)
        if qa is None:
            continue
        if qa.pos == reset_pos:
            c += 1
    return c


# --- Parity / structural terms (simplified versions) ----------------------


def piece_on_lane(gs: GameState, owner: Player, lane_index: int) -> Piece | None:
    for p in gs.pieces:
        if p.owner == owner and p.lane_index == lane_index:
            return p
    return None


def moves_to_reach_pos_no_inter(gs: GameState, p: Piece, target_pos: int) -> float:
    lane = gs.lanes_by_player[p.owner][p.lane_index]
    L = lane.length
    if p.state == "retirada":
        return 1e9
    if p.state == "en_ida":
        if target_pos >= p.pos:
            v = max(1, lane.speed_out)
            return float((target_pos - p.pos + v - 1) // v)
        # Llegar a L, girar y volver
        v_out = max(1, lane.speed_out)
        to_L = (L - p.pos + v_out - 1) // v_out
        v_back = max(1, lane.speed_back)
        back = (L - target_pos + v_back - 1) // v_back
        return float(to_L + back)
    # en_vuelta
    if target_pos > p.pos:
        return 1e9
    v_back = max(1, lane.speed_back)
    return float((p.pos - target_pos + v_back - 1) // v_back)


def parity_crossing_score(gs: GameState, me: Player) -> float:
    # Direct port would enumerate all crossings; here we implement a faithful
    # but compact approximation following the TS logic.
    opp = other(me)
    lanes = len(gs.lanes_by_player[me])
    if lanes == 0:
        return 0.0
    L = gs.lanes_by_player[me][0].length
    diff = 0
    for i in range(lanes):
        for j in range(lanes):
            my_piece = piece_on_lane(gs, me, i)
            opp_piece = piece_on_lane(gs, opp, j)
            if my_piece is None or opp_piece is None:
                continue
            # (row_i, col_j) mapping to lane positions
            my_target = L - (j + 1) if me == "Light" else L - (i + 1)
            opp_target = L - (j + 1) if opp == "Light" else L - (i + 1)
            my_t = moves_to_reach_pos_no_inter(gs, my_piece, my_target)
            op_t = moves_to_reach_pos_no_inter(gs, opp_piece, opp_target)
            if my_t >= 1e9 or op_t >= 1e9:
                continue
            if my_t < op_t:
                diff += 1
            elif op_t < my_t:
                diff -= 1
    return 12.0 * float(diff)


def structural_blocks_score(gs: GameState, me: Player) -> float:
    opp = other(me)
    lanes = len(gs.lanes_by_player[me])
    if lanes == 0:
        return 0.0
    L = gs.lanes_by_player[me][0].length
    count = 0
    for j in range(lanes):
        opp_piece = piece_on_lane(gs, opp, j)
        if opp_piece is None or opp_piece.state == "retirada":
            continue
        i = j
        my_piece = piece_on_lane(gs, me, i)
        if my_piece is None or my_piece.state == "retirada":
            continue
        my_target = L - (j + 1) if me == "Light" else L - (i + 1)
        opp_target = L - (j + 1) if opp == "Light" else L - (i + 1)
        my_t = moves_to_reach_pos_no_inter(gs, my_piece, my_target)
        op_t = moves_to_reach_pos_no_inter(gs, opp_piece, opp_target)
        if my_t < 1e9 and op_t < 1e9 and (op_t - my_t) >= 2:
            count += 1
    return 10.0 * float(count)


# --- Ones / return / waste / mobility -------------------------------------


def current_speed(gs: GameState, p: Piece) -> int:
    lane = gs.lanes_by_player[p.owner][p.lane_index]
    if p.state == "en_ida":
        return max(1, lane.speed_out)
    if p.state == "en_vuelta":
        return max(1, lane.speed_back)
    return 0


def is_safe_from_opp_immediate(gs: GameState, me: Player, lane_index: int, pos: int) -> bool:
    opp = other(me)
    return not rival_reaches_here_soon(gs, opp, lane_index, pos, 1)


def count_safe_ones(gs: GameState, me: Player) -> int:
    c = 0
    for p in gs.pieces:
        if p.owner != me or p.state == "retirada":
            continue
        if current_speed(gs, p) == 1 and is_safe_from_opp_immediate(gs, me, p.lane_index, p.pos):
            c += 1
    return c


def my_reaches_here_soon(gs: GameState, me: Player, lane_index: int, pos: int, horizon: int) -> bool:
    # Check if any of my pieces can reach the opponent's coordinate within ``horizon`` steps.
    for q in gs.pieces:
        if q.owner != me or q.state == "retirada":
            continue
        lane = gs.lanes_by_player[q.owner][q.lane_index]
        direction = 1 if q.state == "en_ida" else -1
        speed = lane.speed_out if q.state == "en_ida" else lane.speed_back
        max_probe = min(abs(speed), max(1, horizon))
        for s in range(1, max_probe + 1):
            np = q.pos + direction * s
            if np < 0 or np > lane.length:
                break
            row, col = coord_of(q.owner, q.lane_index, np)
            tr, tc = coord_of(other(q.owner), lane_index, pos)
            if row == tr and col == tc:
                return True
    return False


def count_vulnerable_ones(gs: GameState, opp: Player, me: Player) -> int:
    c = 0
    for p in gs.pieces:
        if p.owner != opp or p.state == "retirada":
            continue
        if current_speed(gs, p) == 1 and my_reaches_here_soon(gs, me, p.lane_index, p.pos, 1):
            c += 1
    return c


def ones_score_term(gs: GameState, me: Player, opp: Player) -> float:
    safe_ones = count_safe_ones(gs, me)
    vuln_opp_ones = count_vulnerable_ones(gs, opp, me)
    return 30.0 * float(safe_ones) - 30.0 * float(vuln_opp_ones)


def value_return(gs: GameState, me: Player, opp: Player) -> float:
    s = 0.0
    for p in gs.pieces:
        if p.owner == me and p.state == "en_vuelta":
            s += 5.0
        if p.owner == opp and p.state == "en_ida":
            s -= 5.0
    return s


def opponent_has_immediate_jump(gs: GameState) -> bool:
    opp: Player = gs.turn
    for q in gs.pieces:
        if q.owner != opp or q.state == "retirada":
            continue
        lane = gs.lanes_by_player[q.owner][q.lane_index]
        direction = 1 if q.state == "en_ida" else -1
        speed = lane.speed_out if q.state == "en_ida" else lane.speed_back
        max_probe = min(abs(speed), 3)
        for s in range(1, max_probe + 1):
            np = q.pos + direction * s
            if np < 0 or np > lane.length:
                break
            if any_opp_at(gs, q.owner, q.lane_index, np):
                return True
    return False


def has_waste_move(gs: GameState, side: Player) -> bool:
    if gs.turn != side:
        return False
    for m in legal_moves(gs):
        child = clone_state(gs)
        move_piece(child, m)
        p = next((x for x in child.pieces if x.id == m), None)
        if p is None or p.owner != side:
            continue
        lane = child.lanes_by_player[p.owner][p.lane_index]
        ends_on_edge = p.pos == 0 or p.pos == lane.length
        if ends_on_edge and not opponent_has_immediate_jump(child):
            return True
    return False


def safe_mobility_count(gs: GameState, side: Player) -> int:
    if gs.turn != side:
        return 0
    c = 0
    for m in legal_moves(gs):
        child = clone_state(gs)
        move_piece(child, m)
        if not opponent_has_immediate_jump(child):
            c += 1
    return c


# --- Sprint & blocking -----------------------------------------------------


def sprint_term(gs: GameState, me: Player, opp: Player, thr: int) -> float:
    my_pieces = [p for p in gs.pieces if p.owner == me]
    opp_pieces = [p for p in gs.pieces if p.owner == opp]
    if not my_pieces or not opp_pieces:
        return 0.0
    my_best = min(estimate_turns_left(gs, p) for p in my_pieces)
    opp_best = min(estimate_turns_left(gs, p) for p in opp_pieces)
    s = 0.0
    if my_best <= thr:
        s += float(thr - my_best + 1)
    if opp_best <= thr:
        s -= float(thr - opp_best + 1)
    return s


def shallow_apply_best_progress(gs: GameState) -> GameState:
    """Cheap shallow progress approximation used by blockQuality.

    We clone the state and advance the piece that yields the best reduction in
    its estimated turns-left, without modelling collisions or send-backs.
    """

    clone = clone_state(gs)
    me: Player = clone.turn
    best_id: str | None = None
    best_gain = float("-inf")
    for p in clone.pieces:
        if p.owner != me or p.state == "retirada":
            continue
        before = estimate_turns_left(clone, p)
        lane = clone.lanes_by_player[p.owner][p.lane_index]
        direction = 1 if p.state == "en_ida" else -1
        speed = lane.speed_out if p.state == "en_ida" else lane.speed_back
        pos = max(0, min(lane.length, p.pos + direction * max(1, speed)))
        old = p.pos
        p.pos = pos
        after = estimate_turns_left(clone, p)
        p.pos = old
        gain = before - after
        if gain > best_gain:
            best_gain = gain
            best_id = p.id
    if best_id is not None:
        for p in clone.pieces:
            if p.id != best_id:
                continue
            lane = clone.lanes_by_player[p.owner][p.lane_index]
            direction = 1 if p.state == "en_ida" else -1
            speed = lane.speed_out if p.state == "en_ida" else lane.speed_back
            p.pos = max(0, min(lane.length, p.pos + direction * max(1, speed)))
            if p.pos == lane.length and p.state == "en_ida":
                p.state = "en_vuelta"
            elif p.pos == 0 and p.state == "en_vuelta":
                p.state = "retirada"
            clone.turn = other(p.owner)
            break
    return clone


def rival_reaches_here_soon(gs: GameState, rival: Player, lane_index: int, pos: int, horizon: int) -> bool:
    tr, tc = coord_of(other(rival), lane_index, pos)
    for q in gs.pieces:
        if q.owner != rival or q.state == "retirada":
            continue
        lane = gs.lanes_by_player[q.owner][q.lane_index]
        direction = 1 if q.state == "en_ida" else -1
        speed = lane.speed_out if q.state == "en_ida" else lane.speed_back
        max_probe = min(abs(speed), max(1, horizon))
        for s in range(1, max_probe + 1):
            np = q.pos + direction * s
            if np < 0 or np > lane.length:
                break
            row, col = coord_of(q.owner, q.lane_index, np)
            if row == tr and col == tc:
                return True
    return False


def block_quality(gs: GameState, me: Player, opp: Player) -> float:
    useful = 0.0
    exposure = 0.0

    # Ruta rival hacia nosotros: si un rival alcanza nuestra intersección en <=2, cuenta como tap útil
    for my in gs.pieces:
        if my.owner != me or my.state == "retirada":
            continue
        if rival_reaches_here_soon(gs, opp, my.lane_index, my.pos, 2):
            useful += 1.0

    # Exposición: tras un avance superficial de mi mejor pieza, ¿puede el rival golpearme fácil?
    after_my = shallow_apply_best_progress(gs)
    for my in after_my.pieces:
        if my.owner != me or my.state == "retirada":
            continue
        if rival_reaches_here_soon(after_my, opp, my.lane_index, my.pos, 2):
            exposure += 1.0

    return useful - 0.5 * exposure


# --- Policy/value wrapper for MCTS ----------------------------------------


def strong_heuristic_policy_value(gs: GameState, legal: Sequence[str]) -> Tuple[Dict[str, float], float]:
    """PolicyValueFn using the strong handcrafted evaluation.

    - Policy: uniform over legal moves (we rely on MCTS + value to refine).
    - Value: evaluate_strong scaled into [-1, 1].
    """

    if not legal:
        return {}, 0.0

    # Uniform priors for now
    p = 1.0 / float(len(legal))
    policy: Dict[str, float] = {m: p for m in legal}

    raw = evaluate_strong(gs, gs.turn)
    # Scale large heuristic values into [-1, 1]
    scaled = max(-1.0, min(1.0, raw / 4000.0))
    return policy, scaled
