# Squadro IA – Roadmap de Acciones Recomendadas (IAPowa → Imbatible)

Este documento guía la evolución de IAPowa hacia un motor “casi perfecto” en Squadro. Cada acción indica su estado y criterios de aceptación. Al finalizar cada paso, se marcará con [Completado].

## Leyenda de estado

- [Pendiente] = aún no iniciado
- [En curso] = trabajo activo
- [Completado] = implementado y verificado

## Objetivo

Alcanzar máxima fuerza práctica y perfect play en subespacios (finales), manteniendo robustez, determinismo bajo demanda, y una UX coherente con `IAPanel`/`InfoIA` (aplicar cambios inmediatamente y persistir en `localStorage`).

## Flujo de trabajo

- Implementación incremental por acciones atómicas y testeables.
- Cada acción incluye: alcance (archivos), entregables, y criterios de aceptación.
- Al completar, marcar el título con [Completado] y enlazar PR/commit.

---

## 1) Auditoría de reglas y generación de movimientos — [En curso]

- Archivos: `src/game/rules.ts`, `src/ia/moves.ts`, `tests/*.ts`.
- Entregables:
  - Suite de tests que cubra multi-saltos, cambios ida/vuelta, retiradas, velocidades extremas y empates raros.
  - Verificación de paridad con reglas oficiales (posiciones oráculo en `tests/board.test.ts`).
- Criterios de aceptación:
  - 100% de casos de borde críticos aprobados.
  - Sin discrepancias entre `generateMoves()` y el oráculo.

## 2) Hashing (Zobrist) robusto — [Completado]

- Archivos: `src/ia/hash.ts`, `src/ia/tt.ts`, puntos de integración en `alphabeta.ts`.
- Entregables:
  - Hash 64-bit (o par de 32-bit) incluyendo: side-to-move, estado de pieza, `lane.length`, `lane.speedOut`, `lane.speedBack`.
  - API para hashing incremental (opcional) en `applyMove()`.
- Criterios de aceptación:
  - Colisiones no observables en test suite extendida.
  - Sin regresiones de rendimiento perceptibles.

Progreso:
- Migración a Zobrist 64-bit (BigInt) incluyendo parámetros de carril (`length`, `speedOut`, `speedBack`) y turno. [Completado]
- Integración con TT (`src/ia/tt.ts`) usando claves `bigint`. [Completado]
- Nota: la política de reemplazo 2-cluster está planificada en la Acción 3.

## 3) Transposition Table 2-cluster + aging — [Completado]

- Archivos: `src/ia/tt.ts`.
- Entregables:
  - Buckets de tamaño fijo con 2 entradas, política de reemplazo por profundidad/generación.
  - Guardado de `bestMove`, `bound`, `depth`, y puntuaciones mate con distancia a ply.
- Criterios de aceptación:
  - Reducción de nodos (cutoffs) ≥ 10% en suite de posiciones fija.
  - Estabilidad de memoria en navegador (sin GC spikes apreciables).

Progreso:
- TT con buckets de 2 entradas por cubeta (2-cluster) y máscara de potencia de 2. [Completado]
- Política de reemplazo: profundidad primero; empate por generación (aging). [Completado]
- API estable (`get`, `set`, `clear`, `tickGeneration`) sin cambios en el buscador. [Completado]

## 4) IID (Internal Iterative Deepening) para hash move — [Completado]

- Archivos: `src/ia/search/alphabeta.ts`.
- Entregables:
  - Cuando no haya hash move, búsqueda a `depth-1` con ventana estrecha para sembrar ordenación.
- Criterios de aceptación:
  - Aumento de cutoffs beta en nodos interiores medido (stats).

Progreso:
- IID activado en `src/ia/search/alphabeta.ts`: cuando no hay `hashMove` y `depth>=iidMinDepth`, se hace probe a `depth-1` con ventana estrecha para sembrar ordenación. [Completado]
- Opciones por defecto en `src/ia/search.ts`: `enableIID=true`, `iidMinDepth=3`. [Completado]

## 5) Pruning: Late Move Pruning (LMP) y Futility — [Completado]

- Archivos: `src/ia/search/alphabeta.ts`, `src/ia/moves.ts` (helpers tácticos/SEE ligero).
- Entregables:
  - LMP: podar jugadas muy tardías no tácticas a profundidad suficiente.
  - Futility (d ≤ 2..3): si `eval + margen < alpha` y la jugada no es táctica, podar.
- Criterios de aceptación:
  - Igualdad de jugadas vs baseline en posiciones tácticas; mejora de NPS o profundidad efectiva.

Progreso:
- Futility (node-level) implementado en `src/ia/search/alphabeta.ts` con margen conservador y chequeo de tácticos. [Completado]
- LMP implementado en `src/ia/search/alphabeta.ts` (salta jugadas muy tardías no tácticas a poca profundidad). [Completado]
- Defaults activados en `src/ia/search.ts` (`enableFutility`, `futilityMargin`, `enableLMP`, `lmpMaxDepth`, `lmpBase`). [Completado]

## 6) LMR dinámico (reducción por historia/índice/profundidad) — [Completado]

- Archivos: `src/ia/search/alphabeta.ts`.
- Entregables:
  - Fórmula de reducción basada en `i` (índice de jugada), profundidad y señal de historia.
  - Re-búsqueda a profundidad completa en fail-high.
- Criterios de aceptación:
  - Reducción de re-búsquedas innecesarias manteniendo fuerza en táctica fina.

Progreso:
- LMR evita jugadas tácticas y PV; reducción dinámica = base + bonus por índice − crédito por `history`. [Completado]
- Re-búsqueda a ventana completa cuando hay fail-high (ya soportado en flujo). [Completado]

## 7) Quiescence estable con márgenes y SEE-guard — [Completado]

- Archivos: `src/ia/search/quiescence.ts`, `src/ia/moves.ts`.
- Entregables:
  - Stand-pat margins dependientes de fase.
  - Extensión para “retiro” y “salto” inmediatos.
  - Filtro con SEE ligero para expandir solo tácticos “prometedores”.
- Criterios de aceptación:
  - Disminución de “horizon effect” en posiciones con choques recurrentes.

Progreso:
- `src/ia/search/quiescence.ts`: stand-pat con margen, filtro SEE-like por `delta >= seeMargin`, y extensiones opcionales en “retirar”/“salto” sin consumir `qDepth`. [Completado]
- Defaults en `src/ia/search.ts`: `enableQuiescence=true`, `quiescenceMaxPlies=4`, `quiescenceStandPatMargin=0`, `quiescenceSeeMargin=0`, `quiescenceExtendOnRetire/Jump=true`. [Completado]

## 8) Ordenación de movimientos (PV carry-over + SEE) — [Completado]

- Archivos: `src/ia/search/alphabeta.ts`, `src/ia/moves.ts`.
- Entregables:
  - Mantener PV move de la iteración previa en raíz.
  - Añadir SEE aproximado en `orderMoves()` para priorizar jugadas seguras.
- Criterios de aceptación:
  - Incremento consistente de cutoffs beta y depthReached a tiempo fijo.

Progreso:
- PV carry-over para raíz implementado en `src/ia/search/alphabeta.ts` (se usa `pvHintMove` para sembrar ordenación). [Completado]
- SEE ligero para priorizar jugadas seguras y penalizar saltos inmediatos del rival, implementado en `src/ia/moves.ts` (funciones `orderMoves()`, `countOpponentImmediateJumps()`). [Completado]

## 9) Determinismo y reproducibilidad — [Completado]

- Archivos: `src/ia/presets.ts`, puntos que usan aleatoriedad.
- Entregables:
  - `orderingJitterEps = 0`, `randomOpeningPlies = 0` en modo prueba.
  - Semilla controlada si se usa RNG.
- Criterios de aceptación:
  - Misma PV y jugada a igualdad de estado/tiempo.

Progreso:
- `orderingJitterEps=0` por defecto en `src/ia/search.ts` y en presets, evitando ruido en ordenación; `orderMoves()` sólo usa `Math.random()` si jitter>0. [Completado]
- `randomOpeningPlies=0` por defecto en presets; `gameSlice` aplica y gestiona `openingPliesUsed` para reproducibilidad. [Completado]
- `InfoIA`/`IAPanel` persisten inmediatamente selección/ediciones en `localStorage` (`IA_PRESETS_KEY`/`IA_SELECTED_KEY`). [Completado]

## 10) Gestión de tiempo por fase — [Completado]

- Archivos: `src/App.tsx`, `src/ia/search/alphabeta.ts`, `src/ia/search.ts`, `src/ia/search/types.ts`.
- Entregables:
  - Ajustar `enableAdaptiveTime` con estimación de branching y seguridad de deadline.
  - Reparto de tiempo por fase (apertura/medio/final) y “picos” en táctica crítica.
- Criterios de aceptación:
  - Menos interrupciones por timeout y mejor depthReached promedio.

Progreso:
- `src/App.tsx`: `computeTime(gs)` asigna presupuesto por fase (apertura/medio/final) con ajuste por dificultad y branching de raíz; usado tanto en mono‑hilo como en workers. [Completado]
- `src/ia/search.ts`: tuning adaptativo por fase (`adaptiveGrowthFactor`, `adaptiveBFWeight`, `timeSlackMs`) según retiradas totales. [Completado]
- `src/ia/search/alphabeta.ts`: heurística adaptativa usa branching de raíz para estimar coste de la próxima iteración. [Completado]
- `src/ia/search/types.ts`: nuevos campos para control adaptativo. [Completado]

## 11) Finales: DF-PN (Proof-Number Search) — [Completado]

- Archivos: `src/ia/search/dfpn/dfpn.ts` (nuevo), integración en `src/ia/search.ts` (trigger antes de iterativa), UI en `InfoIA` e `IAPanel`.
- Entregables:
  - Activación cuando piezas activas ≤ K (`dfpnMaxActive`).
  - Probe inicial: detección de win a 1 ply y jugada “segura” básica.
  - Toggles: `DF‑PN` y `dfpnActive` en InfoIA (por jugador) e IAPanel (global).
- Criterios de aceptación:
  - Resolver finales pequeños triviales sin romper la suite. Casos añadidos: `Endgame_DFPN_Smoke1/2` en `src/tests/positions.json`.

## 12) Tablebases/Bitbases reducidas — [Completado]

- Archivos: `src/ia/tablebase.ts` (consulta in‑mem), integración fast‑path en `src/ia/search.ts`, suite y UI.
- Entregables:
  - `probe()/add()/clear()/load()` con llave Zobrist (`hashState(gs)`).
  - Fast‑path: si `enableTablebase` y hay hit, devolver al instante con `bestMove`/`score`.
  - Toggles: `Tablebase` en InfoIA (por jugador) e IAPanel (global).
  - Suite: casos `TB_Win_Immediate` y `TB_Draw_Immediate` precargan entradas por caso.
- Criterios de aceptación:
  - Acierto inmediato en posiciones incluidas y fallback limpio cuando no aplique. Suite en verde (incluyendo TB y DF‑PN).

## 13) Evaluación: exactitud de “turnos restantes” y choques — [Completado]

- Archivos: `src/ia/evaluate.ts`.
- Entregables:
  - Cálculo de turnos por aterrizajes reales (según velocidad) en ida/vuelta.
  - Swing de choques con simulación ligera (1–2 plies) usando utilidades de IA.
- Criterios de aceptación:
  - Suite de regresión en verde y métricas coherentes (PV/score) en InfoIA.

## 14) Paralelismo raíz con alpha/PV compartidos — [Completado]

- Archivos: `src/App.tsx` (orquestador), `src/ia/aiWorker.ts` (mensajería), `src/ia/search/alphabeta.ts` (aplicar hints), `src/ia/search/types.ts`.
- Entregables:
  - Compartir mejor PV (`pv_update`) y alpha (`alpha_update`) entre workers (sin comprometer exactitud).
  - Explorar `SharedArrayBuffer` (futuro, opcional) para compartir TT.
- Criterios de aceptación:
  - Mayor depthReached a tiempo fijo y estabilidad de PV entre workers.

## 15) Preset “IAPowa-Proof” + UX consistente — [Completado]

- Archivos: `src/ia/presets.ts`, `src/components/DevTools/IAPanel/*`, `src/components/DevTools/InfoIA/*`, `src/store/gameSlice.ts`.
- Entregables:
  - Nuevo preset determinista y máximo (TT+PVS+LMR+Quiescence+Aspiration, sin jitter/aleatoriedad).
  - Aplicación inmediata desde `IAPanel`/`InfoIA` y persistencia en `localStorage`.
- Criterios de aceptación:
  - Cambios en `IAPanel`/`InfoIA` se reflejan al instante en runtime y quedan guardados.

Progreso:
- `src/ia/presets.ts`: agregado preset `iapowa_proof` y ampliado esquema (LMP, Futility, IID, Quiescence margins/extensiones); migración garantiza presencia del preset por defecto. [Completado]
- `src/components/DevTools/IAPanel/components/Presets/PresetsTab.tsx`: ediciones de campos aplican inmediatamente vía `applyIAPreset`, marcan preset como aplicado y emiten evento `squadro:presets:update`. [Completado]
- `src/components/DevTools/InfoIA/InfoIAContainer.tsx`: aplicar preset por jugador actualiza profundidad/tiempo, toggles de motor, LMR, LMP, Futility, IID y Quiescence (márgenes/extensiones), persiste `IA_SELECTED_KEY` y emite `squadro:presets:update`. [Completado]
- `src/store/gameSlice.ts`: `applyIAPreset` aplica todos los nuevos campos del motor al estado `ai`. [Completado]

## 16) Telemetría y regresión — [Completado]

- Archivos: `src/ia/search.ts`, `src/ia/search/alphabeta.ts`, `src/store/gameSlice.ts`, `src/App.tsx`, `src/tests/positions.json`, `src/tests/runSuite.ts`, `src/components/DevTools/InfoIA/*`.
- Entregables:
  - Registro de `SearchStats` (nodes, cutoffs, pvs/asp re-searches) y PV por iter.
  - Suite de posiciones fijas para no perder fuerza entre commits.
- Criterios de aceptación:
  - Reportes reproducibles y CI con umbrales de no-regresión.

Progreso:
- `src/ia/search/alphabeta.ts`: emite PV por iteración reconstruido desde TT (`pv` en evento `iter`). [Completado]
- `src/ia/search.ts`: el evento `iter` ahora incluye `pv` y se propaga a la UI. [Completado]
- `src/store/gameSlice.ts`: `aiSearchIter` guarda `pv` en `state.ai.pv`. [Completado]
- `src/App.tsx`: rutas mono‑hilo y workers reenvían `pv` a Redux en cada iteración. [Completado]
- `src/tests/positions.json`: primeros casos mínimos de regresión. [Completado]
- `src/tests/runSuite.ts`: ejecutor que aplica movimientos, invoca `findBestMove()` y verifica expectativas. [Completado]
- `src/components/DevTools/InfoIA/InfoIAView.tsx`: botón "Run Regression Suite" y render de resultados. [Completado]
- `src/components/DevTools/InfoIA/InfoIAContainer.tsx`: handler `handleRunSuite()` con import dinámico del runner. [Completado]

Resultado:
- Reportes reproducibles (PV por iter, stats) y suite básica ejecutable desde InfoIA. Se pueden añadir más posiciones para aumentar cobertura.

---

### Notas de diseño

- Mantener separación clara de responsabilidades: búsqueda, ordenación, evaluación, TT y hash.
- Poda “segura” y re-búsquedas cuando una heurística pueda ser demasiado optimista.
- Determinismo activable para comparar fuerza y depurar.

