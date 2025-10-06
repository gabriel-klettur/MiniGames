/**
 * Public entry points for the search module.
 * Re-export types, defaults, and the main API.
 */
export type { Player, SearchOptions, SearchStats, SearchResult, SearchContext } from './types';
export { defaultOptions } from './options';
export { bestMove } from './root';
