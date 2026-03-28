# Guía de implementación: optimizaciones aplicadas al motor IA de Pylos (frontend)

Este documento describe, a alto nivel, cómo aplicar las optimizaciones propuestas al motor actual de Pylos en el frontend (TypeScript + Web Worker). Incluye roadmap por fases, puntos de integración por archivo/función, especificaciones de estructuras (TT/Zobrist), riesgos, KPIs y plan de pruebas.

Referencias de código (rutas clave):

- Motor de búsqueda: `frontend/pylos/pylos-game/src/ia/search.ts`
- Evaluación: `frontend/pylos/pylos-game/src/ia/evaluate.ts`
- Generación/aplicación de movimientos: `frontend/pylos/pylos-game/src/ia/moves.ts`
- API y Worker: `frontend/pylos/pylos-game/src/ia/index.ts` y `frontend/pylos/pylos-game/src/ia/worker/aiWorker.ts`
- Reglas/estado/tablero: `frontend/pylos/pylos-game/src/game/rules.ts`, `.../board.ts`, `.../types.ts`
- UI (paneles IA): `frontend/pylos/pylos-game/src/components/IAPanel.tsx`, `.../IAUserPanel.tsx`

---

## 1) Objetivos, alcance y arquitectura actual

- Objetivo: reducir tiempo medio de respuesta de la IA y aumentar fuerza de juego, manteniendo UI fluida.
- Arquitectura actual:
  - Búsqueda: Minimax con poda alfa–beta en `search.ts`.
  - Profundidad: iterative deepening y límite de tiempo en `aiWorker.ts` (ya se soporta `timeMs`).
  - Ordenación de movimientos: heurística básica (recuperaciones primero, nivel alto primero, ligera preferencia `lift`).
  - Evaluación: heurística ligera (reservas, altura/centro, piezas libres) en `evaluate.ts`.
  - Worker: canaliza PROGRESS/RESULT, soporta CANCEL; API en `index.ts`.

---

## 2) Roadmap por fases (recomendado)

Fase 1 (alto impacto, bajo riesgo):

- [X] Transposition Table (TT) + Zobrist hashing.
- [X] Move ordering completo: PV move, hash move, killers, history heuristic.
- [X] Aspiration windows.
- [X] Principal Variation Search (PVS).
- [X] Ajustes de `evaluate` con amenazas y tapered eval.

Fase 2 (control del horizonte y tiempos percibidos):

- [X] Quiescence Search para jugadas tácticas (formar cuadrado/línea + recuperaciones), con límites estrictos.
- [X] Libro de aperturas ligero (JSON) y cache en IndexedDB.
- [X] Tablas precalculadas (bitmasks) para supports/cuadrados/centro.

Notas para QA — opciones conmutables en UI (IAPanel → Avanzado)

- Ubicación: `frontend/pylos/pylos-game/src/components/IAPanel.tsx` → panel "Avanzado".
- Persistencia: `localStorage` clave `pylos.ia.advanced.v1` (se guardan valores y defaults).
- Flags de motor (por defecto: activados):
  - PVS (Principal Variation Search) — `pvsEnabled: true`.
  - Ventanas de aspiración — `aspirationEnabled: true`.
  - Transposition Table (TT) — `ttEnabled: true`.
  - Soportes precalculados — `precomputedSupports: true`.
  - Centro precalculado — `precomputedCenter: true`.
- Otras opciones avanzadas visibles:
  - Quiescence on/off y parámetros (`qDepthMax`, `qNodeCap`, `futilityMargin`).
  - Libro de aperturas on/off y `bookUrl`.
- Cableado:
  - UI → `App.tsx` (estado `iaConfig` con persistencia) → `useAI.ts` (`cfg.flags`) → `ia/worker/aiWorker.ts` (`setIAFlags`) → motor (`search.ts`, `moves.ts`, `evaluate.ts`).

Fase 3 (optimizaciones estructurales y exploratorias):

- Bitboards internos y puente con `Board` de UI.
- EGTB (tabla de finales) para posiciones muy reducidas (prototipo).
- Spike WASM para rutas calientes si procede.

---

## 3) Transposition Table (TT) + Zobrist hashing

Objetivo: evitar recomputar subárboles repetidos. Clave (key) de 64 bits con Zobrist; valores almacenados en tabla de tamaño fijo.

Especificación:

- Zobrist hashing (64-bit):
  - Aleatorios por `(jugador, casilla)`, por turno (side to move) y por reservas (L, D) discretizadas; mínimo: turno y ocupación, recomendado: incluir reservas para exactitud.
  - Hash incremental en `applyMove`/`undo` (si hay), o recomputado en `search.ts` al expandir (más simple inicialmente).
- Entrada TT:
  - `key: u64`, `depth: i16`, `value: i32`, `flag: UPPER/LOWER/EXACT`, `bestMove: MoveSignature`, `age/opcional`.
  - Política de reemplazo: `replace deeper` o `always replace`.
- Implementación TS:
  - Evitar `Map` para reducir GC. Usar `TypedArrays` (p. ej., dos `Uint32Array` para `keyHi/keyLo`), `Int16Array` para `depth`, `Int32Array` para `value`, `Uint8Array` para `flag`, y un buffer para `bestMove` serializado (ver “MoveSignature”).
  - Tamaño: empezar con 2^18 entradas (≈262k). Estimar 24–32 bytes/entrada → ~6–8 MB.
- Integración en `search.ts`:
  - En `alphabeta(...)` leer TT antes de generar hijos:
    - Si hay coincidencia y `storedDepth >= depth` usar `value/flag` para poda inmediata.
    - Promover `hash move` al frente del orden.
  - Al cerrar nodo, escribir en TT con `flag` adecuado.

MoveSignature (serialización ligera de jugada):

- Para `place`: `kind=0, destIndex, recMask`.
- Para `lift`: `kind=1, srcIndex, destIndex, recMask`.
- `*Index` mapea `Position{level,row,col}` a `[0..(4x4+3x3+2x2+1x1)-1]=30`.
- `recMask` codifica hasta 2 recuperaciones (p. ej., bitmask sobre 31 posiciones usables como libres en niveles 0..2).

Pruebas mínimas:

- Hash invariantes: misma posición → mismo hash; movimiento + undo → hash original (si implementamos undo para pruebas). Cambios de reservas/turno alteran hash.
- A/B con TT on/off: nodos y tiempo por profundidad.

Riesgos/mitigación:

- Colisiones: raras pero posibles. `key` + `depth` + `flag` suelen bastar; validar que `bestMove` no corrompe búsqueda (solo sugerencia, no obligación).
- Memoria: empezar pequeño y medir; permitir reconfigurar tamaño.

---

## 4) Move ordering: PV, hash move, killers, history

Objetivo: reducir nodos explorados adelantando cortes β.

Cambios en `search.ts`:

- PV move: conservar la PV de la iteración anterior en el root (`aiWorker.ts` ya itera d=1..D). Priorizarla primero en la siguiente iteración.
- Hash move: si TT trae `bestMove`, colocarlo primero tras PV.
- Killers: mantener por `ply` dos movimientos que causaron corte β en nodos no capturantes/tácticos. Estructura `killers[ply][2]` con reemplazo FIFO simple.
- History heuristic: tabla global que incrementa una puntuación por `MoveSignature` cuando mejora α. Usar la puntuación como criterio de orden secundario.
- Orden final recomendado: `PV → hash → killers → history → heurísticas estáticas (nivel alto/centro/recuperaciones)`.

Pruebas mínimas:

- A/B con/sin cada heurística; verificar que PV estable reduce reordenamientos.

---

## 5) Aspiration windows

Objetivo: reducir nodos cuando la evaluación fluctúa poco entre iteraciones.

Integración:

- En `aiWorker.ts` (bucle de deepening) mantener `lastScore`. Para profundidad `d`, llamar a búsqueda con ventana `[lastScore - Δ, lastScore + Δ]` (p. ej. `Δ=50`).
- Si hay `fail-low` o `fail-high`, relanzar esa iteración con ventana completa `[-INF, +INF]`.

Parámetros sugeridos:

- `Δ` inicial 50..100 (ajustar por escala de `evaluate`).

---

## 6) Principal Variation Search (PVS)

Objetivo: acelerar después del primer hijo en cada nodo.

Integración en `search.ts`:

- En cada nodo, buscar el primer hijo con `[α, β]` normal. Para el resto, usar null-window `[α, α+1]`. Si supera α, re-buscar con ventana completa.
- Combinar con ordering anterior; es crítico que PV/hash vayan primero.

Pruebas mínimas:

- Comparar nodos vs. alfa–beta clásico manteniendo el mismo orden de movimientos; deben bajar.

---

## 7) Quiescence Search (limitada a tácticas de Pylos)

Objetivo: evitar el “horizonte” en hojas donde una jugada que puntúa (cuadrado/línea) o recuperaciones inmediatas distorsionan la evaluación.

Diseño:

- En `depth=0`, en lugar de evaluar directamente:
  - Generar solo jugadas “tácticas”: que formen un nuevo cuadrado/línea y/o impliquen recuperaciones.
  - Limitar el branching de recuperaciones (reutilizar límite actual: `free.slice(0,4)`), y/o aplicar `qDepth` pequeño (1..2) y cap de nodos.
  - Si no hay tácticas, evaluar (quiescent position).

Integración:

- Añadir `quiescence(state, α, β, me, stats, opts)` y llamarla cuando `depth === 0`.

Riesgos/mitigación:

- Explosión de combinaciones por recuperaciones: imponer caps (máximo de expansiones tácticas por hoja) y futility pruning estático (descartar si `staticEval + margin < α`).

---

## 8) Evaluación (evaluate.ts): amenazas y tapered eval

Objetivo: aumentar calidad de la evaluación manteniendo coste lineal.

Cambios:

- Amenazas de cuadrado/línea: contar 3/4 en ventanas posibles (niveles 0 y 1) para cada jugador y ponderar.
- Tapered eval: interpolar pesos según fase (p. ej., basada en bolas colocadas o altura media). Ej.: más peso a reservas en apertura, más a altura/centro en medio/final.
- Mantener el cálculo con iteraciones sobre `positions()` y acceso O(1) a `getCell`.

Pruebas:

- Tests unitarios de términos y signos; regresión en posiciones canónicas (igualadas, ventaja clara, coronación, sin movimientos).

---

## 9) Tablas precalculadas (bitmasks) y bitboards (opcional)

Objetivo: acelerar consultas repetitivas.

Tablas precalculadas (fase 2):

- `supports[i]`: qué celdas soportan la celda `i`.
- Ventanas de cuadrado/línea por nivel para recorrer menos celdas.
- Máscara de “centro” por nivel.

Bitboards (fase 3):

- Representar ocupación de cada jugador en dos máscaras (p. ej., `BigInt` o dos `Uint32`), manteniendo conversión desde/ hacia `Board` solo en la frontera del motor.
- Beneficio: operaciones bitwise sumamente rápidas; coste: reimplementar generador y detectores.

---

## 10) Libro de aperturas + IndexedDB

Objetivo: jugadas instantáneas en primeras plies y consistencia estratégica.

Diseño:

- JSON `book.json`: `{ version, entries: Array<{ keyHi, keyLo, bestMove: MoveSignature }> }`.
- Carga asíncrona al iniciar; consulta antes de buscar en `index.ts` o al comienzo de `aiWorker.ts` para responder inmediato.
- Cache en IndexedDB con versión para evitar fetch repetido.

Generación (offline):

- Auto-juego con límites de tiempo moderados para consolidar primeras 6–10 jugadas; o curación manual.

---

## 11) EGTB (tabla de finales) — investigación

Objetivo: resultados exactos en finales muy reducidos.

Alcance inicial:

- Estudiar tamaño del espacio con ≤ N bolas totales y reglas de soporte/recuperación.
- Prototipo para N pequeño, empaquetar en binario y cargar bajo demanda; medir impacto en peso de la app.

Riesgos:

- Complejidad de retrograde analysis para Pylos y tamaño de binarios para web.

---

## 12) Integración con UI/Worker y control de tiempo

- El Worker ya soporta `timeMs` indefinido para “Auto” (no interrumpe) y valor numérico para “Manual”. Mantener esta semántica.
- Configuración de tiempo: centralizar en `IAPanel` (DevTools) y establecer 8s manual como valor por defecto cuando no existan preferencias guardadas. `IAUserPanel` debe actuar de forma compacta (si se deja la segmentación), pero la fuente de la verdad del tiempo es `IAPanel`.
- Streaming de progreso: `aiWorker.ts` ya emite `PROGRESS (depth, score, nodes)`. Mantenerlo para mostrar PV parcial y KPIs.
- Cancelación: `CANCEL` con flag local ya funciona; opcionalmente explorar `SharedArrayBuffer + Atomics` sólo si el entorno (COOP/COEP) lo permite.

---

## 13) KPIs, métricas y baseline

Medir antes y después (A/B) en 5 posiciones tipo:

- Nodos totales por profundidad (1..6) y por tiempo fijo (5s/8s/10s).
- NPS (nodos/segundo) reportado por Worker.
- Estabilidad de PV entre iteraciones (número de cambios en la primera jugada).
- Memoria TT (MB) y tasa de aciertos TT (% hits/reads).
- Responsividad UI (objetivo 60 FPS; sin jank durante búsqueda).

Puntos de instrumentación:

- `aiWorker.ts`: acumular `nodes`, `elapsedMs`, `nps`; exponer `ttReads`, `ttHits` si se implementa TT.
- `IAPanel.tsx`: mostrar KPIs y tiempo transcurrido frente al límite (∞ en Auto).

---

## 14) Plan de pruebas

Unitarias:

- Zobrist: invariantes de hash y sensibilidad a reservas/turno.
- TT: política de reemplazo (deeper/always), flags UPPER/LOWER/EXACT, recuperación de `bestMove`.
- Evaluate: términos individuales, signos, posiciones canónicas.
- Move ordering: actualización de killers/history y que no duplique entradas.

Integración:

- Búsqueda con PVS+Aspiration: comparar con alfa–beta clásico en small depth para exactitud.
- Quiescence: verificar que sólo expande tácticas y respeta caps; validar que no rompe legalidad de recuperaciones.
- Libro: si hay entrada, la IA responde inmediato con la jugada esperada.

Rendimiento/Regresión:

- Scripts de benchmark en 5 posiciones: tiempo, nodos, NPS, TT hit-rate.
- Validar que la UI sigue fluida con Worker ocupado.

---

## 15) Riesgos y mitigaciones

- Explosión por recuperaciones en quiescence → caps estrictos y futility pruning.
- Corrupción por TT (colisiones/estado incompleto) → incluir turno y reservas; tratar `bestMove` como sugerencia.
- Memoria TT en navegador → empezar con 2^17..2^18 entradas; medir y ajustar.
- Compatibilidad Atomics → fallback a cancelación por mensaje cuando COOP/COEP no esté disponible.

---

## 16) Definition of Done (DoD)

- Fase 1 integrada: TT+Zobrist, ordering completo, Aspiration, PVS, ajustes en evaluate.
- Métricas mejoran: nodos ↓ ≥30% en d=4..6 y/o NPS ↑; respuesta percibida ≤8s con mejor jugada parcial visible.
- Tests unitarios/integración en verde; sin regresiones funcionales.
- UI mantiene 60 FPS; panel de IA muestra KPIs y PV.

---

## 17) Glosario (términos clave)

- Transposition Table (TT) — Caché por posición con profundidad/valor/bound — Reduce recomputación — Ej.: consulta antes de expandir hijos.
- Zobrist hashing — Hash incremental 64-bit del tablero — Indexa la TT — Ej.: XOR al colocar/quitar pieza y al cambiar turno.
- Move ordering — Ordenar jugadas prometedoras primero — Acelera podas — Ej.: PV→hash→killers→history→estáticas.
- Killer move — Jugada que causó corte β en un `ply` — Se promueve en esa profundidad — Ej.: `killers[ply][0..1]`.
- History heuristic — Puntuación global por jugada que mejora α — Sirve de orden secundario — Ej.: `history[moveSig] += bonus`.
- Quiescence search — Extiende hojas con tácticas — Evita horizonte — Ej.: sólo jugadas que forman cuadrado/línea y recuperaciones limitadas.
- Aspiration window — Ventana estrecha alrededor del score previo — Rebuscar si falla — Ej.: `[last-Δ, last+Δ]`.
- PVS (Principal Variation Search) — Ventana normal para 1er hijo; null-window para el resto — Rebuscar si sube α.
- Bitboard — Máscara de bits por ocupación — O(1) en detecciones — Ej.: AND/OR de patrones precalculados.
- EGTB — Tabla de finales precomputada — Respuestas exactas — Ej.: activar bajo umbral de bolas.

---

## 18) Siguientes pasos

1. Implementar TT + Zobrist y move ordering completo.
2. Añadir Aspiration y PVS.
3. Afinar `evaluate` y medir.
4. Introducir quiescence con límites y volver a medir.
5. Integrar libro de aperturas + IndexedDB.
6. Valorar bitboards/EGTB/WASM según ROI medido.

