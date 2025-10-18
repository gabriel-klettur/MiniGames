import { createInitialState } from '../game/pieces';
import type { GameState, Player } from '../game/types';
import { applyMove } from '../ia/moves';
import { findBestMove } from '../ia/search';
import type { EngineOptions } from '../ia/search/types';

export type LadderSide = {
  id: string;
  name: string;
  evalWeights?: Partial<{
    w_race: number; w_clash: number; w_sprint: number; w_block: number; done_bonus: number; sprint_threshold: number;
    w_chain: number; w_parity: number; w_struct: number; w_ones: number; w_return: number; w_waste: number; w_mob: number;
  }>;
  engine?: Partial<EngineOptions>;
  depth?: number;
  timeMs?: number;
};

export type LadderConfig = {
  games: number;
  randomOpeningPlies?: number;
  startEligibleLight?: boolean;
  startEligibleDark?: boolean;
  sideA: LadderSide; // will alternate playing Light/Dark
  sideB: LadderSide;
};

export type LadderResult = {
  total: number;
  winsA: number;
  winsB: number;
  draws: number;
  wrA: number; // A's win rate over non-draws
  wrB: number; // B's win rate over non-draws
  details: Array<{
    game: number;
    light: string; // side id
    dark: string;  // side id
    winner: 'Light' | 'Dark' | 0;
    plies: number;
    scoreLight?: number;
    scoreDark?: number;
  }>;
};

function injectEval(gs: GameState, lightEval?: LadderSide['evalWeights'], darkEval?: LadderSide['evalWeights']): void {
  (gs as any).ai = (gs as any).ai || {};
  const ew: any = ((gs as any).ai.evalWeights ||= {});
  if (lightEval) ew['Light'] = { ...(ew['Light'] || {}), ...lightEval };
  if (darkEval) ew['Dark'] = { ...(ew['Dark'] || {}), ...darkEval };
}

export async function runLadder(cfg: LadderConfig): Promise<LadderResult> {
  const G = Math.max(1, Math.floor(cfg.games));
  const openPlies = Math.max(0, Math.floor(cfg.randomOpeningPlies ?? 0));
  const allowLight = cfg.startEligibleLight !== false;
  const allowDark = cfg.startEligibleDark !== false;
  const res: LadderResult = { total: G, winsA: 0, winsB: 0, draws: 0, wrA: 0, wrB: 0, details: [] };

  for (let g = 0; g < G; g++) {
    // Alternate colors every game
    const AisLight = (g % 2 === 0);
    const light = AisLight ? cfg.sideA : cfg.sideB;
    const dark = AisLight ? cfg.sideB : cfg.sideA;

    let s = createInitialState();
    if (allowLight || allowDark) {
      if (allowLight && allowDark) {
        s.turn = (Math.random() < 0.5 ? 'Light' : 'Dark') as Player;
      } else if (allowLight) { s.turn = 'Light'; } else if (allowDark) { s.turn = 'Dark'; }
    }

    injectEval(s, light.evalWeights, dark.evalWeights);

    let plies = 0;
    // Play
    while (!s.winner) {
      const cur: Player = s.turn;
      // Opening randomization
      if (plies < openPlies) {
        // Cheap: delegate to engine anyway to ensure legality but cap time/depth
        const m = await findBestMove(s, {
          maxDepth: 1,
          timeLimitMs: 50,
          engine: { orderingJitterEps: 1 } as any,
        });
        if (!m.moveId) break;
        s = applyMove(s, m.moveId);
        plies++;
        continue;
      }
      const isLight = cur === 'Light';
      const side = isLight ? light : dark;
      const depth = Math.max(1, Math.floor(side.depth ?? 6));
      const timeMs = Math.max(200, Math.floor(side.timeMs ?? 1500));
      const engine: Partial<EngineOptions> = {
        orderingJitterEps: 0,
        enableAdaptiveTime: false,
        ...(side.engine || {}),
      };
      const r = await findBestMove(s, { maxDepth: depth, timeLimitMs: timeMs, engine: engine as any });
      if (!r.moveId) break;
      s = applyMove(s, r.moveId);
      plies++;
      if (plies > 400) break; // safety
    }

    const scoreLight = s.pieces.filter(p => p.owner === 'Light' && p.state === 'retirada').length;
    const scoreDark = s.pieces.filter(p => p.owner === 'Dark' && p.state === 'retirada').length;
    let winnerSide: 'A' | 'B' | 'D' = 'D';
    if (s.winner === 'Light') winnerSide = AisLight ? 'A' : 'B';
    else if (s.winner === 'Dark') winnerSide = AisLight ? 'B' : 'A';

    if (winnerSide === 'A') res.winsA++; else if (winnerSide === 'B') res.winsB++; else res.draws++;
    res.details.push({ game: g + 1, light: (AisLight ? cfg.sideA.id : cfg.sideB.id), dark: (AisLight ? cfg.sideB.id : cfg.sideA.id), winner: (s.winner as any) || 0, plies, scoreLight, scoreDark });
  }
  const nonDraw = Math.max(1, res.winsA + res.winsB);
  res.wrA = res.winsA / nonDraw;
  res.wrB = res.winsB / nonDraw;
  return res;
}
