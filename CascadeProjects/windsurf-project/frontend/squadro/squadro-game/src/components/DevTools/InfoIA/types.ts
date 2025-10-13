import type { ChangeEvent } from 'react';
import type { SuiteResult } from '../../../tests/runSuite';
import type { SearchStats } from '../../../ia/search/types';
import type { EngineOptions } from '../../../ia/search/types';
import type { EvalParams } from '../../../ia/evalTypes';

export type TimeMode = 'auto' | 'manual';

export type MoveDetail = {
  index: number;
  elapsedMs: number;
  depthReached?: number;
  nodes?: number;
  nps?: number;
  score?: number;
  bestMove?: any;
  player?: 'Light' | 'Dark';
  depthUsed?: number;
  applied?: boolean;
  at?: number;
  /** Zobrist-like hash (uint32) of the position AFTER applying the move */
  zKey?: number;
  /** Optional summary of heuristics and search stats for this move */
  explain?: {
    ttProbes?: number;
    ttHits?: number;
    cutoffs?: number;
    pvsReSearches?: number;
    lmrReductions?: number;
    aspReSearches?: number;
    killersTried?: number;
    historyUpdates?: number;
    hashMoveUsed?: boolean;
    qPlies?: number;
    qNodes?: number;
    lmpPrunes?: number;
    futilityPrunes?: number;
    iidProbes?: number;
    tbHits?: number;
  };
};

export type InfoIARecord = {
  id: string;
  startedAt: number;
  durationMs: number;
  moves: number;
  winner: 'Light' | 'Dark' | 0; // 0 = empate/técnico
  p1Depth: number;
  p2Depth: number;
  // Optional per-game scores for display (e.g., retired pieces count)
  p1Score?: number;
  p2Score?: number;
  details?: MoveDetail[];
};

// Configuration snapshot for saving/loading InfoIA settings
export type InfoIAConfig = {
  // Global limits and toggles
  gamesCount: number;
  useRootParallel: boolean;
  workers: number;
  randomOpeningPlies: number;
  exploreEps: number;
  traceHeuristics: boolean;
  startEligibleLight: boolean;
  startEligibleDark: boolean;
  // Per-player settings
  p1: {
    depth: number;
    mode: TimeMode;
    secs: number;
    engine: Partial<EngineOptions>;
    eval: Partial<EvalParams>;
  };
  p2: {
    depth: number;
    mode: TimeMode;
    secs: number;
    engine: Partial<EngineOptions>;
    eval: Partial<EvalParams>;
  };
};

export type PresetOption = { key: string; label: string; description?: string };

export interface PlayerControlsProps {
  title: string;
  depth: number;
  onChangeDepth: (v: number) => void;
  timeMode: TimeMode;
  onChangeTimeMode: (m: TimeMode) => void;
  timeSeconds: number;
  onChangeTimeSeconds: (s: number) => void;
  // Header preset dropdown (optional)
  presetOptions?: PresetOption[];
  presetSelectedKey?: string;
  onChangePreset?: (key: string) => void;
  /** Per-player engine options (UI callbacks) — subset supported by Squadro */
  enableTT?: boolean; onToggleEnableTT?: () => void;
  enableKillers?: boolean; onToggleEnableKillers?: () => void;
  enableHistory?: boolean; onToggleEnableHistory?: () => void;
  enablePVS?: boolean; onToggleEnablePVS?: () => void;
  enableLMR?: boolean; onToggleEnableLMR?: () => void;
  preferHashMove?: boolean; onTogglePreferHashMove?: () => void;
  lmrMinDepth?: number; onChangeLmrMinDepth?: (n: number) => void;
  lmrLateMoveIdx?: number; onChangeLmrLateMoveIdx?: (n: number) => void;
  lmrReduction?: number; onChangeLmrReduction?: (n: number) => void;
  // ordering jitter (stochastic ordering tie-breaker)
  orderingJitterEps?: number; onChangeOrderingJitterEps?: (n: number) => void;
  // Quiescence (optional support)
  enableQuiescence?: boolean; onToggleEnableQuiescence?: () => void;
  quiescenceMaxPlies?: number; onChangeQuiescenceMaxPlies?: (n: number) => void;
  quiescenceStandPatMargin?: number; onChangeQuiescenceStandPatMargin?: (n: number) => void;
  quiescenceSeeMargin?: number; onChangeQuiescenceSeeMargin?: (n: number) => void;
  quiescenceExtendOnRetire?: boolean; onToggleQuiescenceExtendOnRetire?: () => void;
  quiescenceExtendOnJump?: boolean; onToggleQuiescenceExtendOnJump?: () => void;
  // Tablebase probe (optional support)
  enableTablebase?: boolean; onToggleEnableTablebase?: () => void;
  // DF-PN (optional support)
  enableDFPN?: boolean; onToggleEnableDFPN?: () => void;
  dfpnMaxActive?: number; onChangeDfpnMaxActive?: (n: number) => void;
  // LMP (Late Move Pruning)
  enableLMP?: boolean; onToggleEnableLMP?: () => void;
  lmpMaxDepth?: number; onChangeLmpMaxDepth?: (n: number) => void;
  lmpBase?: number; onChangeLmpBase?: (n: number) => void;
  // Futility pruning
  enableFutility?: boolean; onToggleEnableFutility?: () => void;
  futilityMargin?: number; onChangeFutilityMargin?: (n: number) => void;
  // Aspiration windows
  enableAspiration?: boolean; onToggleEnableAspiration?: () => void;
  aspDelta?: number; onChangeAspDelta?: (n: number) => void;
  // IID
  enableIID?: boolean; onToggleEnableIID?: () => void;
  iidMinDepth?: number; onChangeIidMinDepth?: (n: number) => void;
  // Adaptive time control
  enableAdaptiveTime?: boolean; onToggleEnableAdaptiveTime?: () => void;
  timeSlackMs?: number; onChangeTimeSlackMs?: (n: number) => void;
  adaptiveGrowthFactor?: number; onChangeAdaptiveGrowthFactor?: (n: number) => void;
  adaptiveBFWeight?: number; onChangeAdaptiveBFWeight?: (n: number) => void;
  /** Heuristic weights (optional) */
  w_race?: number; onChangeWRace?: (n: number) => void;
  w_clash?: number; onChangeWClash?: (n: number) => void;
  w_sprint?: number; onChangeWSprint?: (n: number) => void;
  w_block?: number; onChangeWBlock?: (n: number) => void;
  done_bonus?: number; onChangeDoneBonus?: (n: number) => void;
  sprint_threshold?: number; onChangeSprintThreshold?: (n: number) => void;
  // Extended (12-point) heuristic multipliers
  w_chain?: number; onChangeWChain?: (n: number) => void;
  w_parity?: number; onChangeWParity?: (n: number) => void;
  w_struct?: number; onChangeWStruct?: (n: number) => void;
  w_ones?: number; onChangeWOnes?: (n: number) => void;
  w_return?: number; onChangeWReturn?: (n: number) => void;
  w_waste?: number; onChangeWWaste?: (n: number) => void;
  w_mob?: number; onChangeWMob?: (n: number) => void;
  // Repetition/draw options
  drawScore?: number; onChangeDrawScore?: (n: number) => void;
  preferDrawWhenLosing?: boolean; onTogglePreferDrawWhenLosing?: () => void;
}

export interface CompareHead { id: string; name: string; color: string }
export interface Dataset { id: string; name: string; color: string; records: Array<{ durationMs: number }> }

export interface InfoIAViewProps {
  // Header actions
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onDefaults: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportCSVDetails: () => void;
  onExportJSONL?: () => void;
  onImportFiles: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;
  // Save/load configuration
  onSaveConfig: () => void;
  onImportConfigFiles: (e: ChangeEvent<HTMLInputElement>) => void;

  // Tabs
  activeTab: 'repeats' | 'sim' | 'charts' | 'books';
  onChangeTab: (t: 'repeats' | 'sim' | 'charts' | 'books') => void;

  // Charts/compare
  compareHeads: CompareHead[];
  onAddCompare: () => void;
  onRemoveCompare: (id: string) => void;
  onClearCompare: () => void;
  chartDatasets: Dataset[];

  // Results
  records: InfoIARecord[];

  // TimeBar
  moveIndex: number;
  moveElapsedMs: number;
  moveTargetMs?: number;
  // Progress metrics
  progDepth?: number;
  progNodes?: number;
  progNps?: number;
  progScore?: number;
  // Limits
  gamesCount: number;
  onChangeGamesCount: (v: number) => void;
  // Root-parallel controls (global)
  useRootParallel?: boolean;
  onToggleUseRootParallel?: () => void;
  workers?: number;
  onChangeWorkers?: (n: number) => void;
  // Opening randomization: number of initial plies to play at random
  randomOpeningPlies?: number;
  onChangeRandomOpeningPlies?: (n: number) => void;
  // Exploration epsilon (epsilon-greedy random move probability per move post-opening)
  exploreEps?: number;
  onChangeExploreEps?: (n: number) => void;
  // Heuristics tracing toggle (optional, for future UI)
  traceHeuristics?: boolean;
  onToggleTraceHeuristics?: () => void;
  // Start eligibility (per player)
  startEligibleLight?: boolean;
  onToggleStartEligibleLight?: () => void;
  startEligibleDark?: boolean;
  onToggleStartEligibleDark?: () => void;
  // Per-player controls
  p1: PlayerControlsProps;
  p2: PlayerControlsProps;
  // Table actions
  onCopyRecord: (id: string) => void;
  onDownloadRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  // Regression suite
  onRunSuite?: () => void;
  onExportJUnit?: () => void;
  suiteResult?: SuiteResult | null;
  suiteDiff?: {
    broke: string[];
    fixed: string[];
    changed: Array<{ name: string; from: { moveId: string | null; score: number; depthReached: number } | null; to: { moveId: string | null; score: number; depthReached: number } | null }>;
    newCases: string[];
    removed: string[];
  } | null;
  // Engine stats (from last search end)
  engineStats?: Partial<SearchStats> | null;
}
