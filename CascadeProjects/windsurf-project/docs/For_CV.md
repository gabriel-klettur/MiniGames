# MiniGames — Resumen técnico (Pylos, Quoridor, Soluna, Squadro)

Este documento resume, a nivel técnico y de producto, cuatro juegos implementados en React/TypeScript, con foco en reglas, arquitectura, IA, UX/DevTools y persistencia. Incluye glosario y argumentos de defensa para CV y entrevistas.

## Stack y patrones comunes

- **Frontend**: React + TypeScript.
- **Estado**: Context/Reducer (Soluna, Pylos) y Redux Toolkit (Quoridor, Squadro).
- **IA**: Búsqueda con Alpha–Beta e iterativa, heurísticas (TT, PVS, Killers, History, LMR, Aspiration, Quiescence), a veces con Web Workers.
- **UX/DevTools**: Paneles de usuario IA, DevTools de análisis, métricas (nodos, NPS, PV, profundidad alcanzada), historial de movimientos.
- **Persistencia**: Ajustes y presets en localStorage cuando aplica.

---

## Pylos

- **Qué es**: Juego abstracto por turnos (apilar y retirar esferas). Implementación con animaciones y soporte Vs IA.
- **Reglas (alto nivel)**: Colocar esferas respetando niveles, formar cuadrados para subir o retirar, condición de victoria al completar la cúspide.
- **Arquitectura**:
  - `src/App.tsx`: orquestación principal (toggles de paneles, inicio Vs IA, game over).
  - Hooks dedicados: `hooks/usePersistence` (estado/movidas/ajustes IA), `hooks/useAI` (ciclo IA + métricas), `hooks/useHistory*` (undo/redo), `hooks/app/*` (capas de UI/UX, layout, winner, highlights, etc.).
  - Vista: `components/GameView`, `components/FlyingPiece` para animaciones, `components/HistoryPanel`, `components/DevTools/*`.
- **IA**:
  - Profundidad configurable (`iaDepth`) y modos de tiempo (`iaTimeMode`, `iaTimeSeconds`).
  - Panel de usuario IA y panel de desarrollo con KPIs: evaluación, PV, profundidad alcanzada, nodos, NPS, root moves, progreso.
  - Configuración avanzada persistida: `useIaAdvancedConfig`.
- **UX/DevTools**:
  - Paneles: Reglas, Fases, UX, IAPanel, InfoIA. Animaciones de piezas “voladoras”.
  - Undo/Redo con colas y bloqueo seguro durante animaciones o IA.
  - **Persistencia**:
  - Partidas finalizadas, movimientos y buena parte de los ajustes IA (tiempo/paneles) en localStorage.

### IA — Detalle técnico

- **Algoritmo**: Minimax con poda **alpha-beta** (profundo) con variantes:
  - **PVS (Principal Variation Search)** para re-búsquedas de ventana completa tras ventana nula.
  - **Iterative deepening** en el worker (`aiWorker.ts`) con ventanas de **aspiración** alrededor del score previo.
  - **TT (Transposition Table)** con flags EXACT/LOWER/UPPER y mejor jugada (`bestMove`).
  - **Killers/History heuristics** para priorizar cortes alfa.
  - **Quiescence search** limitada a jugadas tácticas (con recuperaciones), con margin de futility y cap de hijos por nodo.
  - Detección de ciclos y sesgo a tablas (**draw bias**), penalización de repeticiones (`avoidKeys/avoidList`), y bonus de novedad.
  - Soporte de “opening book” opcional (`probeBook`).
- **Ordenación de jugadas**: PV, hash, killers, history y heurísticas estáticas (más recuperaciones, niveles altos, ligera preferencia por lift).
- **Heurística**: Evaluación determinista con tapering por fase (apertura→final):
  - Material (reservas), altura/posición (pondera niveles), preferencia por centro (precomputado u on-the-fly),
    amenazas (cuadrados/líneas casi completos) y piezas libres recuperables.
  - No es auto-aprendida; pesos fijos “hand-tuned” con interpolación según piezas en tablero.
- **Paralelización y tiempo**: Búsqueda en Web Worker dedicado, con límite por tiempo (`shouldStop`) o profundidad, NPS y progreso por iteración.

Referencias: `src/App.tsx`, `src/hooks/usePersistence.ts`, `src/hooks/useAI.ts`, `src/components/DevTools/*`.

---

## Quoridor

- **Qué es**: Juego abstracto de laberintos con peones y muros. Gana quien alcanza su fila objetivo.
- **Reglas (implementación)**:
  - Cálculo de movimientos legales del peón y detección de meta (`game/rules.ts`).
  - Colocación de muros con validaciones y representación en tablero.
- **Arquitectura**:
  - Estado global con Redux Toolkit: `store/uiSlice.ts`, `store/gameSlice.ts`.
  - Vista principal en `src/App.tsx` con `Board`, `InfoPanel`, `DevToolsPanel`, `RulesPanel`, `IA/*`.
- **IA**:
  - Panel de IA con control por lado (L/D), profundidad por lado, presets de estilo (equilibrado/agresivo/defensivo), estrategias de apertura.
  - Acciones y métricas: petición de jugada IA, KPIs, top jugadas raíz, trazas.
- **UX/DevTools**:
  - Detección de puntero “coarse” (móvil/tablet) e input mode (mover/colocar muro).
  - Ajustes de “hitboxes” de muros, previsualización y parámetros visuales.
  - Paneles de Reglas, Fases, Historial, UX y IA (desarrollador).
  - **Persistencia**: UI/Dev toggles y parte de configuración IA.
  Referencias: `src/App.tsx`, `src/hooks/useAiController.ts`, `src/components/DevTools/IAPanel/*`, `src/ia/search/*`.

---

## Soluna

- **Qué es**: Juego por rondas entre dos jugadores; integra IA configurable y métricas avanzadas.
- **Reglas (alto nivel)**: Soporta “nueva ronda” y reinicio de partida; `state.roundOver` y `state.gameOver` gobiernan la interacción.
- **Arquitectura**:
  - Store propio vía Context/Reducer: `game/store` y `useGame()`.
  - Controlador de IA en `hooks/useAiController.ts`: centraliza worker pool, tiempo adaptativo y presets.
  - DevTools: `components/DevTools/IAPanel` (pestañas Control, Análisis, Presets), `UIUX`, `InfoIA`, Historial.
- **IA**:
  - Profundidad por defecto 10 y control por jugador (P1/P2).
  - Presets “IAPowa” (básico, rendimiento, defensa) + presets personalizados persistentes.
  - Flags de motor con edición granular: TT, Killers, History, PVS, Aspiration (delta), Quiescence (profundidad y umbrales), etc.
  - Tiempo: modo automático con presupuesto adaptable (min/max/base/perMove/exp) y modo manual por segundos.
  - Métricas: eval, PV, profundidad alcanzada, Nodos, NPS, tiempo, root moves, progreso.
  - Web Workers: pool configurable (`ia/worker/pool`).
- **UX/DevTools**:
  - Exclusividad de paneles (IAPanel > InfoIA > UX) para evitar solapes en móvil.
  - IAUserPanel con autoplay y control por jugador.
  - **Persistencia**:
  - Presets y opciones de motor por jugador (P1/P2) en localStorage.

### IA — Detalle técnico

- **Algoritmo**: Minimax con poda **alpha-beta** (ver `search/alphabeta.ts`).
  - **Fail‑soft** (actualiza límites con puntajes reales).
  - **TT** global (`GlobalTT`) con mejor jugada para seed de ordenación y bounds (EXACT/LOWER/UPPER).
  - **PVS** para jugadas no‑PV; **LMR** en jugadas tardías no tácticas/killers.
  - **Killers/History** para priorizar cortes y mejorar ordenación.
  - **Quiescence** activada por defecto (profundidad 3) para estabilizar hojas.
  - **Aspiración** opcional (off por defecto) con re‑búsqueda a ventana completa si falla.
  - Por defecto no hay **iterative deepening**; la profundidad se fija vía UI (`depth`).
  - Heurísticas de poda agresivas (Futility/LMP/Null‑move) desactivadas por defecto; disponibles en presets de rendimiento.
- **Ordenación de jugadas**: `moveOrdering.ts` prioriza hash move, killers e historial por jugador.
- **Heurística** (`ia/evaluate.ts`):
  - Terminales fuertes (fin de ronda y “sin movimientos”).
  - Señal principal: número de pares mergeables; positivo si es mi turno (más opciones), negativo si es del rival.
  - No es auto‑aprendida; evaluación determinista y barata para mantener la UI fluida.
- **Paralelización y tiempo**: `useAiController` puede usar pool de Web Workers y controla tiempo
  - Modo manual (segundos por jugada) y modo automático (min/max/base/perMove/exp) con métricas (nodos, NPS, PV, profundidad alcanzada).

  Referencias: `src/App.tsx`, `src/hooks/useAiController.ts`, `src/components/DevTools/IAPanel/*`, `src/ia/search/*`.

---

## Squadro

- **Qué es**: Juego de carreras y “choques” en cuadrícula con 5 piezas por lado; gana quien retira 4 piezas.
- **Reglas (implementación)** — `game/rules.ts`:
  - Avance por carriles con velocidades distintas ida/vuelta.
  - Saltos sobre bloques contiguos de oponentes, enviándolos al borde correspondiente.
  - Giro en el borde lejano y retirada en el borde de salida; victoria al retirar 4.
- **Arquitectura**:
  - Redux Toolkit para estado del juego y IA (`src/store`).
  - Motor IA con búsqueda iterativa y opciones extensas (`ia/search`, `ia/moves`).
  - Paralelización: Web Workers opcionales con reparto de trabajo por raíz o por 2º ply; cancelación limpia y métricas de progreso.
- **IA**:
  - Dificultad 1..20 (escala tiempo y agresividad), control de lado, autoplay, apertura aleatoria (plies iniciales).
  - Tiempo: modo manual (segundos) o automático con presupuesto por fase (apertura/medio/final) y ajuste por branching factor.
  - Engine flags: TT, PVS, History, Killers, LMR, LMP, Futility, IID, Quiescence, preferencia de hash move, jitter de ordenación.
  - Métricas: profundidad por iteración, score, PV, nodos, NPS, duración, stats del motor.
  - Presets IA con persistencia (`ia/presets.ts`).
- **UX/DevTools**: Paneles IA/Dev, InfoPanel, IAUserPanel, FootPanel. Board responsivo.
- **Persistencia**: Ajustes IA (incl. presets y tiempo) y algunos toggles en localStorage.

### IA — Detalle técnico

- **Algoritmo**: **Negamax con poda alpha-beta** + **iterative deepening** con ventanas de **aspiración** por iteración.
  - **TT** por iteración (EXACT/LOWER/UPPER) con mejor jugada y reconstrucción de PV.
  - **PVS** en no-PV; **LMR** dinámicas (reducción función de índice/historial); **LMP** en profundidad baja para no tácticas; **Futility** a nivel de nodo.
  - **Quiescence** opcional; **IID** (internal iterative deepening) cuando falta hash move y profundidad lo permite.
  - Sonda de final de partida **DFPN** mínima para finales triviales con pocas piezas activas.
- **Ordenación de jugadas**: preferencia por PV/hash/killers/history y jitter estocástico opcional para desempates.
- **Heurística**: Combinación lineal de 12 señales (`evaluate.ts`): carrera (top‑4), piezas retiradas, choque inmediato, cadena, sprint/bloqueo, paridad, estructura, ones, retorno, waste, movilidad.
  - Pesos por defecto (`EVAL_PARAMS`) y posibilidad de overrides por jugador vía `gs.ai.evalWeights`/presets (no auto‑aprendida).
- **Paralelización y tiempo**: Paralelización por raíz/segundo ply con pool de workers; control de tiempo manual o adaptativo por fase/dificultad y branching.

Referencias: `src/App.tsx`, `src/game/rules.ts`, `src/ia/search/*`, `src/ia/workers/*`, `src/store/*`.

---

## Comparativa rápida

- **Estado**
  - Pylos: hooks + estado local con persistencia.
  - Quoridor/Squadro: Redux Toolkit.
  - Soluna: Context/Reducer propio.
- **IA**
  - Todos: Alpha–Beta iterativo con heurísticas (TT/Killers/History/PVS/LMR/etc.).
  - Soluna/Squadro: Worker pool/parallel; presupuesto de tiempo adaptable.
  - Quoridor: per‑lado con presets y aperturas; foco en UX de muros.
  - Pylos: panel avanzado con métricas completas y animaciones integradas.
- **Persistencia**
  - Soluna y Squadro: presets/ajustes IA en localStorage.
  - Pylos: partidas/movidas y configuración avanzada.
  - Quoridor: UI/IA parciales.
- **UX/DevTools**
  - Todos con IAUserPanel y DevTools.
  - Quoridor añade soporte móvil (pointer coarse) e input modes.
  - Pylos destaca por animaciones y undo/redo robusto.

---

## Glosario (términos clave)

- **Alpha–Beta pruning** — poda de ramas que no pueden mejorar la evaluación — acelera la búsqueda — ej.: descartar movimientos peores que una cota.
- **Iterative deepening (IDDFS)** — búsqueda por profundidades crecientes — permite mejores cortes y tiempo flexible — ej.: d=1..N hasta agotar presupuesto.
- **Transposition Table (TT)** — caché de estados evaluados — reutiliza scores/bounds — ej.: clave Zobrist → score, depth, flag.
- **Principal Variation (PV)** — secuencia de mejores jugadas — guía la ordenación — ej.: mostrar PV en panel IA.
- **PVS (Principal Variation Search)** — variante de alpha–beta con ventanas nulas — reduce re‑búsquedas — ej.: buscar PV a ventana completa, resto a nula.
- **Killer/History heuristics** — priorizan movimientos que causaron cortes — mejor ordenación — ej.: killers por profundidad; history global.
- **LMR (Late Move Reductions)** — reduce profundidad para movimientos tardíos — ahorra tiempo — ej.: reducir >= 1 ply a partir del 3º movimiento.
- **Quiescence search** — extiende en posiciones “tácticas” — evita horizonte — ej.: seguir capturas/choques en Squadro.
- **Aspiration windows** — busca alrededor de un score esperado — menos nodos — ej.: ventana [s−Δ, s+Δ].
- **NPS (Nodes per second)** — rendimiento del motor — diagnóstico — ej.: mostrar NPS en métricas.

---

## Cómo defender estos proyectos (CV/entrevista)

- **Objetivo y criterios**: juegos de tablero con IA configurable, métricas y DevTools. Deben correr en navegador, soportar móvil y persistir ajustes clave.
- **Diseño**: separación de preocupaciones (reglas, IA, UI); tipado estricto; hooks/Redux; paneles IA plug‑and‑play; workers donde aporta.
- **Rendimiento**: alpha–beta + heurísticas avanzadas; ordenación eficaz; quiescence selectiva; workers y reparto por raíz/ply; presupuestos de tiempo adaptativos.
- **Memoria**: TT dimensionada por juego; serialización ligera en localStorage para presets/ajustes.
- **Extensibilidad**: presets IA editables; flags de motor; componentes desacoplados (Board/Info/DevTools) y slices/hook por dominio.
- **Riesgos**: UI móvil (hitboxes/input modes), bloqueo por IA (mitigado con cancelaciones/workers), coherencia de historial (undo/redo protegido), fuga de workers (reset en cleanup).
- **Siguientes pasos**: tests de reglas/IA, perfiles de rendimiento por juego, límites de memoria TT, mejorar accesibilidad y telemetría.

