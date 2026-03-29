import type { DiagramSpec } from './types';

export const searchAlgorithmDiagrams: DiagramSpec[] = [
  {
    id: 'minimax',
    mermaidCode: `graph TD
      R["MAX (Raíz)"]
      A["MIN A"]
      B["MIN B"]
      C["MAX C: 3"]
      D["MAX D: 5"]
      E["MAX E: 2"]
      F["MAX F: 9"]
      R -->|izq| A
      R -->|der| B
      A -->|izq| C
      A -->|der| D
      B -->|izq| E
      B -->|der| F`,
    steps: [
      { description: 'Nodo raíz MAX busca maximizar su valor', highlightNodes: ['R'] },
      { description: 'Explora rama izquierda: nodo MIN A busca minimizar', highlightNodes: ['A'] },
      { description: 'Hojas C=3 y D=5 evaluadas, MIN A elige mínimo: 3', highlightNodes: ['C', 'D', 'A'] },
      { description: 'Explora rama derecha: nodo MIN B busca minimizar', highlightNodes: ['B'] },
      { description: 'Hojas E=2 y F=9 evaluadas, MIN B elige mínimo: 2', highlightNodes: ['E', 'F', 'B'] },
      { description: 'MAX raíz elige máximo entre 3 y 2 → selecciona 3 (rama A)', highlightNodes: ['R', 'A'] },
    ],
    nodeTooltips: {
      R: 'Nodo MAX: elige el valor más alto entre sus hijos',
      A: 'Nodo MIN: elige el valor más bajo entre sus hijos',
      B: 'Nodo MIN: elige el valor más bajo entre sus hijos',
      C: 'Hoja con evaluación estática = 3',
      D: 'Hoja con evaluación estática = 5',
      E: 'Hoja con evaluación estática = 2',
      F: 'Hoja con evaluación estática = 9',
    },
  },
  {
    id: 'alpha-beta',
    mermaidCode: `graph TD
      R["MAX α=-∞ β=+∞"]
      A["MIN α=-∞ β=3"]
      B["MIN ✂ PODADO"]
      C["3"]
      D["5"]
      E["2"]
      F["? ✂"]
      R -->|izq| A
      R -->|"der (podada)"| B
      A -->|izq| C
      A -->|der| D
      B -->|izq| E
      B -.->|podado| F
      style B fill:#7f1d1d,stroke:#ef4444
      style F fill:#7f1d1d,stroke:#ef4444,stroke-dasharray: 5 5`,
    steps: [
      { description: 'Inicializa α=-∞, β=+∞ en la raíz MAX', highlightNodes: ['R'] },
      { description: 'Explora MIN A: evalúa hoja C=3, actualiza β=3', highlightNodes: ['A', 'C'] },
      { description: 'Evalúa hoja D=5, MIN A ya tiene β=3 (no cambia, 3<5)', highlightNodes: ['D'] },
      { description: 'MIN A retorna 3 → MAX actualiza α=3', highlightNodes: ['R', 'A'] },
      { description: 'Explora MIN B: evalúa E=2. Como 2 ≤ α(3), se poda la rama', highlightNodes: ['B', 'E'] },
      { description: '¡PODA! No necesitamos evaluar F. Resultado final: 3', highlightNodes: ['R', 'F'] },
    ],
    nodeTooltips: {
      R: 'Raíz MAX: α es el mejor valor garantizado para MAX',
      A: 'MIN A: β es el mejor valor garantizado para MIN',
      B: 'MIN B: podada porque encontró valor ≤ α del padre',
      E: 'Valor 2 ≤ α(3) del padre → dispara la poda',
      F: 'Nunca se evalúa gracias a la poda alpha-beta',
    },
  },
  {
    id: 'negamax',
    mermaidCode: `graph TD
      R["negamax(pos, 2)"]
      A["−negamax(pos, 1)"]
      B["−negamax(pos, 1)"]
      C["−negamax(leaf)=3"]
      D["−negamax(leaf)=−5"]
      R -->|"mov 1"| A
      R -->|"mov 2"| B
      A -->|"×(−1)"| C
      B -->|"×(−1)"| D`,
    steps: [
      { description: 'Negamax simplifica: una sola función en vez de max/min separados', highlightNodes: ['R'] },
      { description: 'Cada nivel multiplica por -1 el resultado del hijo', highlightNodes: ['A', 'B'] },
      { description: 'Hoja retorna evaluación, padre la niega: −(−3) = 3', highlightNodes: ['C'] },
      { description: 'Segundo hijo: −(5) = −5. Padre elige max(3, −5) = 3', highlightNodes: ['D', 'R'] },
    ],
    nodeTooltips: {
      R: 'Una sola función recursiva para ambos jugadores',
      A: 'Cambio de perspectiva: multiplica resultado por -1',
      C: 'Evaluación desde la perspectiva del jugador actual',
    },
  },
  {
    id: 'iterative-deepening',
    mermaidCode: `graph LR
      D1["Prof. 1"]
      D2["Prof. 2"]
      D3["Prof. 3"]
      D4["Prof. 4"]
      T{"⏱ Tiempo"}
      D1 -->|"mejor=A"| D2
      D2 -->|"mejor=B"| D3
      D3 -->|"mejor=B"| D4
      D4 -.->|"timeout!"| T
      style T fill:#7f1d1d,stroke:#ef4444`,
    steps: [
      { description: 'Profundidad 1: búsqueda rápida, encuentra movimiento A', highlightNodes: ['D1'] },
      { description: 'Profundidad 2: más precisa, cambia a movimiento B', highlightNodes: ['D2'] },
      { description: 'Profundidad 3: confirma B, mejora ordenamiento de movimientos', highlightNodes: ['D3'] },
      { description: 'Profundidad 4: ¡timeout! Usa el mejor resultado de prof. 3', highlightNodes: ['D4', 'T'] },
    ],
    nodeTooltips: {
      D1: 'Primera iteración: resultado rápido pero impreciso',
      D4: 'Si el tiempo se agota, tenemos el resultado de la iteración anterior',
      T: 'Gestión de tiempo adaptativa según fase de juego',
    },
  },
  {
    id: 'quiescence-search',
    mermaidCode: `graph TD
      N["Búsqueda Normal d=0"]
      Q["Búsqueda Quiescencia"]
      C1["♟ Captura 1"]
      C2["♟ Captura 2"]
      S["Stand-pat"]
      E["Evaluación Final"]
      N -->|"d=0, posición inestable"| Q
      Q --> C1
      Q --> C2
      Q --> S
      C1 --> E
      C2 --> E
      S -->|"sin capturas"| E
      style Q fill:#1e1b4b,stroke:#818cf8`,
    steps: [
      { description: 'Búsqueda normal llega a profundidad 0', highlightNodes: ['N'] },
      { description: 'Posición inestable → activa búsqueda de quiescencia', highlightNodes: ['Q'] },
      { description: 'Solo explora movimientos tácticos: capturas, jaques', highlightNodes: ['C1', 'C2'] },
      { description: 'Stand-pat: opción de no capturar si la posición ya es buena', highlightNodes: ['S'] },
      { description: 'Evita el "horizon effect": no ignora amenazas inminentes', highlightNodes: ['E'] },
    ],
    nodeTooltips: {
      N: 'Búsqueda estándar agota profundidad en d=0',
      Q: 'Solo explora capturas, promociones y jaques',
      S: 'Stand-pat: evaluación estática sin mover',
    },
  },
  {
    id: 'bfs-pathfinding',
    mermaidCode: `graph TD
      S["🟢 Inicio"]
      A1["Nivel 1a"]
      A2["Nivel 1b"]
      B1["Nivel 2a"]
      B2["🧱 Pared"]
      B3["Nivel 2c"]
      G["🏁 Meta"]
      S --> A1
      S --> A2
      A1 --> B1
      A1 -.->|bloqueado| B2
      A2 --> B3
      B3 --> G
      style B2 fill:#7f1d1d,stroke:#ef4444
      style S fill:#065f46,stroke:#10b981
      style G fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'BFS comienza desde la posición del peón (verde)', highlightNodes: ['S'] },
      { description: 'Explora nivel 1: dos casillas adyacentes', highlightNodes: ['A1', 'A2'] },
      { description: 'Nivel 2: B2 es pared → camino bloqueado', highlightNodes: ['B1', 'B2', 'B3'] },
      { description: 'Encuentra meta por ruta A2→B3→G (camino más corto)', highlightNodes: ['G'] },
    ],
    nodeTooltips: {
      S: 'Posición actual del peón en el tablero',
      B2: 'Pared colocada por el oponente en Quoridor',
      G: 'Fila objetivo del peón',
    },
  },
];
