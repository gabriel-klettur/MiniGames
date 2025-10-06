import type { ChangeEvent } from 'react';
import type { CompareHead } from './views/CompareBar';
import type { Dataset } from './views/Chart/ChartContainer';

export type TimeMode = 'auto' | 'manual';

export type MoveDetail = {
  index: number;
  elapsedMs: number;
  depthReached?: number;
  nodes?: number;
  nps?: number;
  score?: number;
  bestMove?: any;
  player?: 1 | 2;
  depthUsed?: number;
  applied?: boolean;
  at?: number;
};

export type InfoIARecord = {
  id: string;
  startedAt: number;
  durationMs: number;
  moves: number;
  winner: 1 | 2 | 0; // 0 = empate/técnico
  p1Depth: number;
  p2Depth: number;
  setId: string;
  setIndex?: number;
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
  /** Per-player engine options (UI callbacks) */
  // Core engine flags
  enableTT?: boolean; onToggleEnableTT?: () => void;
  failSoft?: boolean; onToggleFailSoft?: () => void;
  preferHashMove?: boolean; onTogglePreferHashMove?: () => void;
  enableKillers?: boolean; onToggleEnableKillers?: () => void;
  enableHistory?: boolean; onToggleEnableHistory?: () => void;
  enablePVS?: boolean; onToggleEnablePVS?: () => void;
  enableAspiration?: boolean; onToggleEnableAspiration?: () => void;
  aspirationDelta?: number; onChangeAspirationDelta?: (n: number) => void;
  // Quiescence
  enableQuiescence?: boolean; onToggleEnableQuiescence?: () => void;
  quiescenceDepth?: number; onChangeQuiescenceDepth?: (n: number) => void;
  quiescenceHighTowerThreshold?: number; onChangeQuiescenceHighTowerThreshold?: (n: number) => void;
  // LMR
  enableLMR?: boolean; onToggleEnableLMR?: () => void;
  lmrMinDepth?: number; onChangeLmrMinDepth?: (n: number) => void;
  lmrLateMoveIdx?: number; onChangeLmrLateMoveIdx?: (n: number) => void;
  lmrReduction?: number; onChangeLmrReduction?: (n: number) => void;
  // Futility
  enableFutility?: boolean; onToggleEnableFutility?: () => void;
  futilityMargin?: number; onChangeFutilityMargin?: (n: number) => void;
  // LMP
  enableLMP?: boolean; onToggleEnableLMP?: () => void;
  lmpDepthThreshold?: number; onChangeLmpDepthThreshold?: (n: number) => void;
  lmpLateMoveIdx?: number; onChangeLmpLateMoveIdx?: (n: number) => void;
  // Null-move
  enableNullMove?: boolean; onToggleEnableNullMove?: () => void;
  nullMoveReduction?: number; onChangeNullMoveReduction?: (n: number) => void;
  nullMoveMinDepth?: number; onChangeNullMoveMinDepth?: (n: number) => void;
}

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
  setsCount: number;
  onChangeSetsCount: (v: number) => void;
  // Per-player controls
  p1: PlayerControlsProps;
  p2: PlayerControlsProps;
  // Table actions
  onViewRecord: (id: string) => void;
  onCopyRecord: (id: string) => void;
  onDownloadRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
}
