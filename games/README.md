<h1 align="center">MiniGames — AI-Powered Board Game Engine Suite</h1>

<p align="center">
  <strong>Four fully playable abstract board games with configurable AI engines, real-time telemetry, developer tooling, and responsive UIs — all running client-side in the browser.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-2.9-764ABC?logo=redux&logoColor=white" alt="Redux" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vitest-3.2-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Web_Workers-Multi--threaded-FF6F00?logo=webassembly&logoColor=white" alt="Web Workers" />
  <img src="https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white" alt="Python" />
</p>

---

## About This Project

MiniGames is a collection of **four abstract strategy board games** — Pylos, Quoridor, Soluna, and Squadro — each implemented from scratch with a fully functional game engine, a configurable AI opponent, and production-quality UI/UX. A separate **MCTS + AlphaGo-style engine** for Squadro in Python is also in development.

This is not a tutorial or toy project. Each game features a **complete AI pipeline**: move generation, alpha-beta search with advanced heuristics (PVS, TT, killers, history, LMR, quiescence), Web Workers for non-blocking computation, real-time telemetry panels, and persistent configuration — all architected with strict separation of concerns, explicit error handling, and scalability in mind.

The goal of this repository is to demonstrate how I design, build, and maintain **complex interactive frontend systems** with engineering rigor comparable to production software.

---

## Table of Contents

- [Key Highlights](#key-highlights)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Game Modules](#game-modules)
  - [Pylos](#pylos)
  - [Quoridor](#quoridor)
  - [Soluna](#soluna)
  - [Squadro](#squadro)
- [AI Engine — Deep Dive](#ai-engine--deep-dive)
- [Developer Tooling & Telemetry](#developer-tooling--telemetry)
- [Testing Strategy](#testing-strategy)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Bonus: Python Modules](#bonus-python-modules)
- [Roadmap](#roadmap)
- [About Me](#about-me)

---

## Key Highlights

| Area | What I Built |
| --- | --- |
| **4 Complete Game Engines** | Pylos, Quoridor, Soluna, and Squadro with full rule enforcement, move validation, win detection, and undo/redo |
| **Configurable AI Opponents** | Alpha-beta search with PVS, transposition tables, killer/history heuristics, LMR, quiescence search, aspiration windows, and opening books |
| **Web Worker Parallelization** | AI runs off the main thread via dedicated Web Workers; Squadro supports root-parallel and 2nd-ply split worker pools |
| **Real-Time Telemetry** | Live KPIs: evaluation score, principal variation, depth reached, nodes searched, NPS, time budget, and root-move ranking |
| **DevTools Panels** | Developer-facing panels for engine flags, search parameters, presets, simulations, and move-by-move analysis |
| **Responsive & Touch-Ready** | All games adapt to desktop, tablet, and mobile; Quoridor includes pointer-coarse detection and input-mode switching |
| **State Management Patterns** | Context/Reducer (Soluna, Pylos) and Redux Toolkit (Quoridor, Squadro) with clean domain separation |
| **Persistence Layer** | Selective localStorage persistence: IA presets, game sessions, advanced config, and UI preferences |
| **20+ Unit Test Suites** | Vitest specs covering game rules, board logic, AI search, evaluation, move generation, and component behavior |
| **MCTS / AlphaGo Engine (Python)** | Separate Python package with pure MCTS implementation and pluggable neural-network policy for Squadro |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND  (React 19 + TypeScript 5.8)                 │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌───────────┐ │
│  │  Game     │ │  State   │ │  Components  │ │ DevTools │ │ Hooks     │ │
│  │  Engine   │ │  Layer   │ │  & Panels    │ │ & InfoIA │ │ Library   │ │
│  │ (rules,  │ │ (Redux / │ │ (Board, IA,  │ │ (engine  │ │ (useAI,   │ │
│  │  types,  │ │ Context) │ │  History,    │ │  flags,  │ │  persist, │ │
│  │  board)  │ │          │ │  Header)     │ │  KPIs)   │ │  history) │ │
│  └──────────┘ └──────────┘ └──────────────┘ └──────────┘ └───────────┘ │
│                                                                          │
│      Vite 7 · CSS Modules / Tailwind 4.1 · localStorage persistence     │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │  postMessage
┌──────────────────────────▼───────────────────────────────────────────────┐
│                      AI LAYER  (Web Workers)                             │
│                                                                          │
│  ┌────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │  Alpha-Beta    │ │ Transposition│ │  Move        │ │  Evaluation  │ │
│  │  + PVS + LMR   │ │ Table (TT)   │ │  Ordering    │ │  Function    │ │
│  │  + Aspiration  │ │ Zobrist hash │ │  (killers,   │ │  (heuristic, │ │
│  │  + Quiescence  │ │              │ │   history)   │ │   tapering)  │ │
│  └────────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                                          │
│  ┌────────────────┐ ┌──────────────┐ ┌──────────────┐                   │
│  │  Iterative     │ │  Worker Pool │ │  Time Budget │                   │
│  │  Deepening     │ │  (root/2ply) │ │  Controller  │                   │
│  └────────────────┘ └──────────────┘ └──────────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│               PYTHON MODULES  (research & tooling)                       │
│                                                                          │
│  ┌────────────────────┐    ┌─────────────────────────┐                  │
│  │  MCTS + AlphaGo    │    │  BGA Scraper            │                  │
│  │  engine (Squadro)  │    │  (game stats extraction) │                  │
│  └────────────────────┘    └─────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Design Principles Applied

- **Separation of Concerns** — Game rules → State management → AI engine → UI components, with no cross-layer leakage
- **Security by Default** — All external input (user moves, localStorage data) validated before processing
- **Explicit Error Handling** — No silently swallowed exceptions; AI timeouts, worker failures, and invalid states are handled explicitly
- **Scalability Awareness** — Worker pools, cancellable searches, time budgets, and TT sizing prevent runaway computation
- **Clean Code Over Clever Code** — Readable, maintainable patterns; typed interfaces; documented intent for complex AI logic
- **Deterministic & Predictable** — Pure evaluation functions, immutable game states during search, no hidden side effects

---

## Tech Stack

### Frontend (per game)

| Technology | Purpose |
| --- | --- |
| **React 19.1** | Component-based UI with hooks, context, and concurrent features |
| **TypeScript 5.8** | Full type safety across game engines, AI, state, and components |
| **Vite 7** | Lightning-fast HMR and optimized production builds |
| **Redux Toolkit 2.9** | Global state management for Quoridor and Squadro (slices, typed hooks) |
| **Context + Reducer** | Lightweight state management for Pylos and Soluna |
| **Tailwind CSS 4.1** | Utility-first styling for Quoridor and Squadro |
| **CSS Modules** | Scoped styles for Pylos and Soluna |
| **Web Workers** | Off-main-thread AI computation with message passing and cancellation |
| **Vitest 3.2** | Unit testing with coverage for rules, AI, and components |
| **ESLint 9** | Strict linting with React hooks and refresh plugins |
| **localStorage** | Selective persistence for presets, sessions, and configuration |

### AI Engine (TypeScript, in-browser)

| Technique | Purpose |
| --- | --- |
| **Negamax + Alpha-Beta** | Core adversarial search with fail-soft bounds |
| **PVS (Principal Variation Search)** | Narrow-window re-search for non-PV nodes — fewer nodes explored |
| **Iterative Deepening** | Progressive depth with time control — best move available at any cutoff |
| **Transposition Table (Zobrist)** | Cache evaluated positions with EXACT/LOWER/UPPER bounds and best-move hint |
| **Killer Heuristic** | Prioritize moves that caused beta cutoffs at sibling nodes |
| **History Heuristic** | Global move-ordering signal based on cumulative cutoff frequency |
| **LMR (Late Move Reductions)** | Reduce search depth for late, non-tactical moves — massive tree pruning |
| **LMP (Late Move Pruning)** | Skip unpromising moves at shallow depth |
| **Futility Pruning** | Prune nodes where static eval + margin can't reach alpha |
| **Aspiration Windows** | Search around expected score — tighter bounds, fewer nodes |
| **Quiescence Search** | Extend tactical positions past the horizon to avoid evaluation artifacts |
| **IID (Internal Iterative Deepening)** | Shallow search to find hash-move seed when TT misses |
| **DFPN (Proof-Number Search)** | Endgame solver probe for trivial positions (Squadro) |
| **Opening Book** | Precomputed opening moves to skip early search (Pylos) |
| **Worker Pool** | Root-parallel and 2nd-ply split parallelization (Squadro) |

### Python (research & data)

| Technology | Purpose |
| --- | --- |
| **Python 3.11+** | Type hints, dataclasses, async support |
| **MCTS** | Monte Carlo Tree Search engine for Squadro with pluggable policy |
| **BeautifulSoup** | Board Game Arena stats scraper |
| **Pygame** | Pylos desktop prototype with MVC architecture |

---

## Game Modules

### Pylos

> Abstract stacking game — place spheres, form squares, recover pieces, complete the pyramid to win.

| Aspect | Details |
| --- | --- |
| **State** | Hooks + local reducers with granular persistence (`usePersistence`) |
| **Rules Engine** | Full validation: levels, placement, square detection, lift/recover, win condition |
| **AI** | Alpha-beta with PVS, TT, killers, history, quiescence, opening book, and draw-bias detection. Runs in a dedicated Web Worker with iterative deepening and aspiration windows |
| **Components** | `Board`, `FlyingPiece` (animations), `GameOverModal`, `HistoryPanel`, `StoredGames`, `UndoRedo`, `IAUserPanel` |
| **DevTools** | `IAPanel` (depth, time, KPIs, PV, root moves, evaluation bar), `InfoIA` (simulations, chart, CSV export, comparisons), `BookPanel`, `FasePanel`, `UXPanel` (6 config tabs) |
| **Tests** | 16+ spec files: rules, board logic, AI search, evaluation, move generation, components, integration |
| **Persistence** | Game sessions, move history, IA advanced config, UI preferences |

### Quoridor

> Maze-building race — move your pawn or place walls; first to reach the opposite row wins.

| Aspect | Details |
| --- | --- |
| **State** | Redux Toolkit with `gameSlice`, `uiSlice`, `iaSlice` |
| **Rules Engine** | Pawn movement, wall placement validation, path-existence check, goal detection |
| **AI** | Per-side AI with presets (balanced/aggressive/defensive), opening strategies, depth control, and search telemetry. Minimax with alpha-beta, TT, Zobrist hashing, and worker-based computation |
| **Components** | `Board`, `HeaderPanel`, `FootPanel`, `InfoPanel`, `GameOverModal`, `IAUserPanel`, `IAPanel` (7 sub-panels including `SearchTree`, `TracePanel`, `EvaluationCard`) |
| **DevTools** | `DevToolsPanel`, `FasesPanel`, `RulesPanel`, `UIUX`, `WallsHitBox` (calibration), `Historial` |
| **Touch Support** | Pointer-coarse detection, input-mode switching (move vs wall placement), hitbox calibration |
| **Persistence** | UI toggles, IA config, and partial game state |

### Soluna

> Round-based token-merging strategy game with multiple piece types (Sol, Luna, Estrella, Fugaz).

| Aspect | Details |
| --- | --- |
| **State** | Custom Context + Reducer store (`game/store.tsx`) with `useGame()` hook |
| **Rules Engine** | Token placement, merging, round-over and game-over detection |
| **AI** | Fail-soft alpha-beta with TT (global), PVS, LMR, killers, history, quiescence (depth 3), and optional aspiration. Worker pool with configurable size. Adaptive time budget (min/max/base/perMove/exp) or manual seconds |
| **Components** | `Board` (9 sub-components: `TokenButton`, `TokenStack`, `FlightLayer`, `CellTokenPicker`, `CountPickerPopover`, drag-and-drop), `HeaderPanel` (5 popovers: VsAi, NewGame, Animations, Assets, board themes), `HistoryPanel`, `IAUserPanel` |
| **DevTools** | `IAPanel` (Control, Analysis, Presets tabs with advanced settings: quiescence, search, time, windows), `InfoIA` (simulations, charts, CSV, compare, filter, player cards), `UIUX` (animations, indicators, difficulty, pieces tabs), `FasesPanel`, `Historial` |
| **Assets** | 3 token-set skins, 10+ background themes, multiple board styles |
| **Persistence** | IA presets per player (P1/P2), engine options, UI preferences |

### Squadro

> Racing game with lane-based movement, collisions, and speed asymmetry — retire 4 of 5 pieces to win.

| Aspect | Details |
| --- | --- |
| **State** | Redux Toolkit with `gameSlice` + typed hooks |
| **Rules Engine** | Lane advancement with directional speeds (out/back), contiguous-block jumping, edge-turn, retirement, and victory at 4 retired |
| **AI** | Negamax with iterative deepening + aspiration windows, TT per iteration, PVS, LMR (dynamic), LMP, futility pruning, IID, quiescence, DFPN endgame probe. 12-signal evaluation function (race, retired, collision, chain, sprint, block, parity, structure, ones, return, waste, mobility). Difficulty levels 1–20 scaling time and aggressiveness |
| **Parallelization** | Root-parallel and 2nd-ply split via `workerPool.ts`; clean cancellation and per-worker metrics |
| **Components** | `Board` (with board profiles), `HeaderPanel` (VsAiPopover), `FootPanel`, `InfoPanel`, `GameOverModal`, `IAUserPanel` (depth, presets, player toggle), `Historial` |
| **DevTools** | `IAPanel` (presets tab, engine flags), `InfoIA` (simulations, charts, compare, books, repeats analysis), `UIUX` (animations, board, calibration, pieces), `RulesPanel` |
| **Tests** | Position test suites (`positions.json`), ladder runner, custom reporters |
| **Persistence** | IA presets, time config, engine flags, UI toggles |

---

## AI Engine — Deep Dive

Each game implements its own AI engine tailored to its search space, but they share a common architectural pattern:

```
User Move → State Update → AI Trigger (hook/dispatch)
                                 │
                          ┌──────▼──────┐
                          │  Web Worker  │ (or Worker Pool)
                          │             │
                          │  Iterative   │
                          │  Deepening   │
                          │     │        │
                          │  ┌──▼──────┐ │
                          │  │ Alpha-  │ │   ← PVS, LMR, Futility, LMP
                          │  │ Beta    │ │
                          │  │ Search  │ │   ← TT lookup/store (Zobrist)
                          │  │         │ │   ← Killer + History ordering
                          │  └──┬──────┘ │
                          │     │        │
                          │  ┌──▼──────┐ │
                          │  │Quiesc.  │ │   ← Tactical extension
                          │  │ Search  │ │
                          │  └──┬──────┘ │
                          │     │        │
                          │  ┌──▼──────┐ │
                          │  │Evaluate │ │   ← Heuristic (hand-tuned, per-game)
                          │  └─────────┘ │
                          └──────┬───────┘
                                 │ postMessage (best move + metrics)
                          ┌──────▼──────┐
                          │   UI Update  │ → KPIs, PV line, eval bar, root moves
                          └─────────────┘
```

### Evaluation Functions (per game)

| Game | Strategy | Signals |
| --- | --- | --- |
| **Pylos** | Phase-tapering (opening → endgame) | Material (reserves), height/position, center preference (precomputed), square/line threats, recoverable pieces |
| **Quoridor** | Shortest-path + wall pressure | Distance to goal, opponent distance, wall count, path structure |
| **Soluna** | Merge-pair counting | Mergeable pairs (positive if my turn), terminal bonuses (round-end, no-moves) |
| **Squadro** | 12-signal linear combination | Race (top-4), retired, collision, chain, sprint, block, parity, structure, ones, return, waste, mobility. Eval weights overridable via presets |

---

## Developer Tooling & Telemetry

Every game ships with **developer-facing panels** that expose the AI engine's internals in real time:

| Panel | Features |
| --- | --- |
| **IAPanel** | Depth selector, time controls (manual/auto), engine flags toggle (TT, PVS, killers, history, LMR, quiescence, aspiration), evaluation bar, PV line display, root-moves ranking with scores |
| **InfoIA** | Simulation runner (AI vs AI), chart visualization, CSV export, dataset comparison, per-player engine config, repeat/cycle detection |
| **Presets** | Built-in presets (balanced, performance, defense) + custom user presets persisted in localStorage |
| **UIUX** | Board appearance, animation speed, piece skins, background themes, hit-box calibration, debug overlays |
| **Historial** | Full move history with pagination, stored games, undo/redo with animation-safe locking |
| **KPI Metrics** | Eval score, PV line, depth reached, total nodes, NPS (nodes/second), time elapsed, search progress |

---

## Testing Strategy

| Layer | Tool | Coverage |
| --- | --- | --- |
| **Game Rules** | Vitest | Board logic, move validation, win conditions, edge cases (16+ spec files for Pylos alone) |
| **AI Engine** | Vitest | Search correctness, evaluation sanity, move ordering, TT behavior, async worker integration |
| **Components** | Vitest + jsdom | Board rendering, panel interactions, hook behavior |
| **Integration** | Vitest | Full game lifecycle (App.integration.spec) |
| **AI Ladder** | Custom runner | Position test suites with JSON fixtures, ladder matches, custom reporters (Squadro) |
| **Type Safety** | `tsc --noEmit` | Full static analysis across all 4 games |
| **Linting** | ESLint 9 | React hooks rules, refresh plugin, strict TypeScript config |

---

## Project Structure

```
MiniGames/
├── CascadeProjects/windsurf-project/
│   ├── frontend/
│   │   ├── pylos/pylos-game/
│   │   │   └── src/
│   │   │       ├── game/              # Rules engine (board, rules, types)
│   │   │       ├── ia/                # AI: search, evaluate, TT, Zobrist,
│   │   │       │   │                  #     book, bitboard, worker
│   │   │       │   ├── search/        # Alpha-beta + PVS core
│   │   │       │   └── worker/        # Web Worker entry point
│   │   │       ├── components/        # Board, FlyingPiece, panels, modals
│   │   │       │   ├── DevTools/      # IAPanel (10+ sub-components),
│   │   │       │   │                  #   InfoIA (8 hooks, services, charts),
│   │   │       │   │                  #   UXPanel (6 tabs), FasePanel, BookPanel
│   │   │       │   └── IAUserPanel/   # User-facing AI controls
│   │   │       ├── hooks/             # useAI, useHistory, usePersistence,
│   │   │       │   └── app/           #   18 specialized app hooks
│   │   │       ├── utils/             # Storage adapters (IndexedDB, localStorage)
│   │   │       └── styles/            # 20+ CSS modules
│   │   │
│   │   ├── quoridor/quoridor-game/
│   │   │   └── src/
│   │   │       ├── game/              # Rules (board, pieces, walls, rules)
│   │   │       ├── ia/                # Minimax, eval, hash, moves, telemetry,
│   │   │       │                      #   trace, worker
│   │   │       ├── components/        # Board, IA/ (7 panel components),
│   │   │       │   └── DevTools/      #   DevToolsPanel, FasesPanel, RulesPanel,
│   │   │       │                      #   UIUX, WallsHitBox, Historial
│   │   │       └── store/             # Redux: gameSlice, uiSlice, iaSlice
│   │   │
│   │   ├── soluna/soluna-game/
│   │   │   └── src/
│   │   │       ├── game/              # Rules, store, types
│   │   │       ├—— ia/                # Search (alpha-beta, quiescence,
│   │   │       │   │                  #   moveOrdering, tactics, root),
│   │   │       │   └—— worker/        #   Worker pool (aiWorker, pool)
│   │   │       ├—— components/        # Board (9 sub-components),
│   │   │       │   ├—— DevTools/      #   IAPanel (advanced settings, presets),
│   │   │       │   │                  #   InfoIA (simulations, charts, compare),
│   │   │       │   │                  #   UIUX (4 tabs), FasesPanel, Historial
│   │   │       │   ├—— HeaderPanel/   # 5 popovers (VsAi, NewGame, Assets...)
│   │   │       │   └—— IAUserPanel/   # Per-player AI controls
│   │   │       ├—— hooks/             # 8 custom hooks (AI controller,
│   │   │       │                      #   localStorage, history, catalogs)
│   │   │       └—— contexts/          # TokenSetContext
│   │   │
│   │   └—— squadro/squadro-game/
│   │       └—— src/
│   │           ├—— game/              # Rules (board, pieces, rules, types)
│   │           ├—— ia/                # Search (alpha-beta, quiescence,
│   │           │   │                  #   moveOrdering, rootParallel, DFPN),
│   │           │   │                  #   evaluate (12 signals), presets,
│   │           │   │                  #   autotune, tablebase, chooser
│   │           │   └—— workers/       # Worker pool entry points
│   │           ├—— components/        # Board (profiles), IAUserPanel,
│   │           │   └—— DevTools/      #   IAPanel (presets), InfoIA (books,
│   │           │                      #   repeats, compare), UIUX (calibration),
│   │           │                      #   RulesPanel, Historial
│   │           ├—— store/             # Redux: gameSlice + typed hooks
│   │           └—— tests/             # Position suites, ladder, reporters
│   │
│   ├—— python/
│   │   ├—— pylos/                     # Desktop prototype (MVC + Pygame + AI)
│   │   └—— scrapper_bga/             # Board Game Arena stats scraper
│   │
│   └—— docs/                          # Technical docs per game (IA, rules,
│                                      #   optimization guides, meeting notes)
│
└—— squadro_AB-MCTS+AlphaGo/
    └—— backend/src/
        └—— squadro_ai/               # Pure Python MCTS engine with
            ├—— game/                  #   game state, rules
            ├—— mcts/                  #   Monte Carlo Tree Search
            └—— policy/                #   Pluggable policy/value (heuristic → NN)
```

---

## Getting Started

### Prerequisites

- **Node.js 18+** and **npm**
- **Python 3.11+** (only for Python modules)

### Run any game

```bash
# Pick a game: pylos, quoridor, soluna, or squadro
cd CascadeProjects/windsurf-project/frontend/<game>/<game>-game

npm install
npm run dev          # Start dev server (Vite HMR)
npm run build        # Production build
npm run test         # Run Vitest suite
npm run test:watch   # Watch mode (where available)
```

### Game-specific scripts

| Game | Extra Scripts |
| --- | --- |
| **Pylos** | `npm run test:watch` |
| **Quoridor** | `npm run coverage` |
| **Soluna** | `npm run test:watch` |
| **Squadro** | `npm run test:watch`, `npm run test:ui` (Vitest UI) |

### Python modules

```bash
# MCTS engine
cd squadro_AB-MCTS+AlphaGo/backend
pip install -r requirements.txt
python -m src.main --simulations 800

# BGA Scraper
cd CascadeProjects/windsurf-project/python/scrapper_bga
pip install -r requirements.txt
python bga_scraper.py
```

---

## Bonus: Python Modules

### Squadro MCTS + AlphaGo Engine

A pure Python implementation of **Monte Carlo Tree Search** with a pluggable policy/value interface, designed to be extended with a trained neural network (AlphaGo-style). Currently uses a heuristic policy for position evaluation.

- **Game engine**: Complete Squadro state, rules, and move generation
- **MCTS**: Configurable simulations, UCB1 selection, expansion, backpropagation
- **Policy interface**: Swap between heuristic and neural network without touching search code

### Board Game Arena Scraper

Data extraction tool for [Board Game Arena](https://boardgamearena.com) player statistics — used to gather training data and analyze game patterns.

- Rate-limited requests, structured JSON export, BeautifulSoup parsing
- Filters by game, opponent, and status

---

## Roadmap

- [ ] End-to-end tests (Playwright) for full game flows
- [ ] AI regression test suite with fixed-position benchmarks
- [ ] Performance profiling per game (CPU/memory) and TT memory limits
- [ ] Keyboard navigation and screen-reader accessibility
- [ ] Neural network policy for MCTS engine (Squadro)
- [ ] Online multiplayer via Supabase Realtime
- [ ] Deploy playable demos (Vercel/Netlify)

---

## About Me

I'm **Gabriel Astudillo Roca** — a full-stack developer who builds complex interactive systems with engineering rigor and product thinking.

This project demonstrates my ability to:

- **Architect complex frontend systems** — 4 independent game engines with shared patterns but game-specific optimizations, clean module boundaries, and multiple state management approaches
- **Implement advanced algorithms** — Alpha-beta search with 10+ optimization techniques, running in real time inside a browser via Web Workers
- **Build production-quality UIs** — Responsive layouts, animations, drag-and-drop, touch support, theme systems, and pixel-perfect panels
- **Design developer tooling** — Real-time telemetry, configurable engine flags, simulation runners, CSV exports, and dataset comparisons — tools I'd build for any engineering team
- **Write maintainable, typed code** — TypeScript throughout, explicit error handling, immutable state during search, 20+ test suites, and ESLint strictness
- **Bridge frontend and AI** — From heuristic design to search optimization to UX for AI transparency, I own the full pipeline

**I'm looking for opportunities** where I can bring this level of engineering depth and product sensibility to a team building impactful software.

📧 **gabriel.astudillo.roca@gmail.com**
🔗 **[GitHub](https://github.com/gabriel-klettur)**

---

<p align="center">
  <em>Built with passion and engineering rigor by Gabriel Astudillo Roca</em>
</p>
