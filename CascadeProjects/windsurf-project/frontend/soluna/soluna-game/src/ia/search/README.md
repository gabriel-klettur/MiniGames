# Search Engine Module (Soluna)

This folder contains a modular, documented implementation of the game AI search:

- `types.ts`: Public types, options, and internal context.
- `options.ts`: Default options merged at the root.
- `moveOrdering.ts`: `moveKey()` and `orderMoves()` heuristics.
- `tactics.ts`: Tactical detection used by LMR and quiescence.
- `quiescence.ts`: Quiescence search for leaf extensions.
- `alphabeta.ts`: Alpha-beta (with fail-soft, TT, PVS, LMR, killers, history).
- `root.ts`: Root iteration (`bestMove`) and aspiration window handling.
- `index.ts`: Re-exports for external modules.

Public API compatibility is preserved via `search.ts` facade.
