¡Qué buen tema! Squadro parece simple, pero su “árbol de juego” se dispara rápido. Voy a desglosarlo desde la combinatoria hasta lo que implicaría un minimax.

# 1) Reglas mínimas que afectan a la combinatoria

* Cada jugador tiene 5 piezas y en **tu turno debes mover exactamente una** de tus piezas activas. Objetivo: completar la ida y vuelta con **4 de las 5** piezas. ([Gigamic][1])
* Cada pieza mueve un número fijo de casillas según su carril; **a la vuelta ese valor se “invierte”** (1↔3 y 2→2). ([Assorted Meeples][2])
* Si **pasas por encima** de una pieza rival (o terminarías en su casilla), **saltas y paras en la primera casilla libre después de ella**, y la pieza rival **vuelve a su última base (salida o giro)**. ([Rules of Play][3])

Estas tres reglas son las que más moldean el tamaño del árbol de juego: (i) el número de piezas “jugables” por turno, (ii) los saltos (que provocan retornos) y (iii) la retirada de piezas completadas.

# 2) ¿Cuántas jugadas posibles (branching factor “b”) hay por turno?

En Squadro, la “jugada legal” en un turno es **elegir una de tus piezas activas**; el movimiento en sí es **determinista** (no hay múltiples destinos para la misma pieza).

* Al inicio normalmente tienes **5 elecciones**.
* Cuando una pieza termina el viaje completo, se retira ⇒ tu **baja a 4, 3, …**
* En media durante una partida, **b** oscila entre ~3 y 5. En la práctica, por cómo se van retirando piezas y por posiciones “forzadas”, un **promedio razonable** está alrededor de **b ≈ 3,5–4,5** (con **tope** claro en **b_max = 5**).

*(Definición de branching factor y cómo se usa para estimar complejidad de árboles de juego).* ([Wikipedia][4])

# 3) ¿Cuánta profundidad (número de plies “d”) tiene una partida?

“d” es el número de **plies** (medios turnos) de una partida completa. No hay un estándar oficial publicado, pero:

* El juego dura **10–20 min**; por ritmo de mesa típico y considerando que muchos turnos son rápidos, **80–110 plies** es un rango plausible para partidas humanas.
* Hay análisis de la comunidad que generan y miden largas series de partidas simuladas y usan precisamente la fórmula con **b** y **d** para acotar la complejidad del árbol de juego. (Metodología y fórmula en fuentes de comunidad y docencia.) ([BoardGameGeek][5])

> Resumen práctico: **b_max = 5**, **b_promedio ≈ 3,5–4,5**, **d ≈ 80–110** (orientativo).

# 4) Nodos que genera minimax

La **complejidad temporal** (número de nodos generados) de un árbol b-ario de profundidad d se estima por:
[
N \approx 1 + b + b^2 + \dots + b^d ;=; \frac{b^{d+1}-1}{b-1}.
]
*(Resultado clásico en búsqueda; usado para acotar BFS/minimax).* ([courses.physics.illinois.edu][6])

Ejemplos numéricos útiles para Squadro (suponiendo búsqueda a una **profundidad fija d** en plies):

* **b = 4**

  * d = 8  → **87 381** nodos
  * d = 10 → **1 398 101** nodos
  * d = 12 → **22 369 621** nodos

* **b = 3,5**

  * d = 8  → **31 526** nodos
  * d = 10 → **386 196** nodos
  * d = 12 → **4 730 908** nodos

* **b = 4,5**

  * d = 8  → **216 194** nodos
  * d = 10 → **4 377 938** nodos
  * d = 12 → **88 653 244** nodos

*(Estos órdenes de magnitud cuadran con lo esperado: Squadro tiene b muy inferior a ajedrez o go, pero la profundidad de partida aún hace crecer N con rapidez.)* ([Wikipedia][4])

### ¿Y con poda alfa–beta?

Con **poda alfa–beta** y **buen ordenado de jugadas**, el número efectivo de nodos baja aproximadamente hacia **O(b^{d/2})**, lo que en la práctica permite **duplicar la profundidad** con el mismo coste. (Resultado estándar en cursos de IA.) ([courses.physics.illinois.edu][6])

# 5) Estado del tablero (state-space), por si quieres otra métrica

Si (L_i) es el número de posiciones discretas en el carril (i) (contando bases) para cada jugador, una **cota grosera** del espacio de estados sería
[
\text{SSC} ;\lesssim; \prod_{i=1}^{5} L_i \times \prod_{j=1}^{5} L'_j
]
menos las configuraciones inválidas (colisiones imposibles, piezas retiradas, etc.). En Squadro hay **transposiciones** (puedes alcanzar el mismo estado por distintas secuencias), por lo que **tablas de transposición** ayudan mucho al motor.

---

## Conclusión en dos líneas

* **Posibilidades por turno (b):** tope **5**, promedio práctico **≈ 3,5–4,5**.
* **Nodos con minimax a profundidad d:** (\displaystyle N \approx \frac{b^{d+1}-1}{b-1}).
  Por ejemplo, con **b≈4**: d=10 ⇒ **~1,4 M** nodos; d=12 ⇒ **~22,4 M** nodos. ([BoardGameGeek][5])

Si quieres, en el siguiente paso puedo proponerte una **configuración de motor** (ordenación de jugadas, evaluación heurística y simetrías) específica para Squadro y estimar qué **profundidad de búsqueda** es realista en tu hardware.

[1]: https://en.gigamic.com/modern-classics/504-squadro.html?utm_source=chatgpt.com "Squadro - Gigamic"
[2]: https://assortedmeeples.com/table-for-two-squadro?utm_source=chatgpt.com "Table for Two S3E5: Squadro - Assorted Meeples"
[3]: https://rulesofplay.co.uk/products/squadro?utm_source=chatgpt.com "Squadro — Rules of Play"
[4]: https://en.wikipedia.org/wiki/Branching_factor?utm_source=chatgpt.com "Branching factor - Wikipedia"
[5]: https://boardgamegeek.com/blog/8995/blogpost/87276/game-complexity-i-state-space-and-game-tree-comple?utm_source=chatgpt.com "Game Complexity I: State-Space & Game-Tree Complexities"
[6]: https://courses.physics.illinois.edu/ece448/sp2021/slides/lec02.pdf?utm_source=chatgpt.com "lec02 - University of Illinois Urbana-Champaign"
