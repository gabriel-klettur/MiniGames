import type { GameState, Player } from '../game/types';
import { createInitialState } from '../game/pieces';
import { movePiece as applyMoveRules } from '../game/rules';
import { hashState } from './hash';
import { findBestMove } from './search';
import type { EngineOptions } from './search/types';

interface DiagnosticsConfig {
  games: number;
  maxPliesPerGame: number;
  aiDepth: number;           // profundidad IA "normal"
  oracleDepth: number;       // profundidad IA "oráculo"
  aiTimeMs: number;          // límite de tiempo IA normal
  oracleTimeMs: number;      // límite de tiempo IA oráculo (puede ser Infinity)
  scoreDiffThreshold: number; // umbral de diferencia de evaluación para registrar
  logToConsole: boolean;
}

interface DecisionInfo {
  moveId: string | null;
  score: number;
  depthReached: number;
  engineStats?: Record<string, unknown> | undefined;
}

interface PositionDiagnostic {
  gameIndex: number;
  plyIndex: number;
  turn: Player;
  hash: string;
  winnerAtEnd: Player | null;
  normal: DecisionInfo;
  oracle: DecisionInfo;
  scoreDiff: number; // oracle.score - normal.score
  pieces: Array<{
    id: string;
    owner: Player;
    laneIndex: number;
    pos: number;
    state: string;
  }>;
}

const DEFAULT_CONFIG: DiagnosticsConfig = {
  games: 1,
  maxPliesPerGame: 200,
  aiDepth: 8,
  oracleDepth: 12,
  // IA normal: presupuesto razonable (similar a partida real)
  aiTimeMs: 3000,
  // Oráculo: sin límite práctico, solo corta por profundidad
  oracleTimeMs: Number.POSITIVE_INFINITY,
  scoreDiffThreshold: 200,
  logToConsole: true,
};

function cloneState(gs: GameState): GameState {
  return JSON.parse(JSON.stringify(gs)) as GameState;
}

function buildNormalEngineOptions(): EngineOptions {
  return {
    enableTT: true,
    enableKillers: true,
    enableHistory: true,
    enablePVS: true,
    enableLMR: true,
    enableLMP: true,
    enableFutility: true,
    enableIID: true,
    enableQuiescence: true,
    quiescenceMaxPlies: 6,
    // Queremos que mande la profundidad, no el control de tiempo adaptativo
    enableAdaptiveTime: false,
  };
}

function buildOracleEngineOptions(): EngineOptions {
  return {
    enableTT: true,
    enableKillers: true,
    enableHistory: true,
    enablePVS: true,
    enableLMR: true,
    // Oráculo: desactivar podas más agresivas
    enableLMP: false,
    enableFutility: false,
    enableIID: true,
    enableQuiescence: true,
    quiescenceMaxPlies: 8,
    enableAdaptiveTime: false,
    // Opcional: DFPN para finales pequeños si está implementado
    enableDFPN: true,
    dfpnMaxActive: 3,
  };
}

async function evaluatePositionWithEngines(
  gs: GameState,
  cfg: DiagnosticsConfig,
): Promise<{ normal: DecisionInfo; oracle: DecisionInfo }> {
  const normalState = cloneState(gs);
  const oracleState = cloneState(gs);

  const [normal, oracle] = await Promise.all([
    findBestMove(normalState, {
      maxDepth: cfg.aiDepth,
      timeLimitMs: cfg.aiTimeMs,
      engine: buildNormalEngineOptions(),
    }),
    findBestMove(oracleState, {
      maxDepth: cfg.oracleDepth,
      timeLimitMs: cfg.oracleTimeMs,
      engine: buildOracleEngineOptions(),
    }),
  ]);

  const normalInfo: DecisionInfo = {
    moveId: normal.moveId,
    score: normal.score,
    depthReached: normal.depthReached,
    engineStats: normal.engineStats as any,
  };

  const oracleInfo: DecisionInfo = {
    moveId: oracle.moveId,
    score: oracle.score,
    depthReached: oracle.depthReached,
    engineStats: oracle.engineStats as any,
  };

  return { normal: normalInfo, oracle: oracleInfo };
}

async function playSingleGame(
  cfg: DiagnosticsConfig,
  gameIndex: number,
): Promise<{ diagnostics: PositionDiagnostic[]; winner: Player | null; plies: number }> {
  let gs: GameState = createInitialState();
  const snapshots: Omit<PositionDiagnostic, 'winnerAtEnd'>[] = [];

  let plyIndex = 0;
  const maxPlies = Math.max(1, cfg.maxPliesPerGame);

  while (!gs.winner && plyIndex < maxPlies) {
    const currentHash = hashState(gs).toString();
    const turn = gs.turn;

    const { normal, oracle } = await evaluatePositionWithEngines(gs, cfg);
    const scoreDiff = oracle.score - normal.score;

    const piecesSnapshot = gs.pieces.map((p) => ({
      id: p.id,
      owner: p.owner,
      laneIndex: p.laneIndex,
      pos: p.pos,
      state: p.state,
    }));

    if (
      normal.moveId &&
      oracle.moveId &&
      (normal.moveId !== oracle.moveId || Math.abs(scoreDiff) >= cfg.scoreDiffThreshold)
    ) {
      snapshots.push({
        gameIndex,
        plyIndex,
        turn,
        hash: currentHash,
        normal,
        oracle,
        scoreDiff,
        pieces: piecesSnapshot,
      });
    }

    // Para avanzar la partida usamos la jugada del oráculo si existe; si no, la normal.
    const chosenMove = oracle.moveId || normal.moveId;
    if (!chosenMove) break;

    applyMoveRules(gs, chosenMove);
    plyIndex += 1;
  }

  const winner: Player | null = gs.winner ?? null;
  const finalDiagnostics: PositionDiagnostic[] = snapshots.map((s) => ({
    ...s,
    winnerAtEnd: winner,
  }));

  return { diagnostics: finalDiagnostics, winner, plies: plyIndex };
}

export async function runSelfPlayDiagnostics(
  partial?: Partial<DiagnosticsConfig>,
): Promise<PositionDiagnostic[]> {
  const cfg: DiagnosticsConfig = { ...DEFAULT_CONFIG, ...(partial || {}) };

  const allDiagnostics: PositionDiagnostic[] = [];

  for (let g = 0; g < cfg.games; g++) {
    const { diagnostics, winner, plies } = await playSingleGame(cfg, g);
    allDiagnostics.push(...diagnostics);
    if (cfg.logToConsole) {
      // eslint-disable-next-line no-console
      console.log(
        `Squadro diagnostics - game ${g}: winner=${winner ?? 'none'}, plies=${plies}, suspiciousPositions=${diagnostics.length}`,
      );
    }
  }

  if (cfg.logToConsole) {
    // eslint-disable-next-line no-console
    console.log('Squadro diagnostics (JSON):');
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(allDiagnostics, null, 2));
  }

  return allDiagnostics;
}

// Exponer cómodamente desde la consola del navegador

declare global {
  interface Window {
    __squadroDiag?: {
      runSelfPlayDiagnostics: (cfg?: Partial<DiagnosticsConfig>) => Promise<PositionDiagnostic[]>;
    };
  }
}

if (typeof window !== 'undefined') {
  (window as any).__squadroDiag = {
    runSelfPlayDiagnostics,
  };
}
