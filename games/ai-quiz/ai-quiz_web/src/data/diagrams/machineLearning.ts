import type { DiagramSpec } from './types';

export const machineLearningDiagrams: DiagramSpec[] = [
  {
    id: 'neural-network-eval',
    mermaidCode: `graph LR
      I1["Pieza 1"]
      I2["Pieza 2"]
      I3["Pieza N"]
      H1["H1"]
      H2["H2"]
      H3["H3"]
      H4["H4"]
      O["Score"]
      I1 --> H1
      I1 --> H2
      I2 --> H2
      I2 --> H3
      I3 --> H3
      I3 --> H4
      H1 --> O
      H2 --> O
      H3 --> O
      H4 --> O
      style O fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'Features de entrada: posición de cada pieza en el tablero', highlightNodes: ['I1', 'I2', 'I3'] },
      { description: 'Capa oculta: neuronas aprenden patrones posicionales', highlightNodes: ['H1', 'H2', 'H3', 'H4'] },
      { description: 'Salida: un único score que evalúa la posición', highlightNodes: ['O'] },
    ],
    nodeTooltips: {
      I1: 'Input: codificación one-hot de piezas y posiciones',
      H1: 'Neurona con pesos aprendidos durante entrenamiento',
      O: 'Score continuo: positivo = ventaja, negativo = desventaja',
    },
  },
  {
    id: 'reinforcement-learning',
    mermaidCode: `graph TD
      A["Agente (IA)"]
      E["Entorno (Juego)"]
      S["Estado"]
      Ac["Acción"]
      R["Recompensa"]
      A -->|"elige"| Ac
      Ac -->|"ejecuta"| E
      E -->|"nuevo"| S
      E -->|"+1/0/−1"| R
      S -->|"observa"| A
      R -->|"aprende"| A`,
    steps: [
      { description: 'El agente (IA) observa el estado actual del juego', highlightNodes: ['A', 'S'] },
      { description: 'Elige y ejecuta una acción (movimiento)', highlightNodes: ['Ac'] },
      { description: 'El entorno responde con nuevo estado y recompensa', highlightNodes: ['E', 'R'] },
      { description: 'El agente ajusta su política basándose en la recompensa', highlightNodes: ['A'] },
    ],
    nodeTooltips: {
      A: 'El agente mejora su policy con cada iteración',
      R: '+1 victoria, 0 empate, -1 derrota',
      E: 'El juego con sus reglas actúa como entorno',
    },
  },
  {
    id: 'self-play',
    mermaidCode: `graph TD
      M["Modelo Actual"]
      P1["Juega como J1"]
      P2["Juega como J2"]
      G["Partidas"]
      D["Datos Entrenamiento"]
      M2["Modelo Mejorado"]
      M --> P1
      M --> P2
      P1 & P2 --> G
      G -->|"posiciones + resultados"| D
      D -->|"entrenar"| M2
      M2 -->|"reemplaza"| M
      style M2 fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'El modelo actual juega contra sí mismo en ambos roles', highlightNodes: ['M', 'P1', 'P2'] },
      { description: 'Genera miles de partidas con posiciones diversas', highlightNodes: ['G'] },
      { description: 'Las posiciones y resultados forman datos de entrenamiento', highlightNodes: ['D'] },
      { description: 'Se entrena un modelo mejorado que reemplaza al anterior', highlightNodes: ['M2'] },
    ],
    nodeTooltips: {
      M: 'Mismo modelo juega ambos lados para exploración',
      G: 'Miles de partidas generan millones de posiciones',
      M2: 'Solo reemplaza al anterior si demuestra ser mejor',
    },
  },
  {
    id: 'epsilon-greedy',
    mermaidCode: `graph TD
      D{"Random < ε?"}
      EX["🎲 Explorar"]
      GR["🎯 Explotar"]
      R["Mov. Aleatorio"]
      B["Mejor Mov. Conocido"]
      D -->|"sí (ε%)"| EX
      D -->|"no (1−ε%)"| GR
      EX --> R
      GR --> B
      style EX fill:#713f12,stroke:#eab308
      style GR fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'En cada turno se decide: ¿explorar o explotar?', highlightNodes: ['D'] },
      { description: 'Con probabilidad ε: movimiento aleatorio (exploración)', highlightNodes: ['EX', 'R'] },
      { description: 'Con probabilidad 1−ε: mejor movimiento conocido (explotación)', highlightNodes: ['GR', 'B'] },
      { description: 'ε decrece con el tiempo: más explotación al aprender', highlightNodes: ['D'] },
    ],
    nodeTooltips: {
      EX: 'Exploración: descubrir nuevas estrategias',
      GR: 'Explotación: usar lo mejor que ya sabemos',
      D: 'ε típico: 10% al inicio, 1% después de muchas partidas',
    },
  },
  {
    id: 'hybrid-evaluator',
    mermaidCode: `graph TD
      POS["Posición"]
      HE["Eval Heurística"]
      NE["Eval Neural"]
      BL["Blender"]
      PH{"Fase?"}
      S["Score Final"]
      POS --> HE
      POS --> NE
      HE --> BL
      NE --> BL
      PH --> BL
      BL --> S
      style BL fill:#1e1b4b,stroke:#818cf8`,
    steps: [
      { description: 'La posición se evalúa por dos sistemas en paralelo', highlightNodes: ['POS'] },
      { description: 'Evaluación heurística: rápida, basada en reglas conocidas', highlightNodes: ['HE'] },
      { description: 'Evaluación neural: más precisa, basada en aprendizaje', highlightNodes: ['NE'] },
      { description: 'El blender mezcla ambas según la fase del juego', highlightNodes: ['BL', 'PH', 'S'] },
    ],
    nodeTooltips: {
      HE: 'Eval clásica: material, posición, movilidad',
      NE: 'Red neuronal entrenada con self-play',
      BL: 'Score = α×heurística + (1−α)×neural, α según fase',
    },
  },
  {
    id: 'evaluation-tapering',
    mermaidCode: `graph LR
      MG["Score Medio Juego"]
      EG["Score Final"]
      PH["Fase (0..256)"]
      T["Tapering"]
      S["Score Final"]
      MG -->|"×fase"| T
      EG -->|"×(256−fase)"| T
      PH --> T
      T -->|"÷256"| S`,
    steps: [
      { description: 'Se calculan dos scores: medio juego y final', highlightNodes: ['MG', 'EG'] },
      { description: 'La fase (0=final, 256=apertura) determina la mezcla', highlightNodes: ['PH'] },
      { description: 'Tapering hace transición suave entre ambas evaluaciones', highlightNodes: ['T'] },
      { description: 'Score = (MG×fase + EG×(256−fase)) / 256', highlightNodes: ['S'] },
    ],
    nodeTooltips: {
      MG: 'Evaluación optimizada para posiciones con muchas piezas',
      EG: 'Evaluación optimizada para finales (rey activo, peones)',
      T: 'Transición gradual evita saltos bruscos entre fases',
    },
  },
];
