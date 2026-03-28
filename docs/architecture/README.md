# MiniGames Suite — Architecture Documentation

> **Portfolio-ready architecture documentation** for a collection of four AI-powered abstract strategy board games.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [System Context](#system-context)
- [Container Architecture](#container-architecture)
- [Component Architecture](#component-architecture)
  - [Shared Layered Architecture](#shared-layered-architecture)
  - [Squadro-Specific Components](#squadro-specific-components)
  - [Pylos-Specific Components](#pylos-specific-components)
- [Critical Flow: AI Move Calculation](#critical-flow-ai-move-calculation)
- [Deployment Architecture](#deployment-architecture)
- [Technology Stack](#technology-stack)
- [Design Decisions & Trade-offs](#design-decisions--trade-offs)
- [Assumptions & Uncertainties](#assumptions--uncertainties)

---

## Executive Summary

**MiniGames Suite** is a collection of four fully-playable abstract strategy board games—**Pylos**, **Quoridor**, **Soluna**, and **Squadro**—each featuring:

- **Complete game engine** with rule enforcement, move validation, and win detection
- **Configurable AI opponent** using alpha-beta search with 10+ optimization techniques
- **Real-time telemetry** exposing search metrics, evaluation scores, and principal variation
- **Developer tooling** for AI tuning, simulation running, and debugging
- **Responsive UI** with animations, themes, and touch support

All computation runs **entirely client-side** in the browser, with AI search offloaded to Web Workers for UI responsiveness.

### Key Metrics

| Metric | Value |
|--------|-------|
| **Games** | 4 (Pylos, Quoridor, Soluna, Squadro) |
| **Total Source Files** | ~400+ TypeScript/TSX files |
| **AI Techniques** | 12+ (PVS, TT, LMR, DFPN, etc.) |
| **Test Suites** | 20+ spec files |
| **State Patterns** | Redux Toolkit, Context+Reducer |

---

## System Context

```mermaid
graph TB
    subgraph actors [" "]
        direction TB
        HP[("👤 Human Player<br/><i>Plays games via browser</i>")]
        DEV[("👨‍💻 Developer<br/><i>Tunes AI, analyzes telemetry</i>")]
    end

    subgraph system ["MiniGames Suite"]
        direction TB
        MG["🎮 MiniGames Frontend<br/><i>React 19 + TypeScript 5.8</i><br/><i>4 AI-powered board games</i>"]
    end

    subgraph external [" "]
        direction TB
        LS[("💾 Browser localStorage<br/><i>Persists sessions, presets,<br/>UI preferences</i>")]
        WW[("⚙️ Web Workers<br/><i>Off-thread AI computation</i>")]
        SH[("☁️ Static Hosting<br/><i>Vercel / Netlify</i><br/><i>(SUPUESTO)</i>")]
    end

    HP -->|"Plays games<br/>Configures AI difficulty"| MG
    DEV -->|"Runs simulations<br/>Adjusts engine flags"| MG
    MG -->|"Reads/writes<br/>game state & config"| LS
    MG -->|"postMessage<br/>search requests"| WW
    WW -->|"Returns best move<br/>+ metrics"| MG
    SH -->|"Serves static<br/>assets"| MG

    classDef actor fill:#08427b,stroke:#052e56,color:#fff
    classDef system fill:#1168bd,stroke:#0b4884,color:#fff
    classDef external fill:#999999,stroke:#6b6b6b,color:#fff

    class HP,DEV actor
    class MG system
    class LS,WW,SH external
```

### What This Diagram Shows

The **Context Diagram** (C4 Level 1) establishes the system boundary and external interactions:

- **Human Player**: End user who plays games through the browser interface
- **Developer**: Uses DevTools panels for AI configuration and analysis
- **Browser localStorage**: Persistence layer for sessions, presets, and configuration
- **Web Workers**: Dedicated threads for AI computation (critical for UI responsiveness)
- **Static Hosting**: Deployment target (Vercel/Netlify based on roadmap)

### Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Client-side only** | Zero backend dependencies = simpler deployment, offline capability |
| **Web Workers for AI** | Main thread stays responsive during deep searches (5+ seconds) |
| **localStorage persistence** | Simple, synchronous, sufficient for game state and config |

### Trade-offs

- ✅ **Pros**: No server costs, instant deployment, works offline
- ⚠️ **Cons**: No multiplayer (yet), limited storage (~5MB), no cross-device sync

---

## Container Architecture

```mermaid
graph TB
    subgraph actors [" "]
        HP[("👤 Human Player")]
        DEV[("👨‍💻 Developer")]
    end

    subgraph minigames ["MiniGames Suite"]
        direction TB
        
        subgraph pylos ["Pylos Game"]
            PY["🔺 Pylos<br/><i>React 19 + CSS Modules</i><br/><i>Hooks + Reducers</i><br/><br/>Opening Book | Bitboard<br/>Phase-tapering Eval"]
        end

        subgraph quoridor ["Quoridor Game"]
            QR["🧱 Quoridor<br/><i>React 19 + Tailwind CSS</i><br/><i>Redux Toolkit</i><br/><br/>Path-finding Eval<br/>Wall Pressure Heuristics"]
        end

        subgraph soluna ["Soluna Game"]
            SL["🌙 Soluna<br/><i>React 19 + CSS Modules</i><br/><i>Context + Reducer</i><br/><br/>Worker Pool<br/>Adaptive Time Budget"]
        end

        subgraph squadro ["Squadro Game"]
            SQ["🏎️ Squadro<br/><i>React 19 + Tailwind CSS</i><br/><i>Redux Toolkit</i><br/><br/>Root-Parallel | DFPN<br/>12-Signal Evaluation"]
        end
    end

    subgraph shared ["Shared Infrastructure"]
        WW["⚙️ Web Workers<br/><i>AI Computation Layer</i>"]
        LS["💾 localStorage<br/><i>Persistence Layer</i>"]
    end

    HP --> PY & QR & SL & SQ
    DEV --> PY & QR & SL & SQ

    PY & QR & SL & SQ --> WW
    PY & QR & SL & SQ --> LS

    classDef actor fill:#08427b,stroke:#052e56,color:#fff
    classDef container fill:#438dd5,stroke:#2e6295,color:#fff
    classDef infra fill:#999999,stroke:#6b6b6b,color:#fff

    class HP,DEV actor
    class PY,QR,SL,SQ container
    class WW,LS infra
```

### What This Diagram Shows

The **Container Diagram** (C4 Level 2) shows the four game containers as independent applications sharing common infrastructure.

### Container Comparison

| Game | State Management | Styling | Unique AI Features |
|------|------------------|---------|-------------------|
| **Pylos** | Hooks + Reducers | CSS Modules | Opening Book, Bitboard, Phase-tapering |
| **Quoridor** | Redux Toolkit (3 slices) | Tailwind CSS | Path-finding, Wall pressure, Trace/Telemetry |
| **Soluna** | Context + Reducer | CSS Modules | Worker Pool, Adaptive time budget |
| **Squadro** | Redux Toolkit | Tailwind CSS | Root-Parallel, DFPN, 12-signal evaluation |

### Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Independent containers** | Each game can be deployed/tested independently |
| **Mixed state patterns** | Redux for complex state (Quoridor, Squadro), Context for simpler (Pylos, Soluna) |
| **Shared infrastructure** | Web Workers and localStorage are browser APIs, not shared code |

### Trade-offs

- ✅ **Pros**: Independent deployment, technology experimentation per game
- ⚠️ **Cons**: Some code duplication (AI patterns), no shared component library

---

## Component Architecture

### Shared Layered Architecture

All four games follow the same **layered architecture pattern**:

```mermaid
graph TB
    subgraph ui_layer ["UI Layer"]
        direction LR
        BOARD["Board<br/><i>Game visualization</i>"]
        PANELS["Panels<br/><i>Header, Footer, Info</i>"]
        MODAL["GameOverModal<br/><i>Win/Draw display</i>"]
        IAUSER["IAUserPanel<br/><i>Difficulty, presets</i>"]
    end

    subgraph devtools_layer ["DevTools Layer"]
        direction LR
        IAPANEL["IAPanel<br/><i>Engine flags, KPIs</i>"]
        INFOIA["InfoIA<br/><i>Simulations, charts</i>"]
        UIUX["UIUX<br/><i>Themes, animations</i>"]
        HISTORIAL["Historial<br/><i>Move history</i>"]
    end

    subgraph state_layer ["State Management Layer"]
        direction LR
        REDUX["Redux Toolkit<br/><i>Quoridor, Squadro</i>"]
        CONTEXT["Context + Reducer<br/><i>Pylos, Soluna</i>"]
    end

    subgraph hooks_layer ["Hooks Layer"]
        direction LR
        USEAI["useAI<br/><i>AI controller</i>"]
        USEHIST["useHistory<br/><i>Undo/redo</i>"]
        USEPERSIST["usePersistence<br/><i>localStorage</i>"]
    end

    subgraph ai_layer ["AI Engine Layer"]
        direction LR
        SEARCH["Search<br/><i>Alpha-beta, PVS, ID</i>"]
        EVAL["Evaluate<br/><i>Heuristic function</i>"]
        TT["Transposition Table<br/><i>Zobrist hashing</i>"]
        ORDERING["Move Ordering<br/><i>Killers, history</i>"]
    end

    subgraph game_layer ["Game Engine Layer"]
        direction LR
        RULES["Rules<br/><i>Move validation</i>"]
        BOARDLOGIC["Board<br/><i>State representation</i>"]
        TYPES["Types<br/><i>Domain models</i>"]
    end

    subgraph worker_layer ["Web Worker Layer"]
        WORKER["aiWorker.ts<br/><i>Off-thread execution</i>"]
    end

    subgraph persistence_layer ["Persistence Layer"]
        STORAGE["localStorage<br/><i>Sessions, presets, config</i>"]
    end

    ui_layer --> state_layer
    devtools_layer --> state_layer
    state_layer --> hooks_layer
    hooks_layer --> worker_layer
    worker_layer --> ai_layer
    ai_layer --> game_layer
    hooks_layer --> persistence_layer

    classDef uiStyle fill:#61dafb,stroke:#21a1c4,color:#000
    classDef devStyle fill:#ffd700,stroke:#b8860b,color:#000
    classDef stateStyle fill:#764abc,stroke:#4a2c7a,color:#fff
    classDef hookStyle fill:#68d391,stroke:#38a169,color:#000
    classDef aiStyle fill:#f56565,stroke:#c53030,color:#fff
    classDef gameStyle fill:#4299e1,stroke:#2b6cb0,color:#fff
    classDef workerStyle fill:#ed8936,stroke:#c05621,color:#fff
    classDef storageStyle fill:#a0aec0,stroke:#718096,color:#000

    class BOARD,PANELS,MODAL,IAUSER uiStyle
    class IAPANEL,INFOIA,UIUX,HISTORIAL devStyle
    class REDUX,CONTEXT stateStyle
    class USEAI,USEHIST,USEPERSIST hookStyle
    class SEARCH,EVAL,TT,ORDERING aiStyle
    class RULES,BOARDLOGIC,TYPES gameStyle
    class WORKER workerStyle
    class STORAGE storageStyle
```

### Layer Responsibilities

| Layer | Path | Responsibility |
|-------|------|----------------|
| **UI** | `src/components/` | Visual rendering, user interaction |
| **DevTools** | `src/components/DevTools/` | AI telemetry, engine config, debugging |
| **State** | `src/store/` or `src/game/store.tsx` | Global state, actions, selectors |
| **Hooks** | `src/hooks/` | AI controller, history, persistence |
| **AI Engine** | `src/ia/` | Search algorithms, evaluation, caching |
| **Game Engine** | `src/game/` | Rules, validation, state representation |
| **Worker** | `src/ia/worker/` | Off-thread AI execution |
| **Persistence** | localStorage | Sessions, presets, configuration |

### Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Strict layer separation** | Game rules never import UI; AI never imports state management |
| **Worker boundary** | AI engine is self-contained and can run in Worker context |
| **Hooks as controllers** | `useAI` orchestrates Worker communication and state updates |

---

### Squadro-Specific Components

Squadro has the most advanced AI implementation with **parallel search** and **endgame solving**:

```mermaid
graph TB
    subgraph ui ["UI Components"]
        BOARD["Board<br/><i>+ boardProfiles.ts</i>"]
        IAUSER["IAUserPanel<br/><i>Depth, presets, player toggle</i>"]
        DEVTOOLS["DevTools<br/><i>IAPanel, InfoIA, UIUX</i>"]
    end

    subgraph state ["State (Redux Toolkit)"]
        SLICE["gameSlice.ts<br/><i>21KB - Full game state</i>"]
        HOOKS["hooks.ts<br/><i>Typed selectors</i>"]
    end

    subgraph ai_core ["AI Core"]
        direction TB
        
        subgraph search_module ["Search Module"]
            ALPHABETA["alphabeta.ts<br/><i>PVS, LMR, LMP, Futility</i>"]
            QUIESCE["quiescence.ts<br/><i>Tactical extension</i>"]
            IID["IID<br/><i>Internal Iterative Deepening</i>"]
        end

        subgraph parallel ["Parallelization"]
            ROOTPAR["rootParallel.ts<br/><i>Root-level split</i>"]
            POOL["workerPool.ts<br/><i>Worker management</i>"]
            SPLIT["2nd-Ply Split<br/><i>Deeper parallelism</i>"]
        end

        subgraph endgame ["Endgame Solver"]
            DFPN["dfpn/<br/><i>Proof-Number Search</i>"]
            TABLEBASE["tablebase.ts<br/><i>Precomputed positions</i>"]
        end
    end

    subgraph evaluation ["12-Signal Evaluation"]
        direction LR
        SIG1["Race"]
        SIG2["Retired"]
        SIG3["Collision"]
        SIG4["Chain"]
        SIG5["Sprint"]
        SIG6["Block"]
        SIG7["Parity"]
        SIG8["Structure"]
        SIG9["Ones"]
        SIG10["Return"]
        SIG11["Waste"]
        SIG12["Mobility"]
    end

    subgraph support ["Support Modules"]
        EVAL["evaluate.ts<br/><i>21KB - Signal aggregation</i>"]
        PRESETS["presets.ts<br/><i>11KB - Engine configs</i>"]
        AUTOTUNE["autotune.ts<br/><i>9KB - Parameter optimization</i>"]
    end

    ui --> state
    state --> ai_core
    ai_core --> evaluation
    evaluation --> EVAL
    support --> ai_core

    classDef unique fill:#f56565,stroke:#c53030,color:#fff
    classDef eval fill:#48bb78,stroke:#2f855a,color:#fff

    class ROOTPAR,POOL,SPLIT,DFPN,TABLEBASE,AUTOTUNE unique
    class SIG1,SIG2,SIG3,SIG4,SIG5,SIG6,SIG7,SIG8,SIG9,SIG10,SIG11,SIG12 eval
```

### Squadro Unique Features

| Feature | File | Purpose |
|---------|------|---------|
| **Root-Parallel Search** | `rootParallel.ts` | Splits root moves across workers |
| **2nd-Ply Split** | Worker pool | Deeper parallelization level |
| **DFPN Solver** | `dfpn/` | Proof-number search for endgames |
| **12-Signal Evaluation** | `evaluate.ts` | Comprehensive position assessment |
| **Autotune** | `autotune.ts` | Parameter optimization framework |

---

### Pylos-Specific Components

Pylos features **opening book** support and **bitboard optimization**:

```mermaid
graph TB
    subgraph ui ["UI Components"]
        BOARD["Board.tsx<br/><i>12KB - Pyramid rendering</i>"]
        FLYING["FlyingPiece.tsx<br/><i>Piece animations</i>"]
        STORED["StoredGames.tsx<br/><i>Session management</i>"]
    end

    subgraph hooks ["Hooks Layer (25+ hooks)"]
        USEAI["useAI.ts<br/><i>24KB - AI controller</i>"]
        USEANIM["useAnimations.ts<br/><i>13KB - Animation state</i>"]
        USEPERSIST["usePersistence.ts<br/><i>6KB - localStorage</i>"]
    end

    subgraph ai_core ["AI Core"]
        subgraph opening ["Opening Book System"]
            BOOK["book.ts<br/><i>5KB - Book probe</i>"]
            BOOKPANEL["BookPanel/<br/><i>UI for book config</i>"]
        end

        subgraph optimization ["Bitboard Optimization"]
            BITBOARD["bitboard.ts<br/><i>3.9KB - Bit operations</i>"]
            PRECOMP["precomputed.ts<br/><i>4.5KB - Center tables</i>"]
        end
    end

    subgraph evaluation ["Phase-Tapering Evaluation"]
        OPENING["Opening Phase<br/><i>Center preference</i>"]
        MIDGAME["Midgame Phase<br/><i>Square/line threats</i>"]
        ENDGAME["Endgame Phase<br/><i>Material focus</i>"]
    end

    subgraph testing ["Test Coverage (16+ specs)"]
        SPECS["rules.spec.ts | board.spec.ts<br/>evaluate.spec.ts | moves.spec.ts<br/>search.spec.ts | Board.spec.tsx"]
    end

    ui --> hooks
    hooks --> ai_core
    ai_core --> evaluation

    classDef unique fill:#f56565,stroke:#c53030,color:#fff
    classDef phase fill:#9f7aea,stroke:#6b46c1,color:#fff
    classDef test fill:#48bb78,stroke:#2f855a,color:#fff

    class BOOK,BOOKPANEL,BITBOARD,PRECOMP unique
    class OPENING,MIDGAME,ENDGAME phase
    class SPECS test
```

### Pylos Unique Features

| Feature | File | Purpose |
|---------|------|---------|
| **Opening Book** | `book.ts` | Precomputed opening moves |
| **Bitboard** | `bitboard.ts` | Fast bit-level operations |
| **Precomputed Tables** | `precomputed.ts` | Center preference lookup |
| **Phase-Tapering** | `evaluate.ts` | Evaluation changes by game phase |
| **16+ Test Suites** | `*.spec.ts` | Comprehensive test coverage |

---

## Critical Flow: AI Move Calculation

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant UI as 🖥️ UI Components
    participant S as 📦 State Layer
    participant H as 🪝 useAI Hook
    participant W as ⚙️ Web Worker
    participant AI as 🧠 AI Engine
    participant G as 🎮 Game Engine

    Note over U,G: User Turn Phase
    U->>UI: Click board (make move)
    UI->>S: Dispatch move action
    S->>G: Validate move (rules.ts)
    G-->>S: Move valid ✓
    S->>S: Apply move to state
    S-->>UI: State updated
    UI->>UI: Render new position

    Note over U,G: AI Turn Phase
    S->>H: Turn changed to AI
    H->>H: Check if AI enabled
    
    rect rgb(255, 240, 240)
        Note over H,AI: Off-Thread Computation
        H->>W: postMessage({type: 'SEARCH', state, depth, timeMs})
        W->>AI: Initialize search context
        
        loop Iterative Deepening (depth 1 → maxDepth)
            AI->>AI: Age TT generation
            AI->>AI: Set aspiration window (if enabled)
            AI->>G: generateMoves(state)
            G-->>AI: Legal moves[]
            AI->>AI: Order moves (TT, killers, history)
            AI->>AI: Alpha-beta search with PVS, LMR
            AI-->>W: Iteration complete
            W-->>H: postMessage({type: 'PROGRESS'})
            H-->>UI: Update telemetry panels
        end
        
        W-->>H: postMessage({type: 'RESULT', bestMove, score, pv})
    end

    Note over U,G: AI Move Application
    H->>S: Dispatch AI move action
    S->>S: Apply AI move to state
    S-->>UI: State updated
    UI->>UI: Animate piece movement
    UI-->>U: Ready for next move
```

### What This Diagram Shows

The **Sequence Diagram** traces the critical path from user input to AI response:

1. **User Turn**: Click → Validate → Apply → Render
2. **AI Trigger**: State change detected by `useAI` hook
3. **Worker Communication**: `postMessage` API for thread isolation
4. **Iterative Deepening**: Progressive depth with time control
5. **Progress Streaming**: Real-time telemetry updates
6. **Result Application**: AI move applied with animation

### Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Iterative deepening** | Always have a valid move; deeper search if time permits |
| **Progress streaming** | User sees search activity; can cancel if needed |
| **Aspiration windows** | Narrow search bounds for faster cutoffs |
| **TT generation aging** | Prefer fresh entries over stale cached results |

---

## Deployment Architecture

```mermaid
graph TB
    subgraph user_device ["User Device (Browser)"]
        subgraph browser ["Web Browser"]
            subgraph main_thread ["Main Thread"]
                REACT["React 19 App<br/><i>UI rendering, state</i>"]
                REDUX["Redux / Context<br/><i>State management</i>"]
                HOOKS["Hooks<br/><i>AI controller, persistence</i>"]
            end
            
            subgraph workers ["Web Workers"]
                W1["Worker 1<br/><i>AI Search</i>"]
                W2["Worker 2<br/><i>Parallel (Squadro)</i>"]
                WN["Worker N<br/><i>Pool (Soluna)</i>"]
            end
            
            subgraph storage ["Browser Storage"]
                LS["localStorage<br/><i>Sessions, presets</i>"]
            end
        end
    end

    subgraph hosting ["Static Hosting (SUPUESTO)"]
        STATIC["Static Assets<br/><i>HTML, JS, CSS</i>"]
        VITE["Vite Build<br/><i>Optimized bundles</i>"]
    end

    subgraph dev ["Development"]
        VITEDEV["Vite Dev Server<br/><i>HMR</i>"]
        VITEST["Vitest<br/><i>Tests</i>"]
    end

    STATIC --> browser
    REACT <--> REDUX
    REDUX <--> HOOKS
    HOOKS <-->|"postMessage"| workers
    HOOKS <--> storage
    VITE --> STATIC

    classDef browser fill:#61dafb,stroke:#21a1c4,color:#000
    classDef worker fill:#ed8936,stroke:#c05621,color:#fff
    classDef storage fill:#a0aec0,stroke:#718096,color:#000
    classDef hosting fill:#48bb78,stroke:#2f855a,color:#fff

    class REACT,REDUX,HOOKS browser
    class W1,W2,WN worker
    class LS storage
    class STATIC,VITE hosting
```

### Deployment Characteristics

| Aspect | Details |
|--------|---------|
| **Build Tool** | Vite 7 with optimized production bundles |
| **Output** | Static HTML, JS, CSS (no server required) |
| **Hosting** | Any static host (Vercel, Netlify, GitHub Pages) |
| **Workers** | Bundled as separate chunks, loaded on demand |
| **Persistence** | Browser localStorage (~5MB limit) |

---

## Technology Stack

### Frontend Core

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1 | Component-based UI |
| TypeScript | 5.8 | Type safety |
| Vite | 7 | Build tool, HMR |
| Redux Toolkit | 2.9 | State management (Quoridor, Squadro) |
| Tailwind CSS | 4.1 | Utility-first styling |
| Vitest | 3.2 | Unit testing |
| ESLint | 9 | Code quality |

### AI Algorithms Implemented

| Technique | Purpose |
|-----------|---------|
| Negamax + Alpha-Beta | Core adversarial search |
| Principal Variation Search (PVS) | Narrow-window optimization |
| Iterative Deepening | Progressive depth with time control |
| Transposition Table (Zobrist) | Position caching |
| Killer Heuristic | Move ordering by cutoff history |
| History Heuristic | Global move-ordering signal |
| Late Move Reductions (LMR) | Depth reduction for late moves |
| Late Move Pruning (LMP) | Skip unpromising moves |
| Futility Pruning | Prune hopeless nodes |
| Aspiration Windows | Tighter search bounds |
| Quiescence Search | Tactical extension |
| Internal Iterative Deepening (IID) | Hash-move seed |
| DFPN (Squadro) | Proof-number endgame solver |
| Opening Book (Pylos) | Precomputed openings |

---

## Design Decisions & Trade-offs

### Architecture Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **Client-side only** | Zero backend, offline capable, simple deployment | No multiplayer, limited storage |
| **Web Workers for AI** | UI stays responsive during 5+ second searches | Worker communication overhead |
| **Mixed state patterns** | Right tool for each game's complexity | Some learning curve |
| **Independent containers** | Deploy/test games independently | Code duplication |
| **Layered architecture** | Clean separation, testable units | More files, indirection |

### AI Design Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **Iterative deepening** | Always have a move; deeper if time permits | Repeated work at shallow depths |
| **Per-iteration TT** | Fresh entries preferred | Memory churn |
| **Game-specific evaluation** | Tailored heuristics per game | No shared evaluation code |
| **Worker pool (Soluna/Squadro)** | Parallel search for speed | Complexity, synchronization |

---

## Assumptions & Uncertainties

### Assumptions

| ID | Assumption | Basis |
|----|------------|-------|
| A1 | No backend server exists | No server code found in repository |
| A2 | Deployment target is static hosting | README roadmap mentions Vercel/Netlify |
| A3 | `peg-solitario-game` is incomplete | Directory is empty (0 items) |
| A4 | Python modules are research tools | Separate from frontend architecture |

### Uncertainties

| ID | Uncertainty | Impact |
|----|-------------|--------|
| U1 | Exact deployment configuration | Deployment diagram is partially assumed |
| U2 | CI/CD pipeline | No configuration files detected |
| U3 | IndexedDB usage extent | Mentioned in utils but unclear scope |
| U4 | Production performance metrics | No profiling data available |

---

## File Index

| File | Description |
|------|-------------|
| `architecture.json` | Machine-readable architecture specification |
| `diagrams/context.mmd` | System context diagram (C4 Level 1) |
| `diagrams/containers.mmd` | Container diagram (C4 Level 2) |
| `diagrams/components-shared.mmd` | Shared layered architecture |
| `diagrams/components-squadro.mmd` | Squadro-specific components |
| `diagrams/components-pylos.mmd` | Pylos-specific components |
| `diagrams/sequence-ai-move.mmd` | AI move calculation flow |
| `diagrams/deployment.mmd` | Deployment architecture |

---

<p align="center">
  <em>Architecture documentation generated for portfolio presentation</em><br/>
  <strong>Gabriel Astudillo Roca</strong>
</p>
