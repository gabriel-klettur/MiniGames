

Aquí tienes 10 mejoras concretas y aplicables para que la IA no se atasque en IA vs IA, con dónde tocar en el código y por qué ayudan. Mantengo el foco en evitar ciclos, preservar fuerza de juego y mantener reproducibilidad.

1) Diversificación adaptativa en la raíz (epsilon-greedy adaptativa)
- Qué: ya activamos epsilon-greedy; hazla adaptativa a la “presión de repetición”: aumenta ε y/o el umbral de casi-empate (tieDelta) cuando crecen los hits de repetición.
- Dónde tocar: [src/ia/search/search.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/ia/search/search.ts:0:0-0:0) en la rama de `opts.diversify === 'epsilon'`; y en [useInfoIASim.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/components/DevTools/InfoIA/hooks/useInfoIASim.ts:0:0-0:0) ajusta `epsilon/tieDelta` en función de `repeatHits`.
- Métrica: menos partidas con `endedReason='repetition-limit'` sin bajar tasa de victoria de referencia.

2) Penalización por repetición escalada por conteo
- Qué: en vez de `avoidPenalty` fijo, escalar con el conteo local de repeticiones del hash (p. ej., base + k·(c - threshold)), o duplicar si es la repetición inmediata (2-ciclo).
- Dónde tocar: [search.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/ia/search/search.ts:0:0-0:0) donde aplicamos `avoidPenalty` al `childScore`. Necesitarás pasar los conteos (no solo las claves) desde [useInfoIASim.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/components/DevTools/InfoIA/hooks/useInfoIASim.ts:0:0-0:0) al worker (extender `avoidKeys` → `avoidMap: {key -> weight}`).
- Métrica: reducción de c==threshold en detalles de jugadas.

3) Bonus de novedad (novelty bonus) en la raíz
- Qué: añade un pequeño “novelty bonus” a estados no vistos en la partida; simétrico a la penalización de repetición. Sirve para empujar fuera del subgrafo ya explorado.
- Dónde: [search.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/ia/search/search.ts:0:0-0:0), junto a la penalización por repetición; [useInfoIASim.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/components/DevTools/InfoIA/hooks/useInfoIASim.ts:0:0-0:0) mantiene un `seen` por partida y lo pasa como `noveltyKeys`.
- Métrica: mayor diversidad de claves Zobrist en `perMove`.

4) Multi-PV ligero (Top-K líneas raíz)
- Qué: calcula y conserva explícitamente las K mejores PVs en la raíz y elige entre ellas con epsilon-greedy. Ya recogemos `candidates` con PV; basta con limitar a K y muestrear solo ahí.
- Dónde: [search.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/ia/search/search.ts:0:0-0:0) en la sección de acumulación de `candidates`.
- Métrica: cuando hay empate real, ver cambio de rutas sin loops.

5) Gestión de tiempo sensible al riesgo
- Qué: aumenta el tiempo por jugada cuando detectas riesgo de repetición para dar margen de encontrar el “escape” (p. ej., +50% si `avoidKeys.length>0`, +100% si `repeatHits≥2`).
- Dónde: [useInfoIASim.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/components/DevTools/InfoIA/hooks/useInfoIASim.ts:0:0-0:0) justo antes de llamar a [getBestMove](cci:1://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/components/DevTools/InfoIA/services/aiRunner.ts:36:0-45:1): calcula `timeMsBoosted`.
- Trade-off: consume más tiempo por jugada; úsalo en IA vs IA y mantén límites superiores.

6) Regla de “no-progreso” en simulación
- Qué: además de `repeatMax`, corta la simulación si no hay “progreso” (formación de líneas/cuadrados) en N plies y marca `endedReason='no-progress'`.
- Dónde: [useInfoIASim.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/components/DevTools/InfoIA/hooks/useInfoIASim.ts:0:0-0:0) cuenta plies sin evento (ya tienes `perMove` y puedes detectar cambios desde reglas); corta con resumen.
- Métrica: partidas largas sin progreso se detienen de forma controlada.

7) Jitter sembrado en ordenación raíz bajo repetición
- Qué: añade un ruido muy pequeño, seedable, a las puntuaciones de ordenación solo cuando hay `avoidKeys`. Diferente de epsilon-greedy porque actúa ANTES de la búsqueda, modificando el orden.
- Dónde: [search.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/ia/search/search.ts:0:0-0:0) en [orderMoves(...)](cci:1://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/ia/search/search.ts:99:0-132:1) o inmediatamente tras ordenar `ordered` cuando `avoidSet.size>0`.
- Métrica: misma configuración + misma semilla ⇒ mismas partidas; distinta semilla ⇒ exploraciones alternativas sin loops.

8) LMR (Late Move Reductions) sensible a repetición
- Qué: si `avoidSet.size>0`, reduce menos a los movimientos que “escapan” (no repetitivos) y reduce más a los repetitivos; protege el ancho útil de búsqueda cuando hay riesgo.
- Dónde: [search.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/ia/search/search.ts:0:0-0:0) en la política de reducciones (si la tienes); si no, añade un ajuste simple al depth de hijos según pertenencia a `avoidSet`.
- Métrica: más “escapes” descubiertos dentro del mismo presupuesto.

9) Persistencia de anti-bucles entre partidas
- Qué: guarda en localStorage los Zobrist en los que se terminó por `repetition-limit` con una “penalización” que decae con el tiempo. Carga al inicio como `avoidKeys` con peso bajo.
- Dónde: persistencia en [Controls.tsx](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/components/DevTools/InfoIA/views/Controls.tsx:0:0-0:0)/`utils/`; carga inicial en [useInfoIASim.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/components/DevTools/InfoIA/hooks/useInfoIASim.ts:0:0-0:0) y forwarding al worker.
- Riesgo: sesga el juego si la memoria crece sin control; usar decaimiento y límites.

10) Ajustes de evaluación para marcar “ciclos = malos”
- Qué: si detectas repetición del hash dentro de la misma PV (o TT), devuelve un score de “tablas” ligeramente peor que 0 para el bando al turno. Así, el motor evita preferirlo una y otra vez.
- Dónde: `src/ia/evaluate.ts` o mejor en [search.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/ia/search/search.ts:0:0-0:0) al ver repetición (sin tocar la heurística estática de valores); y/o marca en `TT` entradas de “rep-draw”.
- Métrica: menos retorno a las mismas tablas locales.

Notas de implementación rápidas
- Repetición y pesos:
  - Hoy pasamos `avoidKeys` como array. Para escalado por conteo, define `avoidList: Array<{hi,lo,weight}>` y propaga por [aiWorker.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/ia/worker/aiWorker.ts:0:0-0:0) → [search.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/ia/search/search.ts:0:0-0:0).
  - En [search.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/ia/search/search.ts:0:0-0:0), calcula `childScore = res.score - weight`.
- Epsilon adaptativo:
  - En [useInfoIASim.ts](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/components/DevTools/InfoIA/hooks/useInfoIASim.ts:0:0-0:0), calcula `epsilon = clamp(0.1 + 0.05*(repeatHits), 0, 0.4)` y sube `tieDelta` de 20 a 30 si `repeatHits ≥ 2`.
- Tiempo sensible al riesgo:
  - `const budget = timeMs.current; const boost = repetitionRisk ? 1.5 : 1; timeMs: Math.min(budget * boost, maxCapMs)`.

Medir el impacto
- KPIs:
  - Porcentaje de partidas terminadas por `repetition-limit` o `no-progress`.
  - Media de profundidad alcanzada en jugadas bajo riesgo.
  - Tasa de tablas vs baseline y tasa de victoria cruzada (L vs D).
  - Distribución de claves Zobrist únicas por partida.
- Herramientas: ya tienes `perMove`, `repeatHits`, `maxWorkersUsed`; añade contadores de “escapes” y “tiempo aumentado”.

Glosario rápido
- Epsilon-greedy (epsilon-greedy) — Con probabilidad ε elige una alternativa entre opciones casi empatadas — Úsalo para romper ciclos con bajo coste — Ej.: ε=0.15.
- Tie window (tieDelta) — Umbral de empate por debajo del cual las opciones se consideran equivalentes — Evita elegir opciones claramente peores — Ej.: 20.
- Novelty bonus (bonus de novedad) — Pequeña bonificación a posiciones no vistas — Fomenta explorar fuera del subgrafo repetido — Ej.: +5.
- LMR (Late Move Reductions) — Reducir profundidad en jugadas tardías — Mantiene ancho sin explotar de más — Ajusta reducciones bajo repetición.
- Quiescence search — Extiende en posiciones “ruidosas” para evitar horizonte táctico — Mantiene estabilidad de evaluación.
- Aspiration windows — Ventanas [α,β] estrechas usando el score previo — Acelera convergencia; re-busca si falla.
- Zobrist key — Hash único del estado — Detecta repetición — Se usa para TT y métricas de repetición.
- Transposition Table (TT) — Caché de posiciones evaluadas — Reutiliza scores y podas.
- No-progress rule — Finaliza si no hay eventos/mejoras en N plies — Corta partidas estériles.
