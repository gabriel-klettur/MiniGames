import type { ChangeEvent } from 'react';
import type { SuiteResult } from '../../../tests/runSuite';
import type { SearchStats } from '../../../ia/search/types';

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
  // Tablebase probe (optional support)
  enableTablebase?: boolean; onToggleEnableTablebase?: () => void;
  // DF-PN (optional support)
  enableDFPN?: boolean; onToggleEnableDFPN?: () => void;
  dfpnMaxActive?: number; onChangeDfpnMaxActive?: (n: number) => void;
  /** Heuristic weights (optional) */
  w_race?: number; onChangeWRace?: (n: number) => void;
  w_clash?: number; onChangeWClash?: (n: number) => void;
  w_sprint?: number; onChangeWSprint?: (n: number) => void;
  w_block?: number; onChangeWBlock?: (n: number) => void;
  done_bonus?: number; onChangeDoneBonus?: (n: number) => void;
  sprint_threshold?: number; onChangeSprintThreshold?: (n: number) => void;
  tempo?: number; onChangeTempo?: (n: number) => void;
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
  onImportFiles: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;

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
  suiteResult?: SuiteResult | null;
  // Engine stats (from last search end)
  engineStats?: Partial<SearchStats> | null;
}
