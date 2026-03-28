# Squadro — Reglas completas (ES)

> Basado en el reglamento oficial (imagen adjunta, © 2018 Gigamic, concepto de Adrián Jiménez Pascual). Este texto consolida todas las reglas en español y añade definiciones claras para que puedas implementarlas en Vite + React + TypeScript.

---

## 1) Componentes

* 1 **tablero** con carriles perpendiculares y **puntos grabados** junto a cada **casilla de salida** y **casilla de giro** (indican velocidades).
* 10 **piezas de madera**: 5 claras y 5 oscuras.
  Cada pieza tiene una **punta** que señala su **dirección de movimiento**.
* 1 libreto de reglas (fuente de esta síntesis).

---

## 2) Concepto y objetivo

Cada jugador controla **5 piezas de su color**. Se alternan turnos moviendo **una** pieza por turno, respetando su **capacidad de movimiento** (su “velocidad”).
**Gana** el primer jugador que consigue que **4 de sus 5 piezas** crucen el tablero hasta el lado opuesto **y regresen** a su casilla de salida (ida y vuelta). En cuanto una pieza completa el regreso, se **retira del tablero**.

---

## 3) Preparación

1. Sentad a los jugadores **perpendicularmente** (uno juega en filas horizontales; el otro, en columnas verticales).
2. Colocad vuestras **5 piezas** en vuestra **zona de salida**, **detrás de la línea de salida**, apuntando hacia el **centro** del tablero.
   La **punta** de cada pieza indica la **dirección** de avance inicial.
3. Determinad **al azar** quién empieza.
4. Cada pieza **tiene su propio carril**; las piezas del mismo jugador **no se cruzan** entre sí.

---

## 4) Definiciones (para implementación)

* **Casilla**: punto de intersección donde puede situarse una pieza.
* **Carril**: la línea recta por la que avanza una pieza (5 carriles por jugador).
* **Velocidad de ida**: nº de casillas que avanza una pieza por turno **antes de girar**, igual a los **puntos grabados** junto a su **casilla de salida**.
* **Velocidad de vuelta**: nº de casillas que avanza por turno **después de girar**, igual a los **puntos grabados** junto a su **casilla de giro** (borde opuesto).
* **Estado de pieza**: `en_ida` (no ha girado), `en_vuelta` (ya giró), `retirada` (completó el viaje).
* **Borde opuesto**: la casilla del extremo del carril donde la pieza **gira**.

> **Nota de diseño:** el patrón concreto de velocidades (cuántos puntos hay en cada carril) **viene grabado en el tablero** y debe leerse de ahí. El motor de juego debe **parametrizar** estas velocidades por carril (dos valores por pieza: ida y vuelta).

---

## 5) Secuencia de turno

En tu turno **debes mover exactamente una** de tus piezas.

### 5.1 Cálculo de la velocidad

* Si la pieza está **en ida** → usa la **velocidad** indicada por los **puntos** junto a su **salida**.
* Si la pieza está **en vuelta** → usa la **velocidad** indicada por los **puntos** junto a su **casilla de giro**.

### 5.2 Movimiento básico

* La pieza avanza en **línea recta** por su carril **el número exacto de casillas** igual a su velocidad **a menos que** alguna regla obligue a **detenerse antes** (ver 5.3 y 5.4).
* Las piezas **no pueden desviarse** ni “gastar menos” movimiento voluntariamente.

### 5.3 Giro y parada en el borde opuesto

* Cuando una pieza **alcanza el borde opuesto**, **gira inmediatamente** (su punta pasa a mirar hacia la línea de salida) y **termina su movimiento de ese turno**, **aunque le quedaran casillas por mover**.
* A partir del siguiente turno, esa pieza está **en vuelta** y usará su **velocidad de vuelta** (puntos junto a la casilla de giro).

### 5.4 Pasar por encima de piezas rivales (saltos) y retrocesos

Durante **cualquier** avance de una pieza propia:

* Si **pasa por encima** de una o más piezas **rivales**, **salta** todas esas piezas y **se detiene** en la **primera casilla vacía inmediatamente después** de la **última** pieza saltada, **aunque todavía le quedaran casillas por mover**.
* Si el movimiento **terminaría exactamente** en una casilla **ocupada por un rival**, se aplica igualmente el **salto**, y te detienes **justo detrás** (primera casilla libre).
* Si ese **justo detrás** coincide con el **borde**, te detienes en el **borde** y, si es el borde opuesto, **giras** (ver 5.3).

**Efecto en las piezas saltadas (retroceso a un borde):**

* Toda pieza rival **saltada** debe irse de vuelta al **borde** correspondiente:

  * Si esa pieza **no había girado** aún → **vuelve a su casilla de salida**, orientada hacia el centro (**estado**: `en_ida`).
  * Si esa pieza **ya había girado** → **vuelve a su casilla de giro**, orientada hacia su salida (**estado**: `en_vuelta`).
* Colocar de vuelta al borde es **inmediato**; no da turnos extra ni movimientos adicionales.

> **Resumen de paradas anticipadas** (excepciones a “mueve todo”):
> a) **Giro** en el borde opuesto.
> b) **Salto** sobre rivales: parada en la **primera casilla libre** tras la última pieza saltada.
> En cualquier otro caso, la pieza debe **completar** su movimiento exacto.

---

## 6) Retorno y retirada

* En el momento en que una pieza **vuelve a su casilla de salida**, se **retira del tablero**.
* Esa pieza ya **no se usa** ni ocupa espacio. Cuenta como **1** de las **4** necesarias para ganar.

---

## 7) Fin de la partida

* **Gana** el primer jugador que completa el **ida y vuelta** con **4 de sus 5 piezas**.
* No hay empates: los turnos no son simultáneos.

---

## 8) Aclaraciones y casos límite

* **No puedes pasar turno**: siempre debes mover una pieza legalmente.
* **Propias piezas**: nunca se bloquean entre sí porque **cada una tiene su carril**.
* **Múltiples rivales contiguos**: si cruzas un “bloque” de varias piezas rivales, **saltas todas** y te detienes en la **primera casilla vacía** posterior; **todas** las saltadas retroceden al borde que les corresponda.
* **Cruce + borde**: si al saltar quedas **en el borde opuesto**, **giras** y el **turno termina** (no sigues moviendo con la nueva velocidad).
* **Movimiento “más allá” del borde**: si tu conteo natural excedería el borde, **te detienes en el borde** y (si es el opuesto) **giras**; ese turno termina.
* **Orientación al regresar al borde** por retroceso: al regresar a **salida**, la pieza queda **apuntando hacia el centro**; al regresar a **giro**, queda **apuntando hacia la salida**.

---

## 9) Especificación técnica mínima (útil para TypeScript)

> No forma parte del reglamento, pero te servirá para codificar comportamientos sin ambigüedades.

### 9.1 Modelo de datos sugerido

```ts
type Player = 'Light' | 'Dark';

type PieceState = 'en_ida' | 'en_vuelta' | 'retirada';

interface Lane {
  // posiciones discretas del carril, incluyendo ambos bordes
  length: number;            // p. ej., número de casillas desde borde a borde
  speedOut: number;          // puntos junto a la salida
  speedBack: number;         // puntos junto a la casilla de giro
}

interface Piece {
  id: string;
  owner: Player;
  laneIndex: number;         // 0..4
  pos: number;               // 0 = salida del dueño, length = borde opuesto
  state: PieceState;         // en_ida | en_vuelta | retirada
}

interface GameState {
  lanesByPlayer: Record<Player, Lane[]>; // 5 carriles por jugador
  pieces: Piece[];                        // 10 piezas en total
  turn: Player;
  winner?: Player;
}
```

### 9.2 Algoritmo de movimiento (alto nivel)

```ts
function movePiece(gs: GameState, pieceId: string): GameState {
  const p = getPiece(gs, pieceId);
  if (p.state === 'retirada') throw new Error('La pieza ya fue retirada');

  const lane = gs.lanesByPlayer[p.owner][p.laneIndex];
  const dir = (p.state === 'en_ida') ? +1 : -1;
  const speed = (p.state === 'en_ida') ? lane.speedOut : lane.speedBack;

  let stepsLeft = speed;
  let pos = p.pos;

  // avance paso a paso hasta agotar pasos o detenerse por regla
  while (stepsLeft > 0) {
    const next = pos + dir;
    // llegar al borde opuesto o a la salida
    if (next < 0 || next > lane.length) {
      // nunca debería ocurrir si length es correcto
      break;
    }
    pos = next;
    stepsLeft--;

    // ¿cruza una pieza rival?
    const opponentsHere = getOpponentsOnIntersection(gs, p.owner, p.laneIndex, pos);
    if (opponentsHere.length > 0) {
      // buscar la primera casilla libre "justo detrás" de la última pieza saltada
      const lastBlockPos = pos;
      const stopPos = firstEmptyAfter(gs, p.owner, p.laneIndex, lastBlockPos, dir);
      pos = stopPos;          // parada inmediata
      // retroceso de TODAS las piezas rival(es) presentes en el bloque
      for (const opp of opponentsHere) {
        sendBackToEdge(gs, opp); // salida si en_ida, giro si en_vuelta
      }
      stepsLeft = 0;          // el salto siempre termina el movimiento
    }

    // ¿llegó a un borde?
    if (pos === lane.length) {        // borde opuesto
      p.state = 'en_vuelta';
      stepsLeft = 0;                  // gira y termina
    } else if (pos === 0) {           // salida (solo podría ocurrir viniendo de vuelta)
      // retirar pieza
      p.state = 'retirada';
      removeFromBoard(gs, p);
      stepsLeft = 0;
    }
  }

  // aplicar posición final/orientación (si no se retiró)
  if (p.state !== 'retirada') p.pos = pos;

  // comprobar victoria (4 retiradas del jugador)
  if (countRetired(gs, p.owner) >= 4) gs.winner = p.owner;

  // alternar turno si no hay ganador
  if (!gs.winner) gs.turn = other(p.owner);

  return gs;
}
```

> **Intersecciones y colisiones**: como los carriles son perpendiculares, las únicas colisiones posibles son en **intersecciones** con piezas rivales. Modela `getOpponentsOnIntersection` como “todas las piezas rivales cuya coordenada transversal coincide con la del carril propio y cuya `pos` coincide con la intersección actual”.

---

## 10) Recordatorios estratégicos (no reglamentarios)

* Las **velocidades** de ida/vuelta crean **tempos** distintos por carril: bloquear “mal” puede regalar un salto al rival.
* Prioriza completar **4 piezas**; a veces es mejor **no pelear** un bloqueo si abre un salto decisivo al contrario.

---
