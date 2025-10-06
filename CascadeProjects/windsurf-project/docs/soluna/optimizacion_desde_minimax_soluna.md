# 🚀 Optimización del motor IA de Soluna basado en Minimax

Este documento resume cómo está implementada la IA de Soluna con **minimax y poda alfa–beta (alpha–beta pruning)** y qué optimizaciones aplicar a corto/medio plazo. Está orientado a la implementación en **TypeScript** del frontend, con búsqueda dentro de un **Web Worker** para no bloquear la UI.

Fuentes relevantes en el código:

- `frontend/soluna/soluna-game/src/ia/search.ts`
- `frontend/soluna/soluna-game/src/ia/evaluate.ts`
- `frontend/soluna/soluna-game/src/ia/moves.ts`
- `frontend/soluna/soluna-game/src/ia/worker/aiWorker.ts`
- `frontend/soluna/soluna-game/src/ia/index.ts`
- Integración DevTools: `src/components/DevTools/InfoIA/*`

---

## 1. Representación del estado

En Soluna, el `GameState` (ver `src/game/types`) se centra en torres y turnos:

- `towers: Tower[]` con `{ id, stack, height, top, pos }`.
- `currentPlayer: 1 | 2` y `lastMover`.
- `roundOver`, `gameOver`, `players[1|2].stars`.

Consejo: mantener `GameState` inmutable en la búsqueda; las funciones de IA ya retornan nuevos estados con `applyMove()`.

---

## 2. Generación y aplicación de movimientos

- `generateAllMoves(state)` en `src/ia/moves.ts` recorre pares ordenados de torres (`i != j`) y agrega `AIMove { kind: 'merge', sourceId, targetId }` si `canMerge(a, b)` (reglas en `src/game/rules`).
- `applyMove(state, mv)` fusiona torres con `mergeTowers()` y actualiza el turno. Si el siguiente jugador no tiene movimientos (`anyValidMoves`), la ronda termina:
  - Suma estrella al `lastMover`.
  - Marca `roundOver = true`, `gameOver` si llega a 4 estrellas.
  - Avanza `currentPlayer` al rival para que la evaluación terminal sea coherente.

Esta convención se apoya en `evaluate()` para asignar ±∞/2 en terminales (ver sección 3).

---

## 3. Evaluación (Evaluation Function)

Implementación actual en `src/ia/evaluate.ts`:

- Terminal por fin de ronda: si `roundOver` y `lastMover === me` ⇒ `+Infinity/2`; si pierde ⇒ `-Infinity/2`.
- Terminal por ausencia de movimientos: si `anyValidMoves(towers)` es falso, gana el jugador que no está al turno.
- No terminal: heurística simple basada en el número de parejas mergeables (`countMergePairs`).
  - Si es mi turno (`currentPlayer === me`) ⇒ más pares es mejor ⇒ `+pairs`.
  - Si es del rival ⇒ menos pares me favorece ⇒ `-pairs`.

Posibles extensiones de la heurística (lineales y rápidas):

- Bonificar la **altura total** implicada en merges futuros.
- Penalizar **usar como fuente** torres muy altas si reduce opciones.
- Bonificar **centralización** si el tablero lo justifica.
- Incorporar **movilidad** (número de merges válidos) suavemente.

La evaluación debe permanecer O(N^2) como máximo sobre torres y muy barata por nodo.

---

## 4. Minimax con poda alfa–beta y ordenación de movimientos

En `src/ia/search.ts`:

- `alphabeta(state, depth, alpha, beta, me, stats)` implementa minimax con poda alfa–beta.
- `orderMoves(state, moves)` ordena por:
  1) mayor suma de alturas de `sourceId` + `targetId`,
  2) preferencia por fuente más baja para liberar opciones.

Efecto: mejor orden ⇒ más podas β ⇒ menos nodos.

La raíz (`bestMove`) devuelve:

- `move` óptimo, `score`, `pv` (principal variation), y `rootMoves` con el score de cada movimiento raíz.
- Contabiliza `nodes` vía `SearchStats` y en `ia/index.ts` computa `elapsedMs` y `nps`.

Pruebas relevantes: `tests/search.test.ts` valida terminales, determinismo, PV, `rootMoves` y relación profundidad→nodos.

---

## 5. Iterative Deepening + Control por Tiempo

La búsqueda en UI se gestiona en un Worker (`src/ia/worker/aiWorker.ts`):

- Recibe `{ type: 'SEARCH', state, depth: depthMax, timeMs? }`.
- Ejecuta **iterative deepening** de `d=1..depthMax` acumulando `nodes` y publicando `PROGRESS { depth, score, nodes }`.
- Si `timeMs` viene definido, corta cuando se agota el presupuesto.
- Si `timeMs` viene indefinido (modo auto), usa un presupuesto adaptativo según el branching factor de la raíz mediante `computeAdaptiveTimeBudget(state)` en `frontend/soluna/soluna-game/src/ia/time.ts`.
- Devuelve `RESULT { bestMove, score, depthReached, pv, rootMoves, nodes, elapsedMs, nps }`.

`createAIRunner()` (`InfoIA/services/aiRunner.ts`) abstrae el Worker para la UI y soporta cancelación.

---

## 6. Integración con DevTools: InfoIA y medición

En `InfoIAContainer.tsx` y hooks:

- `useSimulationRunner()` ejecuta sets y rondas automatizadas usando `createAIRunner()` o fallback `bestMove()` y registra métricas por movimiento: `elapsedMs`, `depthReached`, `nodes`, `nps`, `score`, `player`, `depthUsed`, `applied`, con sello temporal `at` por jugada y `startedAt` por partida.
- `useRecords()` persiste en `localStorage` (`soluna.infoia.records.v1`), soporta export a JSON/CSV y detalles por jugada (incluye timestamps). No se vacían automáticamente al iniciar nuevas simulaciones: se acumulan, y se puede limpiar manualmente.

Recomendación UI: en la tabla de InfoIA, mostrar siempre `startedAt` (por set/partida) y `at` (por jugada) para auditar el timeline de simulaciones.

---

## 7. Optimizaciones recomendadas (próximos pasos)

Las siguientes técnicas son estándar y compatibles con la base actual:

1) **Transposition Table (TT)** con **Zobrist Hashing**
   - Clave 64-bit por `(torreId, altura/top, turno)` o hash estable por disposición de torres.
   - `TTEntry: { key, depth, value, flag, bestMove }` con política "always replace" o "deeper preferred".
   - Reduce recomputación de subárboles y mejora move ordering con `hash move`.

2) **Move Ordering avanzado**
   - Priorizar `PV move` de iteraciones previas.
   - **Killers** (jugadas que cortaron β) y **History heuristic** (historial de buenas jugadas).

3) **Principal Variation Search (PVS)**
   - Primer hijo con ventana completa, resto con ventana nula `[α, α+1]`, re-buscar solo si mejora α.

4) **Aspiration Windows**
   - Buscar alrededor del score previo para ahorrar nodos; ampliar ventana en fallos bajo/alto.

5) **Quiescence Search** (limitada)
   - Extender en posiciones tácticas (p. ej., merges obvios o forzados) para evitar efecto horizonte.

6) **Control de tiempo robusto**
   - Flag de abort (ya existe) + tolerancia mínima de 50 ms (ya en Worker).
   - Presupuesto adaptativo por número de `rootMoves`.

7) **Profiling y métricas**
   - Registrar `nodes`, `nps`, `depthReached` por iteración.
   - Guardar muestras en `useRecords()` para comparar datasets.

---

## 8. Integración en Frontend (resumen de API)

Envío al Worker y recepción de resultados:

```ts
// Main thread
worker.postMessage({ type: 'SEARCH', state, depth: 5, timeMs: 1500 });
worker.onmessage = (e) => {
  if (e.data.type === 'PROGRESS') { /* depth, score, nodes */ }
  if (e.data.type === 'RESULT') { /* bestMove, pv, rootMoves, nodes, elapsedMs, nps */ }
};
```

La UI (p. ej., `IAPanel.tsx`) muestra evaluación, PV y top jugadas raíz; InfoIA agrega simulación multi-set y export.

---

## 9. Pruebas existentes

- `tests/evaluate.test.ts`: terminales ±∞/2 según `roundOver/lastMover` y sin movimientos; signos según turno en no terminal.
- `tests/search.test.ts`: `bestMove()` en terminal, PV coherente con jugada elegida, `rootMoves` puntuadas, determinismo y crecimiento de `nodes` con profundidad.

Recomendadas: tests de ordenación raíz y de estabilidad de PV entre iteraciones.

---

## ✅ Checklist de Implementación (estado y próximos pasos)

- [X] Generación de movimientos (`generateAllMoves`) y aplicación (`applyMove`).
- [X] Evaluación terminal y heurística de pares (`evaluate`).
- [X] Minimax con alfa–beta y ordenación por alturas (`search`).
- [X] Medición de `nodes`, `elapsedMs`, `nps` y PV en `ia/index.ts` y Worker.
- [X] Iterative deepening + presupuesto de tiempo en Worker.
- [X] Integración InfoIA: simulaciones, progreso, persistencia y export (acumulando resultados entre corridas).
- [X] Transposition Table + Zobrist.
- [X] PVS y Aspiration Windows.
- [X] Killers/History heuristic.
- [X] Quiescence Search (acotada a tácticas claras).
- [X] Presupuesto de tiempo adaptativo por branching factor.

---

## Glosario rápido

- **Minimax (minimax)** — Búsqueda de mejor jugada asumiendo rival óptimo — Evaluación max/min alterna — `alphabeta()`.
- **Poda alfa–beta (alpha–beta pruning)** — Descarta ramas que no pueden mejorar el resultado — Reduce nodos — Condición `alpha >= beta`.
- **Variación principal (principal variation)** — Secuencia de jugadas óptimas — Mostrarla ayuda a depurar — `pv` en resultados.
- **Ordenación de movimientos (move ordering)** — Explorar "mejores" primero — Más cortes β — `orderMoves()`.
- **Iterative deepening (iterative deepening)** — Profundidades crecientes con timebox — `aiWorker.ts`.
- **NPS (nodes per second)** — Nodos/segundo — Métrica de rendimiento — `ia/index.ts` y Worker.
- **Tabla de transposiciones (transposition table)** — Cache por hash de posición — Reutiliza resultados — A implementar.
- **Búsqueda quiescente (quiescence search)** — Extiende en tácticas para evitar horizonte — Implementada (flags `enableQuiescence`, `quiescenceDepth`).


---

## 10. Objetivo: acelerar sin perder exactitud a profundidad fija

Para garantizar que la IA siempre tome la mejor decisi�n al nivel de profundidad configurado, priorizaremos optimizaciones que preservan la exactitud del minimax con poda alfabeta:

- Seguras (exactitud preservada): TT + Zobrist, PV move, Hash move, Killers/History, PVS, Aspiration Windows (con re-b�squeda), Iterative Deepening, Fail-Soft a�.
- Selectivas (optativas, requieren verificaci�n): LMR, Null-Move, Quiescence. Deben activarse con cuidado y re-b�squeda cuando falle la suposici�n.

Implementar primero el bloque seguro y a�adir el selectivo tras pruebas A/B con InfoIA.

---

## 11. Tabla de Transposiciones (TT) + Zobrist Hashing para Soluna

### 11.1. Dise�o de la clave (hash) en Soluna

Retos:

- Las torres tienen `id`, `stack` (altura y `top`) y `pos` flotante; tras `merge` desaparecen 2 y aparece 1 nueva.

Propuesta inicial (exacta y simple, no incremental):

- Firma de torre: `sig(t) = top + '#' + height + '@' + round(pos.x,2) + ',' + round(pos.y,2)`.
- Ordenar todas las firmas y hashearlas a 64 bits (p. ej., mezcla con `Math.imul`) + incluir `currentPlayer`.

Fase 2 (incremental):

- `idMerged = min(srcId,targetId)+'+'+max(...)` para determinismo.
- Hash incremental: `h' = h ^ z(src) ^ z(tgt) ^ z(merged) ^ z(turn)`.

### 11.2. Estructura de TT

- Entrada: `{ key: u64, depth: i8, value: number, flag: 'EXACT'|'LOWER'|'UPPER', best?: AIMove }`.
- �ndice: `idx = key & (size-1)` con `size` potencia de 2.
- Reemplazo: `prefer deeper` o `always replace` con aging simple.

### 11.3. Uso en a� (fail-soft recomendado)

1) Probar TT al entrar al nodo (si `entry.depth >= d`):
   - `EXACT`  devolver `value`.
   - `LOWER`  `alpha = max(alpha, value)`.
   - `UPPER`  `beta  = min(beta, value)`.
   - Si `alpha >= beta`  cutoff.
2) Ordenar hijos priorizando `hash move` y luego heur�sticas.
3) Al salir, almacenar:
   - `UPPER` si `bestScore <= alphaOriginal`.
   - `LOWER` si `bestScore >= betaOriginal`.
   - `EXACT` en el caso intermedio, junto a `bestMove`.

---

## 12. Principal Variation Search (PVS)

- Primer hijo con ventana completa `[a, �]`.
- Resto con ventana nula `[a, a+1]` y re-b�squeda completa solo si `score > a`.
- Exactitud preservada, reduce mucho nodos con buen ordering.

---

## 13. Aspiration Windows

- Con iterative deepening, usar `S` (score previo) y ventana `[S-?, S+?]` (p. ej., `?=25`).
- Si falla bajo/alto, re-buscar con ventana ampliada hasta la completa.
- Exactitud preservada por la re-b�squeda.

---

## 14. Move Ordering avanzado: PV / Hash / Killers / History

Orden recomendado:

1) PV move de la iteraci�n anterior.
2) Hash move de TT.
3) Killers por `ply` (hasta 2 movimientos que causaron corte �).
4) History heuristic por jugador: `history[moveKey] += depth*depth`.
5) Heur�stica est�tica actual (suma de alturas, fuente baja).

Claves Soluna:

- `moveKey` can�nico: `min(sourceId,targetId)+''+max(...)`.
- `killers[ply]`: array fijo de 2 `moveKey`.
- `history`: `Map<string, number>` por jugador.

---

## 15. Fail-Soft a�

- En cortes, devolver el `childScore` que super� el l�mite en vez de a/� duro.
- Mejora `rootMoves`, aspiration y ordering en la siguiente iteraci�n; exactitud intacta.

---

## 16. Paralelizaci�n a nivel ra�z (opcional y exacta)

- Evaluar cada movimiento ra�z en Workers separados, compartiendo un a global por mensajes.
- Cancelar ramas dominadas al mejorar a.
- Cuidados: l�mite de Workers, latencia de mensajer�a y determinismo para InfoIA.

---

## 17. T�cnicas selectivas (activar con salvaguardas)

1) LMR (Late Move Reductions)
   - Reducir profundidad en movimientos tard�os no t�cticos.
   - Si da `fail-high`, re-buscar a profundidad completa.

2) Null-Move Pruning (con cautela)
   - Saltar turno del lado actual para estimar fuerza de la posici�n.
   - Desactivar en finales/zugzwang y limitar reducci�n `R`.

3) Quiescence Search (limitada)
   - Extender en hojas solo si hay merges forzados (cierre de ronda, torre muy alta).
   - Cortar en posiciones tranquilas.

Mantener toggles en DevTools y desactivadas por defecto hasta validar exactitud a profundidad fija.

---

## 18. Micro-optimizaciones

- Reusar arrays/buffers en generaci�n y `orderMoves()` para reducir GC.
- Precomputar alturas por `id` una vez por nodo y compartir en hijos.
- Usar `MATE = 1e9` en vez de `Infinity` para evitar costes num�ricos.
- Short-circuit en terminales antes de ordenar/generar.

---

## 19. Verificaci�n con InfoIA y tests

- Tests de regresi�n: comparar `bestMove()` (jugada y score) entre baseline y versi�n optimizada a misma profundidad sobre un set de posiciones.
- Benchmarks con InfoIA: medir `nodes`, `elapsedMs`, `nps`, `depthReached` por profundidad y feature flag.
- Export CSV/JSON y comparar datasets (ya soportado por `useRecords()` y `useCompareDatasets`).

---

## 20. Roadmap recomendado

1) TT + Zobrist (clave estable no incremental) + Hash move.
2) Killers + History.
3) Fail-Soft a�.
4) PVS.
5) Aspiration Windows.
6) (Opcional) Paralelizaci�n ra�z.
7) (Selectivas, off por defecto) LMR, Null-Move, Quiescence con verificaci�n.

Cada paso con tests y mediciones en InfoIA para confirmar mismo mejor movimiento a igual profundidad y menor tiempo.
