// Facade file to preserve public API compatibility
// Re-export types and bestMove from the modular implementation
export type { Player, SearchOptions, SearchStats, SearchResult, SearchContext } from './index';
export { defaultOptions } from './index';
export { bestMove } from './index';
