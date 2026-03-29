import type { DiagramSpec } from './types';

export const optimizationDiagrams: DiagramSpec[] = [
  {
    id: 'transposition-table',
    mermaidCode: `graph LR
      P1["Posición A→B→C"]
      P2["Posición B→A→C"]
      H["Hash Zobrist"]
      TT["Tabla Transposición"]
      R["Resultado en caché"]
      P1 -->|"hash"| H
      P2 -->|"mismo hash"| H
      H --> TT
      TT -->|"hit!"| R
      style R fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'Dos secuencias de movimientos distintas llegan a la misma posición', highlightNodes: ['P1', 'P2'] },
      { description: 'Zobrist hashing genera el mismo hash para posiciones idénticas', highlightNodes: ['H'] },
      { description: 'La tabla almacena evaluaciones previas indexadas por hash', highlightNodes: ['TT'] },
      { description: '¡Cache hit! Se reutiliza el resultado sin recalcular', highlightNodes: ['R'] },
    ],
    nodeTooltips: {
      P1: 'Camino 1: A mueve, luego B, luego C',
      P2: 'Camino 2: B mueve, luego A, luego C → misma posición',
      TT: 'Tabla con millones de entradas, consulta O(1)',
    },
  },
  {
    id: 'zobrist-hashing',
    mermaidCode: `graph TD
      I["Hash Inicial = 0"]
      X1["XOR pieza1@pos1"]
      X2["XOR pieza2@pos2"]
      X3["XOR turno"]
      H["Hash Final: 64-bit"]
      I --> X1
      X1 --> X2
      X2 --> X3
      X3 --> H
      style H fill:#1e1b4b,stroke:#818cf8`,
    steps: [
      { description: 'Comienza con hash = 0', highlightNodes: ['I'] },
      { description: 'XOR con número aleatorio para pieza 1 en posición 1', highlightNodes: ['X1'] },
      { description: 'XOR con número aleatorio para pieza 2 en posición 2', highlightNodes: ['X2'] },
      { description: 'XOR con índice de turno actual', highlightNodes: ['X3'] },
      { description: 'Hash de 64 bits único e incremental: O(1) por movimiento', highlightNodes: ['H'] },
    ],
    nodeTooltips: {
      X1: 'Cada combinación (pieza, posición) tiene un random de 64-bit pregenerado',
      H: 'XOR es reversible: hacer/deshacer movimiento = XOR mismo valor',
    },
  },
  {
    id: 'killer-moves',
    mermaidCode: `graph TD
      N["Nodo Actual d=5"]
      K["Killer Slots"]
      K1["Killer 1: e4"]
      K2["Killer 2: Nf3"]
      O["Ordenar Movimientos"]
      S["Buscar Primero"]
      N --> K
      K --> K1
      K --> K2
      K1 --> O
      K2 --> O
      O --> S
      style K fill:#1e1b4b,stroke:#818cf8`,
    steps: [
      { description: 'En profundidad d=5 del árbol de búsqueda...', highlightNodes: ['N'] },
      { description: 'Consulta los "killer moves": movimientos que causaron poda antes', highlightNodes: ['K'] },
      { description: 'Máximo 2 killers por profundidad, sin capturas', highlightNodes: ['K1', 'K2'] },
      { description: 'Estos movimientos se buscan primero → más podas tempranas', highlightNodes: ['O', 'S'] },
    ],
    nodeTooltips: {
      K: '2 slots por profundidad, se actualizan durante la búsqueda',
      K1: 'Movimiento que causó un corte beta recientemente en d=5',
    },
  },
  {
    id: 'history-heuristic',
    mermaidCode: `graph LR
      M["Movimiento"]
      CB["¿Causó corte beta?"]
      T["history[from][to] += d²"]
      O["Ordenar por Score"]
      M --> CB
      CB -->|"sí"| T
      T --> O
      style T fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'Cada movimiento se evalúa después de ejecutarse', highlightNodes: ['M'] },
      { description: '¿Este movimiento causó un corte beta (poda)?', highlightNodes: ['CB'] },
      { description: 'Sí → incrementa su score histórico en d² (profundidad al cuadrado)', highlightNodes: ['T'] },
      { description: 'En futuras búsquedas, movimientos con más historia se prueban primero', highlightNodes: ['O'] },
    ],
    nodeTooltips: {
      T: 'Tabla [origen][destino] → score acumulado',
      CB: 'Corte beta = el movimiento fue tan bueno que podamos el resto',
    },
  },
  {
    id: 'move-ordering',
    mermaidCode: `graph TD
      ALL["Todos los Movimientos"]
      TT["1. TT Move"]
      CAP["2. Capturas MVV-LVA"]
      KIL["3. Killers"]
      HIS["4. Historia"]
      QUI["5. Quietos"]
      ALL --> TT
      TT --> CAP
      CAP --> KIL
      KIL --> HIS
      HIS --> QUI
      style TT fill:#065f46,stroke:#10b981
      style QUI fill:#7f1d1d,stroke:#ef4444`,
    steps: [
      { description: 'Los movimientos se ordenan antes de buscar para maximizar podas', highlightNodes: ['ALL'] },
      { description: '1° Movimiento de la tabla de transposición (mejor de búsqueda previa)', highlightNodes: ['TT'] },
      { description: '2° Capturas ordenadas por MVV-LVA (capturar pieza valiosa con pieza barata)', highlightNodes: ['CAP'] },
      { description: '3° Killer moves, 4° Historia heurística', highlightNodes: ['KIL', 'HIS'] },
      { description: '5° Movimientos quietos (sin captura) → los menos prometedores', highlightNodes: ['QUI'] },
    ],
    nodeTooltips: {
      TT: 'Prioridad máxima: ya se evaluó en búsqueda previa',
      CAP: 'Capturas ordenadas: víctima más valiosa / atacante menos valioso',
      QUI: 'Última prioridad: probablemente serán podados',
    },
  },
  {
    id: 'mvv-lva',
    mermaidCode: `graph LR
      V["Víctima: ♛ Dama=9"]
      A["Atacante: ♙ Peón=1"]
      S["Score = 9×10 − 1 = 89"]
      V2["Víctima: ♙ Peón=1"]
      A2["Atacante: ♛ Dama=9"]
      S2["Score = 1×10 − 9 = 1"]
      V --> S
      A --> S
      V2 --> S2
      A2 --> S2
      style S fill:#065f46,stroke:#10b981
      style S2 fill:#7f1d1d,stroke:#ef4444`,
    steps: [
      { description: 'MVV-LVA ordena capturas: víctima más valiosa, atacante menos valioso', highlightNodes: ['V', 'A'] },
      { description: 'Peón captura Dama: score = 9×10 − 1 = 89 → ¡excelente captura!', highlightNodes: ['S'] },
      { description: 'Dama captura Peón: score = 1×10 − 9 = 1 → captura arriesgada', highlightNodes: ['V2', 'A2', 'S2'] },
    ],
    nodeTooltips: {
      S: 'Score alto = captura muy favorable, se busca primero',
      S2: 'Score bajo = pieza valiosa arriesgada por poco ganancia',
    },
  },
  {
    id: 'age-based-replacement',
    mermaidCode: `graph TD
      TT["Tabla Transposición"]
      F["Llena al 95%"]
      E1["Entrada vieja gen=2"]
      E2["Entrada nueva gen=5"]
      E3["Entrada profunda d=12"]
      R["Reemplazo"]
      TT --> F
      F --> E1
      F --> E2
      F --> E3
      E1 -->|"reemplazar"| R
      style E1 fill:#7f1d1d,stroke:#ef4444
      style E3 fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'La tabla de transposición se llena durante la búsqueda', highlightNodes: ['TT', 'F'] },
      { description: 'Entradas viejas (generación antigua) son candidatas a reemplazo', highlightNodes: ['E1'] },
      { description: 'Entradas recientes o profundas se preservan', highlightNodes: ['E2', 'E3'] },
      { description: 'Política: reemplaza por edad, luego por profundidad si empatan', highlightNodes: ['R'] },
    ],
    nodeTooltips: {
      E1: 'Generación baja = búsqueda antigua, menos relevante',
      E3: 'Profundidad alta = costosa de recalcular, se preserva',
    },
  },
];
