# Pylos — Diseño de IA (Minimax + Alpha-Beta)

Este documento define cómo implementaremos la IA para Pylos en el frontend `frontend/pylos/pylos-game/` usando **minimax** con **poda alpha-beta** y niveles de dificultad por profundidad (1–6). Incluye estructura de carpetas propuesta, representación de estado, generación de movimientos, evaluación heurística, API de integración con la UI, pruebas y riesgos.

Asunciones (ajustables si tu edición de reglas difiere):
- Se juega en pirámide 4x4 → 3x3 → 2x2 → 1x1 (cima).
- Jugadas: colocar esfera desde reserva o elevar una esfera propia a un nivel superior si hay soporte.
- Al cerrar una figura válida (p. ej., cuadrado 2x2 de tu color), puedes retirar 1–2 esferas propias que no sean de soporte.
- Gana quien coloca la última esfera (cima) o cumple condición de victoria según edición.


## 1) Resumen ejecutivo
- IA basada en **Minimax (minimax)** con **Poda Alpha-Beta (alpha-beta pruning)**.
- Dificultad: niveles 1–6 mapeados a profundidad de búsqueda (depth 1–6).
- Mejoras: **ordenamiento de movimientos (move ordering)**, **tabla de transposición (transposition table)** y **deepening iterativo (iterative deepening)** opcional.
- Integración no bloqueante mediante **Web Worker (web worker)** para mantener la UI fluida.

Beneficio: decisiones tácticas/estratégicas sólidas con tiempos controlables y base de pruebas reproducible.


## 2) Estructura de carpetas propuesta (frontend)
Ubicación base: `frontend/pylos/pylos-game/`

Para no bloquear la UI ni mezclar responsabilidades, proponemos separar el motor de IA y el worker:

```
frontend/
  pylos/
    pylos-game/
      assets/                 # (si aplica) texturas/sonidos
      css/                    # estilos (si no se usan frameworks)
      js/
        ai/
          engine/
            state.js          # representación del tablero y helpers (hasSupport, etc.)
            moves.js          # generateMoves, applyMove, undoMove
            evaluate.js       # evaluación heurística
            search.js         # minimax + alpha-beta + ordenamiento
            zobrist.js        # hashing (opcional)
            transposition.js  # tabla de transposición (opcional)
          worker/
            aiWorker.js       # Web Worker: recibe estado y devuelve mejor movimiento
          index.js            # API pública: computeBestMove(state, level)
        ui/
          game-ui.js          # lógica de UI; llama a ai/index.js
      index.html              # integra ui/game-ui.js y arranca la app
      styles.css              # estilos (si no se usa css/)
```

Notas:
- Si el proyecto ya usa módulos ES6, mantener `type="module"` en `<script>` o en `package.json` para bundlers.
- Si se prefiere TypeScript, análogos `.ts` con mismas rutas.


## 3) Representación de estado y utilidades
Estado mínimo:
```js
// state.js
export const EMPTY = 0;   // celda libre
export const A = 1;       // jugador A
export const B = -1;      // jugador B

/**
 * GameState: describe un estado legal del tablero.
 * - board[level][row][col]: 4 niveles: 4x4, 3x3, 2x2, 1x1
 * - reserves: bolas disponibles en mano
 * - turn: A(1) o B(-1)
 */
export function createInitialState() {
  return {
    board: [
      Array.from({ length: 4 }, () => Array(4).fill(EMPTY)),
      Array.from({ length: 3 }, () => Array(3).fill(EMPTY)),
      Array.from({ length: 2 }, () => Array(2).fill(EMPTY)),
      [[EMPTY]],
    ],
    reserves: { [A]: 15, [B]: 15 }, // ajustar si tu edición usa otro conteo
    turn: A,
  };
}

export function hasSupport(board, level, r, c) {
  if (level === 0) return true; // nivel base no requiere soporte
  const below = level - 1;
  return (
    board[below][r][c] !== EMPTY &&
    board[below][r][c + 1] !== EMPTY &&
    board[below][r + 1][c] !== EMPTY &&
    board[below][r + 1][c + 1] !== EMPTY
  );
}

export function isSupporting(board, level, r, c) {
  // ¿Esta esfera soporta alguna encima? Comprueba las 4 posibles celdas superiores.
  if (level >= 3) return false; // en la cima no soporta nada por encima
  const up = level + 1;
  const deltas = [
    [0, 0],
    [-1, 0],
    [0, -1],
    [-1, -1],
  ];
  for (const [dr, dc] of deltas) {
    const ur = r + dr;
    const uc = c + dc;
    if (
      ur >= 0 && uc >= 0 &&
      ur < board[up].length && uc < board[up][0].length &&
      board[up][ur][uc] !== EMPTY
    ) {
      // si hay algo arriba, este puede ser uno de sus 4 soportes, verificar los otros 3
      const others = [
        [ur, uc + 1],
        [ur + 1, uc],
        [ur + 1, uc + 1],
      ];
      let supported = true;
      for (const [or_, oc] of others) {
        if (
          or_ < 0 || oc < 0 ||
          or_ >= board[level].length || oc >= board[level][0].length ||
          board[level][or_][oc] === EMPTY
        ) {
          supported = false; break;
        }
      }
      if (supported) return true;
    }
  }
  return false;
}
```

Invariantes clave:
- Ninguna esfera puede quedar sin soporte.
- `enTablero + enReserva` = total inicial por jugador.
- No retirar esferas que son soporte de otra.


## 4) Generación de movimientos (generateMoves, apply/undo)
Tipos de movimiento:
- `place(level, r, c)`: colocar desde reserva en una posición con soporte.
- `lift(frLevel, fr, fc, toLevel, tr, tc)`: elevar una esfera propia si, al retirarla, nada queda colgando y el destino tiene soporte.
- Tras ejecutar un movimiento, si se forma una figura válida propia (p. ej., cuadrado 2x2), generar variantes que retiren 1 o 2 esferas propias que no sean de soporte.

Recomendaciones de implementación (`moves.js`):
1) `generateMoves(state)`: devolver lista de `Move` legales, separando por categoría (cierra figura, bloquea, elevación, colocación).
2) `applyMove(state, move)`: modificar in-place para rendimiento; devolver metadatos para `undoMove` (celdas tocadas, reservas, retiradas).
3) `undoMove(state, move, meta)`: deshacer exactamente lo aplicado; crítico para la búsqueda.


## 5) Evaluación heurística (evaluate)
Heurística lineal con pesos (ajustables por pruebas):

Componentes sugeridos:
- `material`: (mis reservas − reservas rival) → conservar bolas es valioso.
- `altura/posición`: favorecer niveles altos y centro.
- `potencial de figura`: amenazas de cerrar un cuadrado/figura.
- `movilidad`: (mis jugadas − jugadas rival) con límite para no meter ruido.
- `retiros posibles`: cuántas esferas propias pueden retirarse sin romper soporte.
- `bloqueo`: jugadas que niegan cierre inmediato del rival.
- `ruta a cima`: caminos factibles hacia el 1x1.

Estados terminales:
- Victoria propia: +∞; victoria rival: −∞ (o convención equivalente) para guiar la búsqueda.

Consejos:
- Normalizar cada término para que los pesos sean comparables.
- Valorar muy alto “cierra figura ahora” cerca de la cima.


## 6) Búsqueda: Minimax + Alpha-Beta (search.js)
Esqueleto (JS/TS):
```ts
export function alphabeta(state, depth, alpha, beta, maximizing) {
  if (depth === 0 || isTerminal(state)) {
    return evaluate(state);
  }

  const moves = generateMoves(state);
  orderMoves(moves, state); // heurístico

  if (maximizing) {
    let value = -Infinity;
    for (const m of moves) {
      const meta = applyMove(state, m);
      value = Math.max(value, alphabeta(state, depth - 1, alpha, beta, false));
      undoMove(state, m, meta);
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break; // poda beta
    }
    return value;
  } else {
    let value = +Infinity;
    for (const m of moves) {
      const meta = applyMove(state, m);
      value = Math.min(value, alphabeta(state, depth - 1, alpha, beta, true));
      undoMove(state, m, meta);
      beta = Math.min(beta, value);
      if (alpha >= beta) break; // poda alpha
    }
    return value;
  }
}
```

Mejoras:
- **Ordenamiento de movimientos (move ordering)**: priorizar “cierra figura”, bloquear amenazas, elevar a niveles altos, centro.
- **Tabla de transposición (transposition table)** con **hashing Zobrist (Zobrist hashing)**: guarda `value`, `depth`, `flag (EXACT|LOWER|UPPER)`, `bestMove`.
- **Deepening iterativo (iterative deepening)** opcional: profundidades 1..D para obtener mejores límites por tiempo y movimiento “mejor hasta ahora”.

Complejidad:
- Sin poda: O(b^d); con buen ordenamiento, alpha-beta ≈ O(b^(d/2)) en el mejor caso.


## 7) Niveles de dificultad (1–6)
Mapa por profundidad:
- Nivel 1 → depth = 1 (táctica inmediata).
- Nivel 2 → depth = 2.
- Nivel 3 → depth = 3.
- Nivel 4 → depth = 4.
- Nivel 5 → depth = 5.
- Nivel 6 → depth = 6.

Ajustes por nivel (sugerido):
- Niveles bajos: TT pequeña o desactivada; pesos más simples.
- Niveles altos: TT activada, ordenamiento fuerte, y (si se desea) límite por tiempo con deepening iterativo (p. ej., 1–2 s/jugada) y tope depth 6.


## 8) API de IA e integración con la UI
Contratos propuestos en `js/ai/index.js` y `js/ai/worker/aiWorker.js`.

API pública:
```js
// js/ai/index.js
let worker;

export function initAI() {
  if (!worker) {
    worker = new Worker(new URL('./worker/aiWorker.js', import.meta.url), { type: 'module' });
  }
}

export function computeBestMove(state, level) {
  return new Promise((resolve) => {
    initAI();
    const onMessage = (e) => {
      if (e.data?.type === 'RESULT') {
        worker.removeEventListener('message', onMessage);
        resolve(e.data.bestMove);
      }
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ type: 'SEARCH', state, depth: level });
  });
}
```

Worker minimal:
```js
// js/ai/worker/aiWorker.js
import { generateMoves, applyMove, undoMove } from '../engine/moves.js';
import { alphabeta } from '../engine/search.js';

self.onmessage = (e) => {
  const { type, state, depth } = e.data || {};
  if (type !== 'SEARCH') return;

  const maximizing = state.turn === 1; // A = 1, B = -1
  let bestMove = null;
  let bestScore = maximizing ? -Infinity : +Infinity;

  const moves = generateMoves(state);
  // orderMoves(moves, state); // si está implementado dentro de search, se invoca allí

  for (const m of moves) {
    const meta = applyMove(state, m);
    const score = alphabeta(state, depth - 1, -Infinity, +Infinity, !maximizing);
    undoMove(state, m, meta);

    const isBetter = maximizing ? score > bestScore : score < bestScore;
    if (isBetter) { bestScore = score; bestMove = m; }
  }

  postMessage({ type: 'RESULT', bestMove, stats: { depth } });
};
```

Integración en UI (`js/ui/game-ui.js`):
```js
import { computeBestMove } from '../ai/index.js';

export async function onAIMoveRequested(state, level) {
  const move = await computeBestMove(state, level);
  // aplicar move en tu modelo/renderer y continuar el flujo de turno
}
```


## 9) Ordenamiento de movimientos (move ordering)
Prioridades sugeridas (de mayor a menor):
1) Cierra figura y permite retirar 2.
2) Cierra figura y permite retirar 1.
3) Bloquea figura inmediata del rival.
4) Elevación a nivel superior (más alto = mejor).
5) Centro > borde > esquina (mejor soporte/rutas a cima).
6) Evitar romper soportes críticos.

Aplicación: asignar un “score de orden” a cada `Move` y ordenar por ese valor antes de expandir.


## 10) Tabla de transposición (opcional pero recomendable)
- **Hashing Zobrist (Zobrist hashing)** por (level, r, c, jugador).
- Entrada: `key, depth, value, flag (EXACT|LOWER|UPPER), bestMove`.
- Uso: si `depthStored >= depthActual` y la `flag` es consistente con [alpha, beta], reutilizar `value` y ordenar `bestMove` primero.
- Tamaño ajustable (p. ej., 1–8 MB) según memoria.


## 11) Pruebas y validación
- **Perft (performance test)**: contar jugadas legales a profundidad N desde estados conocidos; detecta errores en generación/undo.
- **Unit tests**: `hasSupport`, `isSupporting`, `canLift`, `applyMove/undoMove`, bonificaciones de cierre.
- **Invariantes**: ninguna esfera sin soporte; reservas y tablero mantienen totales; no retirar soportes.
- **IA vs IA**: partidas automáticas en niveles 1–6 para estimar estabilidad y ajustar pesos/ordenamiento.

Criterios de aceptación:
- La IA responde en tiempos razonables por nivel (definir p50/p95 por estado medio).
- No comete ilegalidades; perft y tests pasan.
- Resultado reproducible si hay “tie-break” aleatorio con `seed`.


## 12) Telemetría y parámetros
- Nodos/s, tasa de poda, hit-rate de TT, tiempo/jugada.
- Límite por tiempo (si se usa deepening) con “mejor hasta ahora”.
- Reutilización de estructuras para evitar GC excesivo; preferir `apply/undo` sobre clonado.


## 13) Riesgos y mitigaciones
- Generación/undo incorrecto (especial en elevaciones y retiros) → perft + unit tests + invariantes estrictas.
- Regla de retiro mal aplicada → validar que las retiradas no sean soportes y sean del color correcto.
- Tiempos largos en estados densos → ordenamiento fuerte + TT + deepening por tiempo.
- UI bloqueada → proceso en worker; mostrar indicador de “pensando”.


## 14) Roadmap de implementación
1) Modelo de estado + `hasSupport`/`isSupporting`.
2) `generateMoves`, `applyMove`, `undoMove` con retiros por cierre de figura.
3) `evaluate` con pesos iniciales y estados terminales.
4) `alphabeta` + ordenamiento.
5) Worker y API (`computeBestMove`).
6) Tabla de transposición y (opcional) deepening iterativo.
7) Suite de pruebas (perft + unit tests) y telemetría.


## 15) Glosario rápido (mentoría de términos)
- **Minimax (minimax)** — Búsqueda del mejor resultado contra oponente óptimo — Juegos por turnos — ej. evaluar hojas a profundidad fija.
- **Poda Alpha-Beta (alpha-beta pruning)** — Corta ramas que no pueden mejorar el resultado — Acelera Minimax — ej. romper bucle al cumplir `alpha >= beta`.
- **Heurística (heuristic)** — Estimación del valor de un estado no terminal — Útil cuando no llegas a la cima — ej. suma ponderada de rasgos.
- **Ordenamiento de movimientos (move ordering)** — Explorar primero los mejores candidatos — Mejora la poda — ej. “cierra figura” > “bloquea”.
- **Tabla de transposición (transposition table)** — Cache de estados evaluados — Evita recomputación — ej. usar `bestMove` almacenado primero.
- **Hashing Zobrist (Zobrist hashing)** — Técnica de hash incremental por pieza/posición — Para TT — ej. XOR al mover/retirar.
- **Deepening iterativo (iterative deepening)** — Busca por capas crecientes — Control por tiempo — ej. depth 1..D guardando mejor parcial.
- **Invariante (invariant)** — Condición que siempre se cumple — Garantiza corrección — ej. ninguna esfera sin soporte.
- **Web Worker (web worker)** — Hilo de fondo en navegador — Evita bloquear la UI — ej. `postMessage`/`onmessage`.


## 16) Cómo defender este diseño (defense-ready)
- **Objetivo/criterios**: Niveles 1–6, decisiones legales, tiempos razonables, pruebas (perft/tests) pasando.
- **Justificación técnica**: Pylos es determinista e info perfecta → **Minimax + Alpha-Beta** es estándar y eficaz; ordenamiento/TT elevan calidad.
- **Performance/memoria**: Poda con buen ordenamiento reduce nodos; TT configurable en MB; worker mantiene UI fluida.
- **Extensibilidad**: Pesos de evaluación ajustables; fácil activar límites por tiempo; se puede portar a backend Python si conviene.
- **Riesgos y próximos pasos**: Ver sección riesgos; instrumentar métricas; ajustar pesos con auto-juego y feedback humano.

