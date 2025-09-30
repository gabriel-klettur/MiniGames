# 🚀 Optimización de un motor IA de Pylos basado en Minimax

Este documento describe las técnicas y herramientas clave para mejorar el **rendimiento y fuerza de juego** de un motor de Pylos implementado con **minimax y poda alfa–beta**. Está orientado a una implementación en **JavaScript/TypeScript**, ejecutándose en **frontend (Web Worker)**, sin depender de un servidor.

---

## 1. Representación del estado

* **Bitboards con BigInt**: dos máscaras (`p0`, `p1`) para cada jugador.
* Precalcular:

  * **Soportes** (`supports[i]`).
  * **Cuadrados** (`squares`) para detectar formaciones.
  * **Casillas levantables** (`isSupporting[i]`).
* Ventaja: operaciones rápidas con bitwise.

---

## 2. Evaluación (Evaluation Function)

La **evaluación** puntúa una posición en hojas y en **quiescence**. Debe ser **rápida y lineal**.

**Términos principales:**

* **Altura**: piezas en niveles altos valen más.
* **Reservas**: diferencia de canicas restantes.
* **Amenazas de cuadrado**: contar 3/4 en formaciones posibles.
* **Centro**: bonificar piezas centrales.
* **Movilidad**: número de movimientos legales.
* **Tapered eval**: pesos distintos en apertura y final.

Ejemplo:

```ts
Eval = W.height*(hMe - hOp) +
       W.reserves*(resMe - resOp) +
       W.squares*(sqMe - sqOp) +
       W.center*(centerMe - centerOp) +
       W.mobility*(mobMe - mobOp);
```

---

## 3. Iterative Deepening + Control por Tiempo

* Explora profundidad creciente: 1 → 2 → 3…
* Guarda siempre la **mejor jugada parcial** (PV).
* Permite parar en un tiempo fijo (`timeMs`).

---

## 4. Transposition Table (TT) + Zobrist Hashing

* **Zobrist hashing**:

  * Número aleatorio de 64 bits por `(jugador, casilla)`.
  * XOR de todos los ocupados + turno.
* **TT**:

  * Array de tamaño fijo (potencia de 2).
  * Guarda `key`, `depth`, `value`, `flag`, `bestMove`.
* Políticas:

  * **Always replace**, o **prefer deeper**.
* Beneficio: evita recomputar subárboles.

---

## 5. Move Ordering (ordenación de movimientos)

El orden en que exploras jugadas **reduce drásticamente nodos**:

1. **PV move** (de iteraciones anteriores).
2. **Hash move** (de TT).
3. **Killers**: movimientos que provocaron corte β en este nivel.
4. **History heuristic**: movimientos que han sido buenos en el pasado.
5. **Heurísticas estáticas**: subir a niveles altos, ocupar centro.

---

## 6. Quiescence Search

* Expande más allá de `depth=0` solo si hay **jugadas tácticas**:

  * Formar cuadrado (que permite quitar).
  * Levantar pieza clave.
* Evita efecto “horizonte” de malas evaluaciones.

---

## 7. Aspiration Windows

* En cada iteración: busca en `[scoreAnterior - Δ, scoreAnterior + Δ]`.
* Si falla bajo/alto, re-busca con ventana completa.
* Ahorra nodos cuando la evaluación no cambia demasiado.

---

## 8. Principal Variation Search (PVS)

* Busca el **primer hijo** con ventana completa `[α,β]`.
* Resto: búsqueda con ventana nula `[α, α+1]`.
* Solo re-busca si mejora α.
* Acelera exploración manteniendo precisión.

---

## 9. Libro de Aperturas

* Fichero estático (`book.bin` o JSON).
* Mapea `hash` → `mejorMovimiento`.
* Se consulta **antes de buscar**: jugada instantánea.
* Puede incluir simetrías para reducir tamaño.
* Generado offline con auto-juego o manualmente.

---

## 10. Tabla de Finales (Endgame Tablebase, EGTB)

* Precomputada offline con **retrograde analysis**.
* Guarda resultados exactos (`Win/Loss/Draw`, opcional DTM).
* Se activa cuando hay ≤N canicas en tablero.
* Se empaqueta en un binario (`egtb.bin`) y se carga en frontend.

---

## 11. Cache en IndexedDB

* Guardar `book.bin` y `egtb.bin` en **IndexedDB**.
* Flujo:

  1. Cargar desde IndexedDB si existe.
  2. Si no, `fetch` del servidor y guardar.
* Beneficio: evitar descargas repetidas, acceso inmediato en sesiones futuras.

---

## 12. Integración en Frontend

* **Web Worker** para el motor → no bloquea UI.
* Interfaz:

  ```ts
  worker.postMessage({ state, timeMs: 150 });
  worker.onmessage = (e) => applyMove(state, e.data);
  ```
* Opcional:

  * Undo/Redo con historial de hashes.
  * Mostrar PV line como hint.

---

## 13. Extra: Opciones de Rendimiento

* **TypedArrays** para TT.
* **Abort flag** compartido (Atomics) para control de tiempo.
* (Opcional) **WASM** (Rust/C++) → +2–5× velocidad.

---

# ✅ Checklist de Implementación

* [ ] Representación con bitboards y tablas precalculadas.
* [X] Evaluación lineal con términos básicos y tapered eval.
* [X] Iterative deepening con límite de tiempo.
* [X] TT con Zobrist hashing.
* [X] Ordenación con PV, hash, killers, history.
* [X] Quiescence search en jugadas tácticas.
* [X] Aspiration windows y PVS.
* [X] Libro de aperturas cargado desde archivo.
* [ ] Tabla de finales para posiciones pequeñas.
* [ ] Cache de book/egtb en IndexedDB.
* [X] Motor en Worker, UI en React.