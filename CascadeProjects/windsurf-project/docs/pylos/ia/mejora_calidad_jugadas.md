

# Respuesta corta
- **¿Es posible que el 7 “siempre” gane al 3?** 100% no, salvo que elimines el azar, uses libros fuertes y/o solvador de finales. Sí es posible acercarlo mucho (90–99%+) si reduces varianza y refuerzas táctica.
- Tu telemetría muestra que el 3 gana encadenando “dobles recuperaciones” y agotando reservas del 7. Hay que hacer que el 7 evite/neutralice esas tácticas y eliminar ruido en raíz y aperturas.

# 10 modificaciones para que el 7 gane consistentemente al 3

- **[1) Apertura determinista (opening book)]**
  - En `computeBestMoveAsync(cfg.start/book)` pon `startRandomFirstMove=false`, `bookEnabled=true` para L (nivel 7) y deja `bookEnabled=false` para D (nivel 3).
  - Efecto: L evita líneas malas tempranas y reduce varianza de apertura.

- **[2) Cero aleatoriedad en raíz (root randomness off)]**
  - Para L: `rootTopK=1`, `rootJitter=false`, `epsilon=0`, `tieDelta=0`.
  - Para D: mantén `rootTopK=3`, `rootJitter=true`, `epsilon=0.1`.
  - Efecto: L elige sistemáticamente el mejor movimiento; D mantiene ruido.

- **[3) Gestión de tiempo asimétrica]**
  - L (7): `timeMode='manual'` con más segundos o “boost” adaptativo cuando está peor o cuando `recoveredThisMove` del rival fue 2.
  - D (3): `auto` o menos tiempo.
  - Efecto: L asegura profundidad útil en posiciones críticas.

- **[4) Eval refuerzos anti-Pylos (heurística)]**
  - Sube peso de: diferencia de reservas, “potencial de cuadrado propio”, “evitar cuadrado rival próximo”, movilidad y “altura/soporte”.
  - Penaliza jugadas que entregan dobles recuperaciones al rival.
  - Efecto: la búsqueda prefiere secuencias que no regalan combos.

- **[5) Extensiones tácticas y quiescence]**
  - Extiende profundidad al detectar: formar cuadrado, elevar a nivel superior, o amenaza inminente de cuadrado rival.
  - Quiescence en estas tácticas para estabilizar la evaluación.
  - Efecto: el 7 ve más profundo justo en los momentos que deciden reservas.

- **[6) LMR (Late Move Reductions) conservador para 7]**
  - L: reduce menos en nodos tácticos o desactiva LMR cerca de recuperaciones.
  - D: LMR agresivo (más reducciones).
  - Efecto: el 7 no “corta” táctica clave; el 3 sí.

- **[7) Ordenación de movimientos (move ordering) favoreciendo táctica]**
  - Prioriza para L: movimientos que crean/cuadrados, elevaciones, bloqueos de amenazas de cuadrado rival, killers/historia.
  - D: ordenación más simple.
  - Efecto: el 7 llega antes a PVs tácticos buenos.

- **[8) Tablas de transposición (TT) y límites]**
  - L: TT más grande y con menor envejecimiento; D: TT más pequeña.
  - Opcional: “probCut/aspiration” más agresivos para D.
  - Efecto: al 7 le rinde más la exploración y reuso.

- **[9) Manejo de repetición y anti-loop sesgado]**
  - Para D: `drawBias` más alto (castiga tablas) y `avoidList` con pesos fuertes si repite.
  - Para L: `drawBias` bajo o 0, y diversificación “off”.
  - Efecto: D evita tablas “cómodas” y entra en líneas explotables.

- **[10) Controles asimétricos y preset “Benchmark sin ruido”]**
  - En [Controls.tsx](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/components/DevTools/InfoIA/views/Controls/Controls.tsx:0:0-0:0) separa ajustes por jugador (L/D) para: book, start, rootTopK/jitter/epsilon/tieDelta, LMR, tiempo.
  - Añade preset “Benchmark sin ruido”: `startRandomFirstMove=false`, `book toggle`, `rootTopK=1`, `jitter=false`, `epsilon=0`, `tieDelta=0`, semillas fijas.
  - Efecto: pruebas deterministas donde 7 domina y diagnósticos reproducibles.

# Qué cambiar en tu código (mapa rápido)

- **`InfoIA Controls` ([src/components/DevTools/InfoIA/views/Controls/Controls.tsx](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/components/DevTools/InfoIA/views/Controls/Controls.tsx:0:0-0:0))**
  - Añadir preset “Benchmark sin ruido”.
  - Exponer toggles por jugador: `bookEnabled`, `startRandomFirstMove`, `rootTopK`, `rootJitter`, `epsilon`, `tieDelta`, `rootLMR`, `timeMode/timeSeconds`.
- **`ia` (motor)**:
  - Heurística: subir pesos de reservas/cuadrado/amenazas/elevaciones.
  - Búsqueda: extensiones en cuadrado/elevación/amenaza, quiescence táctico.
  - LMR: tuning condicional (menos en táctica).
  - TT: tamaños diferentes por nivel.

# Por qué el 3 te gana más a veces (según tu JSON)
- Varias entradas con `recoveredThisMove: 2` para D y subidas de `score` grandes correlacionan con victorias del 3.
- El 7, aunque con `depthTarget=7`, puede alcanzar menos en finales/árboles estrechos y elegir líneas que “regalan” dobles al rival por evaluación o por reducciones agresivas.
- Apertura aleatoria (`startRandomFirstMove=true`) y ruido en raíz (`rootTopK=3`, `jitter=true`) añaden varianza contra el propio 7.


# Glosario breve

- **Opening book (libro de aperturas)** — Base de jugadas iniciales óptimas — Reducir varianza en apertura — Ej.: `bookEnabled=true`.
- **Root Top-K** — Candidatos en la raíz — Aumentarlo añade diversidad — Ej.: `rootTopK=1` para juego “serio”.
- **Jitter** — Ruido probabilístico en la elección — Rompe ciclos, añade varianza — Ej.: `rootJitter=false` para 7.
- **LMR (Late Move Reductions)** — Menos profundidad en jugadas tardías — Acelera, puede cegar táctica — Ej.: desactivar en cuadrado.
- **Quiescence** — Búsqueda extra en tácticas — Estabiliza evaluación — Ej.: extender si hay cuadrado/recuperación.
- **Transposition Table (TT)** — Caché de posiciones — Reusa evaluaciones — Ej.: TT mayor para 7.
