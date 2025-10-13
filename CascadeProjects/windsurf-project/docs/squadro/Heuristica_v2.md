¡Vamos a por una IA “de torneo” para **Squadro**! Te traigo, en castellano, lo que hoy se sabe en la web (reglas clave, complejidad real del juego, trabajos previos, datasets) y, a partir de ahí, un **plan técnico completo** con heurísticas específicas, parámetros iniciales y dos rutas de implementación: 100% perfecta (si usas una base de estados resuelta) o “near‑perfect” con búsqueda tipo minimax/α‑β o MCTS.

---

## 1) Reglas y dinámicas que importan para la IA (resumen verificable)

* Ganas si **4 de tus 5 piezas** cruzan el tablero y vuelven a casa. En tu turno mueves **una** pieza exactamente **tantas casillas como indican los puntos grabados** en su base actual; cuando llega al borde, **se da la vuelta** y, desde entonces, su velocidad pasa a ser la indicada en el borde opuesto. Si cruzas una o varias piezas rivales en el trayecto, **saltas y paras justo detrás**, y cada rival cruzado **vuelve** a su base de salida (si aún no había girado) o a su casilla de giro (si ya había hecho la ida). Estas reglas son oficiales de Gigamic. 
* Las velocidades posibles de las bases son **1, 2 o 3**, y en el camino de vuelta **se invierten** (p. ej., si salías a 3, vuelves a 1). ([Zatu Games][1])

---

## 2) Complejidad real del juego y estado del arte público

* **Complejidad del árbol de juego (cota inferior)**: factor de ramificación medio ≈ **4,50** y longitud media de partida ≈ **129,6**; la cota resultante es ≈ **4,52×10⁸⁴** nodos. Esto descarta un brute‑force ingenuo y obliga a usar poda/TT/ordenación de jugadas. ([Adrï][2])
* **Número de estados alcanzables** (espacio de estados): ~**46 199 129 613**. Un trabajo reciente afirma haber **resuelto** el juego por enumeración retrograda, indicando además:

  * El **jugador “izquierda”** (en su convención de coordenadas) **puede forzar la victoria desde la posición inicial, incluso jugando segundo**.
  * ~**0,05 %** de estados son **tablas (bucles infinitos)**.
    Estos datos encajan con las estimaciones de complejidad previas. ([GitHub][3])
* Con **aprendizaje por refuerzo estilo AlphaZero**, se ha reportado **rendimiento superhumano** en Squadro con MCTS+red residual entrenada en autojuego, destacando:

  * Existencia de **bucles infinitos** en posiciones reales.
  * Métrica simple de “**distancia Manhattan en acciones**” (nº de jugadas para terminar ignorando interacción) como señal útil de ventaja de carrera.
  * Sensibilidad del **parámetro de exploración** en MCTS (valores altos ayudan a MCTS puro; con red, mejor valores típicos). ([cyril-marechal.net][4])

> Nota de terminología: por “resuelto” entendemos solución fuerte (clasificación de todas las posiciones) vs. solución débil (solo desde el inicio). Ver definiciones estándar. ([Wikipedia][5])

---

## 3) ¿Se puede construir una IA **imbatible**?

* **Sí**, si incorporas una **base de estados resuelta** (lookup perfecto) o reproduces un análisis retrogrado completo; en ese caso, la IA **elige siempre un movimiento ganador** (o tablas si va a perder). La literatura pública indica que con la orientación usada en el solver el lado “izquierda” **gana forzado** desde el setup inicial; si juegas como el lado “arriba”, el mejor resultado contra juego perfecto rival no es “imbatible”, sino **maximizar tablas o la resistencia**. ([GitHub][3])
* **Sin** esa base perfecta, una IA con **α‑β + heurística específica + tablas de transposición + ordenación de jugadas + detección de ciclos** o bien **MCTS** con buena política/evaluación **alcanza nivel muy alto**, y puede ser prácticamente imbatible para humanos. ([cyril-marechal.net][4])

---

## 4) Ruta A — Motor **perfecto** (con base resuelta)

**Idea**: integrar los ficheros/estructura de datos del solver para consultar, por cada estado, su categoría (Gana/Empata/Pierde) y **elegir**:

1. un movimiento **ganador** si existe;
2. si no, un movimiento de **tablas** (para evitar la derrota);
3. en última instancia, un perdedor “lo más largo posible”.

**Puntos técnicos:**

* **Representación** de estado compacta: para cada una de las 10 piezas, (línea, progreso 0..6, sentido ida/vuelta). Hash **Zobrist** por pieza×posición×sentido para TT.
* **Normalización** por simetrías (solo cuando no cambie la semántica de velocidades; ojo, el tablero no es simétrico rotacionalmente en velocidades).
* **Detección de ciclos**: un simple “seen‑at‑this‑ply” + reglas de preferencia (si tu mejor horizonte es perder, **prefiere ciclo**). El solver cifra los estados de tablas en ≈0,05 %. ([GitHub][3])
* **Orientación**: si puedes elegir bando, **elige “izquierda”** (en la convención del solver) para forzar victoria desde el inicio. ([GitHub][3])

---

## 5) Ruta B — Motor de **búsqueda** (minimax/α‑β o MCTS) sin base perfecta

### 5.1 Arquitectura recomendada (α‑β)

* **Búsqueda**: minimax con **α‑β**, **iterative deepening**, **TT** (reemplazo por profundidad), **killer moves**, **history heuristic**, **move ordering** agresivo.
* **Quiescence** en posiciones “tácticas” (si hay capturas disponibles o amenazas a 1‑ply), para evitar “horizonte barato”.
* **Orden de jugadas** (muy importante en Squadro):

  1. acabar una pieza (mueve a casa), 2) capturas que **manden atrás 2+** rivales, 3) capturas simples, 4) avances “seguros” que **amenacen** captura al siguiente turno, 5) “waste moves” al borde para **controlar el ritmo**, 6) resto.
* **Detección de ciclos**: almacena firma de estado por (hash, lado al turno, profundidad) y corta con valoración **de tablas** cuando reaparece en la misma rama; si tu línea principal es perdedora, **prefiere tablas**. La existencia de bucles está documentada. ([cyril-marechal.net][4])

### 5.2 Arquitectura recomendada (MCTS)

* **UCT** con constante de exploración en el rango típico (p. ej. entorno de **√2 ≈ 1,41** para MCTS clásico; afina empíricamente). ([chessprogramming.org][6])
* Con **red** tipo AlphaZero (política+valor), usa **PUCT** y los hiperparámetros estándar como punto de partida; el caso de estudio en Squadro detalla cómo ajustar c/exploración según si hay red o no. ([cyril-marechal.net][4])

---

## 6) Heurísticas **específicas de Squadro** (lo que debe “ver” tu evaluación)

> En cursiva: por qué tiene sentido; **entre corchetes**: cómo medirlo.

1. **Ventaja de carrera** (“distancia en acciones” para completar 4 piezas). *Es la señal más robusta.* [Para cada lado, simula **sin interacciones** y suma las **mejores 4** piezas en “nº de turnos” para llegar a casa; evalúa la diferencia.] ([cyril-marechal.net][4])
2. **Prioridad en cruces críticos (paridad)**. *Quién llega antes a un cruce donde se bloquearán.* [Cuenta cruces donde tú llegas en ≤ k turnos y el rival en ≥ k+1.]
3. **Captura inmediata** y **cadena de capturas**. *Cuanto más atrás devuelves, mejor y además avanzas +1 al saltar.* [Nº de rivales que devuelves con cada jugada; valora más si devuelves piezas que aún no han girado.] 
4. **Seguridad de los “1”** (piezas lentas en la **vuelta rápida** del rival). *Los “1” son oro; perderlos cuesta muchos tempos.* [Cuenta “1” propios **no capturables** al 1‑ply y “1” rivales vulnerables.] ([es.doc.boardgamearena.com][7])
5. **Control vs. carrera**. *BGA resume que se gana por “control” (bloqueo) o por “carrera”.* [Ten dos modos de peso: si vas por delante en carrera, privilegia terminar; si vas por detrás, prioriza control/bloqueo.] ([es.doc.boardgamearena.com][7])
6. **Amenazas a 1‑ply**. *Movimientos que dejan captura inevitable si el rival progresa.* [Cuenta casillas de llegada que crean “forks” de captura.]
7. **Movimientos de “ritmo” (waste moves) en bordes**. *Parar en el borde aunque te sobre paso te da control de tempo.* [Detecta si puedes “gastar” turno sin conceder captura.] 
8. **Movilidad segura**. *Cuántas opciones no malas tienes vs. el rival (evitar zugzwang).* [Diferencia de nº de jugadas **no perdedoras** a 1‑2 plies.]
9. **Valor de estar en retorno**. *Una pieza ya girada es menos castigada al ser capturada (solo vuelve al giro).* [Bonifica piezas propias en retorno y penaliza rivales que aún no han girado.] 
10. **Bloqueos estructurales**. *Formaciones que “cierran” varias líneas rivales.* [Cuenta líneas rivales cuya mejor jugada se vuelve perdedora por tu ocupación.]
11. **Finalizadas**. *Cada pieza terminada reduce grados de libertad del rival.* [Bonifica el conteo diferencial de piezas ya fuera del tablero.] 
12. **Riesgo de ciclo**. *Si vas peor, persigue líneas de repetición (tablas); si vas mejor, evítalas.* [Marca estados repetidos y eleva o deprime su valoración según el resto de la evaluación.] ([GitHub][3])

### Pesos iniciales sugeridos (para una evaluación lineal “tempos‑centrada”)

> No hay un estándar público de “valores correctos” para Squadro; estos **pesos de arranque** están pensados para que la **carrera** domine y el resto module (afínalos con autojuego/TC). Las unidades son “puntos de evaluación”; 100 ≈ 1 tempo de ventaja.

| Término                                                  |            Peso inicial |
| -------------------------------------------------------- | ----------------------: |
| Ventaja de carrera (∆ en jugadas para cerrar 4)          |      **+100** por tempo |
| Finalizadas (diferencia)                                 |      **+200** por pieza |
| Captura inmediata                                        |     **+50** por captura |
| Cadena (capturas adicionales en una jugada)              | **+15** por pieza extra |
| Seguridad de “1” propios / vulnerabilidad de “1” rivales |       **+30** / **‑30** |
| Prioridad en cruces (por cruce ganado)                   |                 **+12** |
| Movilidad segura (∆)                                     |                  **+6** |
| Ritmo (waste move disponible sin riesgo)                 |                  **+8** |
| Valor retorno (propio / rival sin girar)                 |         **+5** / **‑5** |
| Bloqueos estructurales (líneas rival “sofocadas”)        |                 **+10** |

> **Cómo afinar**: autojuego (self‑play) con búsqueda limitada para etiquetar movimientos “mejores/peores” y **ajustar pesos** por regresión logística o **CMA‑ES**; o usa **MCTS** como “juez” para generar etiquetas y entrena una red de valor/política compacta (estilo AlphaZero en pequeño). La literatura de Squadro con AlphaZero describe con detalle cómo **tunean parámetros** y cómo la métrica de “acciones hasta ganar” correlaciona con ventaja. ([cyril-marechal.net][4])

---

## 7) Parámetros prácticos (búsqueda)

* **α‑β + TT**: clave la **ordenación** (acabados > capturas > amenazas > ritmo > resto). TT de cientos de MB si es posible; hashing Zobrist.
* **MCTS (UCT/PUCT)**: empieza con **c≈√2** para UCT clásico y **ajústalo** empíricamente (la bibliografía indica que valores ~0,9–1,8 suelen ser robustos; el caso Squadro con red reporta que valores “típicos” funcionan mejor que explorar demasiado). ([SpringerLink][8])

---

## 8) Heurísticas “de apertura” directamente aplicables (útiles para ordenación)

* **No aceleres las piezas rápidas** si no ganas paridad: “*ritmo lento*”. ([es.doc.boardgamearena.com][7])
* **Cuida tus “1” y caza los del rival**: son los pivotes de control. ([es.doc.boardgamearena.com][7])
* **Que te capturen no siempre es malo** (te avanza +1 y reordena el tempo): evita la “*zugzwang delusion*”. ([es.doc.boardgamearena.com][7])
* Alterna entre plan de **carrera** y de **bloqueo** según indique tu evaluación de ventaja de carrera. ([es.doc.boardgamearena.com][7])

---

## 9) Datos abiertos y recursos útiles

* **Reglamento oficial multilingüe (PDF)** de Gigamic. Úsalo como fuente de verdad de reglas. 
* **Análisis del tablero/dataset de partidas de BGA en Kaggle** (útil para aprender pesos/abrir libro). ([kaggle.com][9])
* **Página técnica con complejidad y herramientas** (incluye cálculo de branching y longitud media). ([Adrï][2])
* **Solver “Squadro‑solver” (Rust)** con cifras de estados y resultado teórico (ganador por orientación, tablas). Perfecto como **oráculo** si quieres una IA perfecta. ([GitHub][3])
* **AlphaSquadro (blog)**: implementación tipo AlphaZero para Squadro; describe hiperparámetros, retos (bucles), y métricas de valor. ([cyril-marechal.net][4])
* **Consejos de estrategia en BGA** (resumen de patrones útiles). ([es.doc.boardgamearena.com][7])

---

## 10) Blueprint de implementación (paso a paso)

1. **Modelo de estado**: (10 piezas) × (línea 0..4, índice 0..6, sentido). Precalcula las 25 posiciones de cruce y los “checkpoints” (bases de velocidad).
2. **Generador de movimientos**:

   * Determina **velocidad actual** por posición de la pieza (puntos grabados de la base en la que se encuentra).
   * Avanza paso a paso detectando **cruces** con piezas rivales; si se cruza, **salta y devuelve**; si llega a borde, **para y gira** (aunque sobren pasos). 
3. **Motor**: α‑β con iterative deepening, TT, ordenación descrita, quiescence en tácticas.
4. **Evaluación**: aplica la lista de **12 heurísticas** y los **pesos iniciales**; añade detección de **terminales**, repetición/ciclo y **preferencias** (ganar > tablas > perder lento).
5. (Opcional) **MCTS** / PUCT con red pequeña (p. ej., 6–10 bloques residuales; canales maestros que codifiquen progreso/velocidad). Hiperparámetros de exploración según guías UCT y el caso Squadro. ([chessprogramming.org][6])
6. **Ruta perfecta**: si incluyes la **tabla del solver**, consulta primero; si hay jugada ganadora en la tabla, **juega esa**; si no, cae al motor de búsqueda con heurística que priorice tablas cuando toque. ([GitHub][3])

---

### Cierre

* Si buscas **“imbatible de verdad”**, la vía más directa es **integrar el solver** (o reproducir su retrogrado) y construir un **policy‑engine** sobre esa base. ([GitHub][3])
* Si prefieres una IA **ligera** sin tabla perfecta, el combo **α‑β bien optimizado + heurísticas anteriores** (con especial énfasis en ventaja de carrera, seguridad de “1” y ordenación por capturas/amenazas) te da un bot **muy fuerte**; con **MCTS+red** puedes llegar a nivel “superhumano”. ([cyril-marechal.net][4])

Si quieres, en el siguiente paso te preparo **pseudocódigo** del evaluador con esas 12 señales (y un esquema de TT+α‑β) o un **esqueleto** de MCTS/PUCT listo para enchufar tu red.

[1]: https://www.board-game.co.uk/product/squadro-uk-ireland-only/?utm_source=chatgpt.com "Squadro | Board Games - Zatu Games"
[2]: https://dirdam.github.io/squadro.html "Adrï"
[3]: https://github.com/ndeineko/squadro-solver "GitHub - ndeineko/squadro-solver: Solver for the Squadro board game"
[4]: https://cyril-marechal.net/blog/alphasquadro.html "Achieving superhuman performance in the board game Squadro using AlphaZero on a single computer with no GPU | C:/Maréchal"
[5]: https://en.wikipedia.org/wiki/Solved_game?utm_source=chatgpt.com "Solved game - Wikipedia"
[6]: https://www.chessprogramming.org/UCT?utm_source=chatgpt.com "UCT - Chessprogramming wiki"
[7]: https://es.doc.boardgamearena.com/Tips_squadro "Tips squadro - Board Game Arena"
[8]: https://link.springer.com/chapter/10.1007/978-3-319-67946-4_11?utm_source=chatgpt.com "MCTS/UCT in Solving Real-Life Problems | SpringerLink"
[9]: https://www.kaggle.com/datasets/dirdam/squadro-games-played-in-bga?utm_source=chatgpt.com "Squadro games played in BGA | Kaggle"
