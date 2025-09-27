import type { GameState } from '../../../game/types';
import type { AIMove } from '../../../ia/moves';

export type Side = 'L' | 'D';
export type TimeMode = 'auto' | 'manual';

export interface AIAdvancedConfig {
  // Search
  pvsEnabled?: boolean;
  aspirationEnabled?: boolean;
  ttEnabled?: boolean;

  // Repetition avoidance (root-level)
  avoidRepeats?: boolean;
  repeatMax?: number; // 1..10
  avoidPenalty?: number; // 0..500

  // Book
  bookEnabled: boolean;
  // Mode to resolve the book URL
  bookMode?: 'auto' | 'manual';
  // When in auto mode, which phase to target within the chosen difficulty
  bookPhase?: 'aperturas' | 'medio' | 'cierres';
  // Optional base path for auto mode (defaults to '/books')
  bookBasePath?: string;
  // Manual URL override (used when bookMode === 'manual')
  bookUrl: string;

  // Quiescence
  quiescence: boolean;
  qDepthMax: number; // 0..4
  qNodeCap: number; // 1..128
  futilityMargin: number; // 0..1000

  // Performance toggles
  precomputedSupports?: boolean;
  precomputedCenter?: boolean;

  // Start behavior (first move)
  startRandomFirstMove?: boolean; // default false (preserve current)
  startSeed?: number | null; // optional reproducible seed

  // Anti-stall (root-level tuning)
  noveltyBonus?: number; // small bonus for unseen states at root
  rootTopK?: number; // Top-K pool for epsilon sampling (2..8)
  rootJitter?: boolean; // enable seedable jitter on root ordering under repetition risk
  rootJitterProb?: number; // 0..1 neighbor swap probability
  rootLMR?: boolean; // enable LMR-like depth adjustment at root
  drawBias?: number; // cycle-as-draw bias in eval units (0..50)
}

export interface ProgressInfo {
  depth: number;
  score: number;
}

export interface RootMove {
  move: AIMove;
  score: number;
}

export interface IAPanelProps {
  state: GameState;
  depth: number; // 1..10
  onChangeDepth: (d: number) => void;
  onAIMove: () => void;
  disabled?: boolean;

  // Tiempo de cálculo IA
  timeMode: TimeMode;
  timeSeconds: number; // 0..30
  onChangeTimeMode: (m: TimeMode) => void;
  onChangeTimeSeconds: (secs: number) => void;

  // Estado y progreso
  busy?: boolean;
  progress?: ProgressInfo | null;

  // Resumen del último cálculo
  evalScore?: number | null;
  depthReached?: number | null;
  pv?: AIMove[];
  rootMoves?: RootMove[];
  nodes?: number;
  elapsedMs?: number;
  nps?: number;
  rootPlayer?: Side;
  moving?: boolean; // si hay animación de pieza en curso

  // Autoplay IA
  aiAutoplayActive?: boolean;
  onToggleAiAutoplay?: () => void;

  // Configuración avanzada de IA
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (cfg: Partial<AIAdvancedConfig>) => void;
}

export default {};

