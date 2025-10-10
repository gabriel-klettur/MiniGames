# 🚀 Optimización del motor IA de Squadro basado en Minimax

Este documento resume cómo está implementada la IA de Squadro con minimax (negamax) y poda alfa–beta, y qué optimizaciones aplicar a corto/medio plazo. Está orientado a la implementación en TypeScript del frontend, con búsqueda dentro de un Web Worker para no bloquear la UI.

Fuentes relevantes en el código:

- `frontend/squadro/squadro-game/src/ia/search.ts`
- `frontend/squadro/squadro-game/src/ia/search/alphabeta.ts`
- `frontend/squadro/squadro-game/src/ia/search/moveOrdering.ts`
- `frontend/squadro/squadro-game/src/ia/moves.ts`
- `frontend/squadro/squadro-game/src/ia/evaluate.ts`
- `frontend/squadro/squadro-game/src/ia/tt.ts` y `frontend/squadro/squadro-game/src/ia/hash.ts`
- Worker: `frontend/squadro/squadro-game/src/ia/aiWorker.ts`
- Integración DevTools: `frontend/squadro/squadro-game/src/components/DevTools/InfoIA/*`

---

## 1. Representación del estado

En Squadro, el `GameState` (`src/game/types.ts`) modela carriles, piezas y turnos:

- `lanesByPlayer: Record<Player, Lane[]>` (5 carriles por jugador) con `length`, `speedOut`, `speedBack`.
- `pieces: Piece[]` con `{ id, owner, laneIndex, pos, state }` donde `state ∈ {'en_ida','en_vuelta','retirada'}`.
- `turn: Player` y terminal opcional `winner?: Player`.
- Campos de UI y AI no afectan a reglas: `ui`, `ai?`.

Consejo: mantener `GameState` inmutable en la búsqueda; `applyMove()` ya clona internamente antes de aplicar reglas.

---

## 2. Generación y aplicación de movimientos

- `generateMoves(gs)` (`src/ia/moves.ts`) devuelve los IDs de piezas movibles del jugador al turno.
- `applyMove(state, moveId)` clona el estado y aplica reglas de juego vía `movePiece` (`src/game/rules`).
- `orderMoves(gs, moves, me, hints?)` ordena movimientos con heurística estática (retirar pieza, saltos, progreso seguro) y soporta hints `killers` e `history`.

Efecto: mejor orden ⇒ más podas β ⇒ menos nodos.

---

## 3. Evaluación (Evaluation Function)

Implementación actual en `src/ia/evaluate.ts` (ligera y específica de Squadro):

- Terminal: `winner` retorna ±100000 (near-mate score). El negamax ajusta por `ply` para preferir victorias rápidas y demorar derrotas.
- No terminal: combinación lineal barata de términos O(N):
  - Carrera en turnos: menos turnos restantes es mejor; bonus por piezas retiradas.
  - Choques inminentes: delta aproximada de turnos perdidos/ganados en 1–2 plies.
  - Sprint final: prioriza cierre si alguna pieza está a ≤ umbral de turnos.
  - Bloqueo útil vs exposición: taps útiles menos exposición inmediata.
  - Tempo suave si es tu turno.

La evaluación permanece barata por nodo y sin explorar a profundidad. Evita cálculos costosos por pieza.

---

## 4. Minimax (Negamax) con poda alfa–beta y ordenación de movimientos

En `src/ia/search/alphabeta.ts`:

- `bestMoveIterative()` ejecuta iterative deepening y, por iteración, llama a `negamax(params, ctx, tt, deadline, engine)` con poda α–β.
- Ordenación de movimientos: `orderedMoves()` (`src/ia/search/moveOrdering.ts`) delega en `orderMoves()` con soporte para `killers` e `history` (cuando están activados en `engine`).
- Transposition Table (TT): `TranspositionTable` (`src/ia/tt.ts`) usa `hashState(gs)` (`src/ia/hash.ts`, Zobrist) para probe/store con `bound ∈ {EXACT, LOWER, UPPER}`.
- Heurísticas de búsqueda soportadas por flags del motor (`EngineOptions`):
  - TT, Killers, History.
  - PVS (Principal Variation Search) en ramas no-PV.
  - LMR (Late Move Reductions) en movimientos tardíos no tácticos.

Notas:

- Actualmente no se pasa `hashMove` desde TT al ordenador (está listo en `orderMoves` pero no cableado desde `alphabeta`). Es una mejora recomendable.
- El almacenamiento en TT respeta profundidad y tipo de cota; política simple de reemplazo preferente por profundidad.

---

## 5. Iterative Deepening + Control por Tiempo

La búsqueda en UI se gestiona en un Worker (`src/ia/aiWorker.ts`):

- Recibe `{ type: 'run', state, opts: { maxDepth, timeLimitMs, rootMoves?, forcedFirstMove?, engine? } }`.
- Ejecuta `findBestMove(state, options)` (`src/ia/search.ts`), que a su vez llama a `bestMoveIterative` con un deadline.
- Publica eventos `search_event` con `{ depth, score, nodesVisited }` y al final `result { moveId, score, depthReached }`.

Tiempo:

- Manual: la UI (`useSimulationRunner`) traduce segundos a `timeLimitMs`; en modo Auto pasa `Infinity` (el motor detiene por profundidad o condición de iteraciones forzadas).
- No hay presupuesto adaptativo automático todavía (posible mejora futura).

---

## 6. Integración con DevTools: InfoIA, presets y medición

- `createAIRunner()` (`InfoIA/services/aiRunner.ts`) abstrae el Worker, con cancelación y callback de progreso.
- `useSimulationRunner()` ejecuta partidas automáticas y registra por jugada: `elapsedMs`, `depthReached`, `nodes`, `nps`, `score`, `player`, `depthUsed`, `applied`, con `startedAt` por partida y `at` por jugada.
- Persistencia y export: `useRecords()` usa IndexedDB (vía `services/storage`) y export a JSON/CSV.
- Presets IA: `src/ia/presets.ts` unifica presets entre IAPanel e InfoIA usando `localStorage` (`squadro:ia:presets`, `squadro:ia:selected`), con defaults como IAPowa, IAPowa+Rendimiento, IAPowa+Defensa.

---

## 7. Optimizaciones recomendadas (próximos pasos)

Compatibles con la base actual:

1) Hash move desde TT para ordering
   - Usar `entry.bestMove` como `hashMove` en `orderedMoves()`.
   - Suele mejorar cortes β tras el primer hijo.

2) Aspiration Windows
   - Con iterative deepening, buscar con ventana alrededor del score previo `[S-Δ, S+Δ]` (p. ej., `Δ=25`).
   - Re-buscar con ventana ampliada en fallo bajo/alto. Exactitud preservada.

3) Paralelización a nivel raíz (opcional y exacta)
   - Evaluar movimientos raíz en Workers múltiples (`workerPool.ts`) y compartir α por mensajes.
   - Cuidar latencia/determinismo para InfoIA.

4) Quiescence Search (limitada)
   - Extender en posiciones tácticas obvias (saltos/retiradas forzadas) para evitar efecto horizonte.
   - Mantener flags de activación y validar exactitud a profundidad fija.

5) Control de tiempo más robusto
   - Presupuesto adaptativo por branching factor de raíz.
   - Tolerancias mínimas (p. ej., 50 ms) y early exit si score near-mate.

6) Micro-optimizaciones
   - Reusar arrays/buffers y evitar GC en `orderMoves()`.
   - Precomputar métricas por pieza una vez por nodo y compartir en hijos.
   - Usar constantes near-mate (`WIN = 100000`) para evitar costes con `Infinity`.

---

## 8. Integración en Frontend (resumen de API)

Worker y progresos:

```ts
// Main thread (InfoIA runner)
const worker = new Worker(new URL('src/ia/aiWorker.ts', import.meta.url), { type: 'module' });
worker.postMessage({
  type: 'run',
  state,
  opts: { maxDepth: 5, timeLimitMs: 1500, engine: { enableTT: true, enablePVS: true, enableLMR: true } },
});
worker.onmessage = (e) => {
  const data = e.data;
  if (data.type === 'search_event') {
    // data.ev: { depth, score, nodesVisited }
  } else if (data.type === 'result') {
    // { moveId, score, depthReached }
  }
};
```

Interfaz de módulo de búsqueda:

```ts
import { findBestMove } from 'src/ia/search';
const res = await findBestMove(state, {
  maxDepth: 6,
  timeLimitMs: 2000,
  onProgress: (ev) => {/* start/progress/iter/end */},
  engine: { enableTT: true, enableKillers: true, enableHistory: true, enablePVS: true, enableLMR: true },
});
// res: { moveId, score, depthReached, engineStats? }
```

---

## 9. Pruebas existentes y recomendadas

Existentes (unitarias de juego): `tests/*.test.ts` para reglas, piezas y slice. No hay aún tests dedicados a IA.

Recomendadas (IA):

- `evaluate.test.ts`: terminales ±WIN según `winner`, signos coherentes y estabilidad ante pequeñas variaciones.
- `search.test.ts`: determinismo, PV estable entre iteraciones, relación profundidad→nodos, correcta aplicación de TT/PVS/LMR con flags.
- Tests de ordenación raíz y de estabilidad de scores con Aspiration/Hash move (cuando se implementen).

---

## ✅ Checklist de Implementación (estado y próximos pasos)

- [x] Generación de movimientos (`generateMoves`) y aplicación (`applyMove`).
- [x] Evaluación terminal y heurística específica de Squadro (`evaluate`).
- [x] Medición de `nodes`, `depthReached` y progreso por iteración.
- [x] Transposition Table + Zobrist (`tt.ts`, `hash.ts`).
- [x] PVS y LMR (con parámetros en `EngineOptions`).
- [x] Killers/History heuristic.
 - [x] Hash move desde TT para `orderedMoves` (via `EngineOptions.preferHashMove`, activo por defecto).
 - [x] Aspiration Windows (completado).
  - [x] Quiescence Search (acotada a tácticas claras).
  - [x] Presupuesto de tiempo adaptativo por factor de ramificación (heurística y slack).
  - [x] Paralelización a nivel raíz (orquestador en main thread con `workerPool`).

---

## Glosario rápido

{{ ... }}
- Poda alfa–beta (alpha–beta pruning) — Descarta ramas que no mejoran — `alpha >= beta` ⇒ corte β.
- Variación principal (principal variation) — Secuencia de jugadas óptimas — Útil para depurar y UI.
- Ordenación de movimientos (move ordering) — Explorar “mejores” primero — Más cortes β.
- Iterative deepening — Profundidades crecientes con timebox — Provee PV y seed de ordering.
- NPS (nodes per second) — Nodos/segundo — Métrica de rendimiento en InfoIA.
- Tabla de transposiciones (transposition table) — Cache por hash de posición — Reutiliza resultados.
- LMR — Reduce profundidad en movimientos tardíos no tácticos — Re-busca si `fail-high`.
- PVS — Ventana nula en no-PV — Re-busca con ventana completa si mejora α.

---

## 10. Objetivo: acelerar sin perder exactitud a profundidad fija

Priorizar optimizaciones que preservan exactitud del negamax con poda alfa–beta:

- Seguras: TT + Zobrist, PV move (via hash move), Killers/History, PVS, Iterative Deepening, Aspiration Windows (con re-búsqueda), near-mate scores.
- Selectivas: LMR (ya presente, con salvaguardas), Quiescence, paralelización raíz. Activarlas con flags y validar con InfoIA.

Cada paso debe acompañarse de tests y mediciones en InfoIA para confirmar mismo mejor movimiento a igual profundidad y menor tiempo.
