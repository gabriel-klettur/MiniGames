import type { DiagramSpec } from './types';

export const evaluationDiagrams: DiagramSpec[] = [
  {
    id: 'multi-component-eval',
    mermaidCode: `graph LR
      P["Posición"]
      M["Material"]
      Po["Posición"]
      Mo["Movilidad"]
      St["Estructura"]
      W["Pesos"]
      S["Score Final"]
      P --> M
      P --> Po
      P --> Mo
      P --> St
      M -->|"w₁"| W
      Po -->|"w₂"| W
      Mo -->|"w₃"| W
      St -->|"w₄"| W
      W --> S`,
    steps: [
      { description: 'La posición se analiza desde múltiples perspectivas', highlightNodes: ['P'] },
      { description: 'Cada componente evalúa un aspecto: material, posición, movilidad, estructura', highlightNodes: ['M', 'Po', 'Mo', 'St'] },
      { description: 'Los pesos determinan la importancia relativa de cada componente', highlightNodes: ['W'] },
      { description: 'Score final = Σ(componente × peso)', highlightNodes: ['S'] },
    ],
    nodeTooltips: {
      M: 'Cuenta de piezas y su valor relativo',
      Mo: 'Número de movimientos legales disponibles',
      W: 'Pesos ajustados por fase de juego o aprendizaje',
    },
  },
  {
    id: 'phase-based-eval',
    mermaidCode: `graph TD
      G["Estado del Juego"]
      O["🟢 Apertura"]
      M["🟡 Medio Juego"]
      E["🔴 Final"]
      WO["Pesos Apertura"]
      WM["Pesos Medio"]
      WE["Pesos Final"]
      G --> O
      G --> M
      G --> E
      O --> WO
      M --> WM
      E --> WE
      style O fill:#065f46,stroke:#10b981
      style M fill:#713f12,stroke:#eab308
      style E fill:#7f1d1d,stroke:#ef4444`,
    steps: [
      { description: 'El juego se clasifica en fases según piezas restantes', highlightNodes: ['G'] },
      { description: 'Apertura: prioriza desarrollo y control del centro', highlightNodes: ['O', 'WO'] },
      { description: 'Medio juego: balancea ataque, defensa y tácticas', highlightNodes: ['M', 'WM'] },
      { description: 'Final: prioriza actividad del rey y promoción de peones', highlightNodes: ['E', 'WE'] },
    ],
    nodeTooltips: {
      O: 'Fase inicial: muchas piezas en el tablero',
      M: 'Fase intermedia: juego táctico y estratégico',
      E: 'Fase final: pocas piezas, el rey se activa',
    },
  },
  {
    id: 'fusion-evaluation',
    mermaidCode: `graph TD
      I["Fusiones Inmediatas"]
      P["Fusiones Potenciales"]
      C["Fusiones en Cadena"]
      FW["Pesos Fusión"]
      S["Score Fusión Total"]
      I -->|"×3.0"| FW
      P -->|"×1.5"| FW
      C -->|"×2.0"| FW
      FW --> S`,
    steps: [
      { description: 'Evalúa fusiones inmediatas: colocaciones que fusionan ya', highlightNodes: ['I'] },
      { description: 'Fusiones potenciales: posiciones que podrían fusionarse en 1-2 turnos', highlightNodes: ['P'] },
      { description: 'Fusiones en cadena: una fusión que habilita otra posterior', highlightNodes: ['C'] },
      { description: 'Cada tipo se pondera y suma al score total', highlightNodes: ['FW', 'S'] },
    ],
    nodeTooltips: {
      I: 'Fusión que ocurre inmediatamente al colocar pieza (Pylos)',
      P: 'Posición a 1-2 movimientos de completar un cuadrado',
      C: 'Cadena: fusionar libera piezas que permiten otra fusión',
    },
  },
  {
    id: '12-signal-system',
    mermaidCode: `graph TD
      subgraph Señales
        S1["Distancia propia"]
        S2["Distancia rival"]
        S3["Bloqueos propios"]
        S4["Bloqueos rivales"]
        S5["Progreso"]
        S6["Colisiones"]
      end
      subgraph "6 más"
        S7["Recuperación"]
        S8["Amenazas"]
        S9["Control centro"]
        S10["Movilidad"]
        S11["Tempo"]
        S12["Seguridad"]
      end
      A["Aggregación Ponderada"]
      S1 & S2 & S3 & S4 & S5 & S6 --> A
      S7 & S8 & S9 & S10 & S11 & S12 --> A`,
    steps: [
      { description: '12 señales capturan cada aspecto de la posición en Squadro', highlightNodes: ['S1', 'S2'] },
      { description: 'Señales de bloqueo: cuántas piezas están obstruidas', highlightNodes: ['S3', 'S4'] },
      { description: 'Señales dinámicas: progreso, colisiones, recuperación', highlightNodes: ['S5', 'S6', 'S7'] },
      { description: 'Señales estratégicas: amenazas, control, movilidad, tempo', highlightNodes: ['S8', 'S9', 'S10', 'S11'] },
      { description: 'Todas se agregan con pesos en un score único', highlightNodes: ['A'] },
    ],
    nodeTooltips: {
      S1: 'Distancia total de tus piezas a la meta',
      S6: 'Posibilidad de colisión con piezas rivales',
      A: 'Suma ponderada de las 12 señales',
    },
  },
  {
    id: 'wall-merit',
    mermaidCode: `graph LR
      W["Pared Candidata"]
      ER["Efecto Rival"]
      EP["Efecto Propio"]
      D["Δ Distancia"]
      M["Mérito Neto"]
      W --> ER
      W --> EP
      ER -->|"+Δ rival"| D
      EP -->|"−Δ propio"| D
      D --> M
      style M fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'Para cada posible colocación de pared en Quoridor...', highlightNodes: ['W'] },
      { description: 'Calcula cuánto alarga el camino del rival (+Δ rival)', highlightNodes: ['ER'] },
      { description: 'Calcula cuánto alarga tu propio camino (−Δ propio)', highlightNodes: ['EP'] },
      { description: 'Mérito neto = beneficio al rival − coste propio', highlightNodes: ['D', 'M'] },
    ],
    nodeTooltips: {
      W: 'Pared que se evalúa antes de colocarla',
      ER: 'BFS mide el incremento de distancia del rival',
      EP: 'BFS mide el incremento de distancia propia',
      M: 'Valor positivo = pared ventajosa',
    },
  },
  {
    id: 'recovery-evaluation',
    mermaidCode: `graph TD
      C["Pieza Capturada"]
      R1["¿Puede recuperar?"]
      R2["Turnos para recuperar"]
      R3["Piezas rivales bloqueadas"]
      S["Score Recuperación"]
      C --> R1
      R1 -->|"sí"| R2
      R1 -->|"no"| S
      R2 --> S
      R3 --> S
      style C fill:#7f1d1d,stroke:#ef4444`,
    steps: [
      { description: 'Una pieza es capturada (retrocede en Squadro)', highlightNodes: ['C'] },
      { description: '¿Puede recuperar la posición perdida rápidamente?', highlightNodes: ['R1'] },
      { description: 'Evalúa turnos necesarios y bloqueos que genera al volver', highlightNodes: ['R2', 'R3'] },
      { description: 'A veces ser capturado es ventajoso si genera bloqueos', highlightNodes: ['S'] },
    ],
    nodeTooltips: {
      C: 'Pieza que retrocede al inicio de su fila/columna',
      R2: 'Menos turnos = recuperación más viable',
    },
  },
  {
    id: 'collision-chain',
    mermaidCode: `graph LR
      M["Movimiento"]
      C1["Colisión 1"]
      C2["Colisión 2"]
      C3["Colisión 3"]
      V["Valor Cadena"]
      M -->|"captura"| C1
      C1 -->|"retrocede"| C2
      C2 -->|"bloquea"| C3
      C3 --> V
      style V fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'Un movimiento genera una colisión directa', highlightNodes: ['M', 'C1'] },
      { description: 'La pieza capturada retrocede y colisiona con otra', highlightNodes: ['C2'] },
      { description: 'Efecto dominó: tercera colisión en cadena', highlightNodes: ['C3'] },
      { description: 'El valor total de la cadena amplifica el score del movimiento', highlightNodes: ['V'] },
    ],
    nodeTooltips: {
      M: 'Movimiento original que inicia la cadena',
      C1: 'Primera colisión directa con pieza rival',
      C3: 'Las cadenas largas son raras pero muy valiosas',
    },
  },
];
