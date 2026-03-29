import type { DiagramSpec } from './types';

export const architectureDiagrams: DiagramSpec[] = [
  {
    id: 'separation-of-concerns',
    mermaidCode: `graph TD
      UI["🖥 Vista / UI"]
      C["🎮 Controlador"]
      M["📦 Modelo"]
      AI["🤖 Motor IA"]
      UI -->|"acciones usuario"| C
      C -->|"actualiza"| M
      M -->|"estado"| UI
      C -->|"solicita movimiento"| AI
      AI -->|"mejor movimiento"| C`,
    steps: [
      { description: 'La Vista muestra el tablero y recibe clicks del usuario', highlightNodes: ['UI'] },
      { description: 'El Controlador orquesta: traduce acciones en lógica', highlightNodes: ['C'] },
      { description: 'El Modelo almacena el estado del juego (tablero, turno, reglas)', highlightNodes: ['M'] },
      { description: 'El Motor IA solo recibe una posición y devuelve un movimiento', highlightNodes: ['AI'] },
      { description: 'Cada capa es independiente y reemplazable', highlightNodes: ['UI', 'C', 'M', 'AI'] },
    ],
    nodeTooltips: {
      UI: 'Puede ser web, terminal o mobile sin cambiar la lógica',
      AI: 'Motor IA desacoplado: solo depende del Modelo',
      C: 'Punto de contacto entre UI, Modelo e IA',
    },
  },
  {
    id: 'dependency-injection',
    mermaidCode: `graph LR
      G["Game Engine"]
      I["IAI Interface"]
      AB["AlphaBeta"]
      MC["MCTS"]
      NN["NeuralNet"]
      G -->|"usa"| I
      I -.->|"impl"| AB
      I -.->|"impl"| MC
      I -.->|"impl"| NN
      style I fill:#1e1b4b,stroke:#818cf8`,
    steps: [
      { description: 'El Game Engine depende de una interfaz IAI, no de una implementación', highlightNodes: ['G', 'I'] },
      { description: 'AlphaBeta, MCTS y NeuralNet implementan la misma interfaz', highlightNodes: ['AB', 'MC', 'NN'] },
      { description: 'Se puede intercambiar el motor IA sin modificar el juego', highlightNodes: ['I'] },
    ],
    nodeTooltips: {
      I: 'Interface: getMove(position) → Move',
      AB: 'Implementación Alpha-Beta con poda',
      MC: 'Implementación Monte Carlo Tree Search',
    },
  },
  {
    id: 'worker-pool',
    mermaidCode: `graph TD
      M["Main Thread (UI)"]
      P["Worker Pool"]
      W1["Worker 1"]
      W2["Worker 2"]
      W3["Worker 3"]
      W4["Worker 4"]
      M -->|"distribuir"| P
      P --> W1
      P --> W2
      P --> W3
      P --> W4
      W1 -->|"resultado"| M
      W2 -->|"resultado"| M
      W3 -->|"resultado"| M
      W4 -->|"resultado"| M`,
    steps: [
      { description: 'El Main Thread mantiene la UI responsiva', highlightNodes: ['M'] },
      { description: 'El Pool distribuye trabajo entre Web Workers', highlightNodes: ['P'] },
      { description: 'Cada Worker ejecuta búsqueda en paralelo', highlightNodes: ['W1', 'W2', 'W3', 'W4'] },
      { description: 'Los resultados se envían de vuelta al Main Thread', highlightNodes: ['M'] },
    ],
    nodeTooltips: {
      M: 'Nunca bloquear el main thread con cálculos pesados',
      P: 'Pool reutiliza workers para evitar coste de creación',
      W1: 'Cada worker tiene su propia memoria y tabla de transposición',
    },
  },
  {
    id: 'root-parallelization',
    mermaidCode: `graph TD
      R["Posición Raíz"]
      M1["Mov 1 → Worker A"]
      M2["Mov 2 → Worker B"]
      M3["Mov 3 → Worker C"]
      B["Mejor Resultado"]
      R --> M1
      R --> M2
      R --> M3
      M1 -->|"score=5"| B
      M2 -->|"score=8"| B
      M3 -->|"score=3"| B
      style M2 fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'Desde la raíz, cada movimiento candidato se asigna a un worker', highlightNodes: ['R'] },
      { description: 'Los workers evalúan movimientos en paralelo e independiente', highlightNodes: ['M1', 'M2', 'M3'] },
      { description: 'Se selecciona el movimiento con mejor score (Mov 2: score=8)', highlightNodes: ['B', 'M2'] },
    ],
    nodeTooltips: {
      R: 'Solo se paraleliza el primer nivel del árbol',
      M2: 'Mejor score → movimiento elegido',
    },
  },
  {
    id: 'second-ply-split',
    mermaidCode: `graph TD
      R["Raíz"]
      L1["Nivel 1: Mov A"]
      L1B["Nivel 1: Mov B"]
      S1["Split → Worker 1"]
      S2["Split → Worker 2"]
      S3["Split → Worker 3"]
      R --> L1
      R --> L1B
      L1 --> S1
      L1 --> S2
      L1B --> S3`,
    steps: [
      { description: 'Se busca el primer movimiento secuencialmente en la raíz', highlightNodes: ['R', 'L1'] },
      { description: 'En el segundo nivel, se divide el trabajo entre workers', highlightNodes: ['S1', 'S2'] },
      { description: 'Mayor granularidad que root parallelization, mejor balance de carga', highlightNodes: ['S3'] },
    ],
    nodeTooltips: {
      L1: 'Primer movimiento se busca secuencialmente para tener un bound',
      S1: 'La división en nivel 2 ofrece más tareas para distribuir',
    },
  },
  {
    id: 'adaptive-time',
    mermaidCode: `graph LR
      T["Tiempo Total"]
      F["Fase Juego"]
      C["Complejidad"]
      A["Tiempo Asignado"]
      O["Apertura: 5%"]
      M["Medio: 15%"]
      E["Final: 10%"]
      T --> A
      F --> A
      C --> A
      A --> O
      A --> M
      A --> E`,
    steps: [
      { description: 'El tiempo total restante se consulta cada turno', highlightNodes: ['T'] },
      { description: 'La fase del juego y complejidad de la posición influyen', highlightNodes: ['F', 'C'] },
      { description: 'Se asigna más tiempo en posiciones críticas del medio juego', highlightNodes: ['A', 'M'] },
      { description: 'Apertura y final usan menos tiempo (posiciones conocidas)', highlightNodes: ['O', 'E'] },
    ],
    nodeTooltips: {
      A: 'Fórmula: base × factor_fase × factor_complejidad',
      M: 'Posiciones tácticas complejas reciben más tiempo',
    },
  },
  {
    id: 'runtime-config',
    mermaidCode: `graph LR
      CFG["Configuración"]
      D["Profundidad: 8"]
      TT["TT Size: 256MB"]
      W["Workers: 4"]
      P["Pesos IA"]
      E["Engine"]
      CFG --> D
      CFG --> TT
      CFG --> W
      CFG --> P
      D & TT & W & P --> E`,
    steps: [
      { description: 'Configuración centralizada para todos los parámetros del motor', highlightNodes: ['CFG'] },
      { description: 'Profundidad de búsqueda, tamaño de tabla, workers', highlightNodes: ['D', 'TT', 'W'] },
      { description: 'Pesos de evaluación ajustables sin recompilar', highlightNodes: ['P'] },
      { description: 'El engine consume la config y se adapta dinámicamente', highlightNodes: ['E'] },
    ],
    nodeTooltips: {
      CFG: 'JSON/YAML que se puede modificar sin tocar código',
      D: 'Más profundidad = juego más fuerte pero más lento',
    },
  },
];
