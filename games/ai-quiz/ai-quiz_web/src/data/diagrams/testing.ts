import type { DiagramSpec } from './types';

export const testingDiagrams: DiagramSpec[] = [
  {
    id: 'search-testing',
    mermaidCode: `graph LR
      P["Posición Conocida"]
      S["Search(pos, d)"]
      E["Movimiento Esperado"]
      C{"¿Coincide?"}
      OK["✅ Pass"]
      FAIL["❌ Fail"]
      P --> S
      S --> C
      E --> C
      C -->|"sí"| OK
      C -->|"no"| FAIL
      style OK fill:#065f46,stroke:#10b981
      style FAIL fill:#7f1d1d,stroke:#ef4444`,
    steps: [
      { description: 'Se prepara una posición con movimiento óptimo conocido', highlightNodes: ['P', 'E'] },
      { description: 'El motor ejecuta búsqueda a profundidad determinada', highlightNodes: ['S'] },
      { description: '¿El movimiento del motor coincide con el esperado?', highlightNodes: ['C'] },
      { description: 'Pass: la búsqueda es correcta. Fail: hay un bug', highlightNodes: ['OK', 'FAIL'] },
    ],
    nodeTooltips: {
      P: 'Posiciones de test extraídas de partidas reales o generadas',
      E: 'Movimiento verificado manualmente o por motor más fuerte',
    },
  },
  {
    id: 'evaluation-testing',
    mermaidCode: `graph TD
      P1["Posición Ventajosa"]
      P2["Posición Neutral"]
      P3["Posición Perdedora"]
      EV["eval()"]
      R1["Score > 0"]
      R2["Score ≈ 0"]
      R3["Score < 0"]
      P1 --> EV
      P2 --> EV
      P3 --> EV
      EV --> R1
      EV --> R2
      EV --> R3
      style R1 fill:#065f46,stroke:#10b981
      style R3 fill:#7f1d1d,stroke:#ef4444`,
    steps: [
      { description: 'Se preparan posiciones con evaluación conocida', highlightNodes: ['P1', 'P2', 'P3'] },
      { description: 'La función de evaluación se ejecuta en cada posición', highlightNodes: ['EV'] },
      { description: 'Ventajosa > 0, Neutral ≈ 0, Perdedora < 0', highlightNodes: ['R1', 'R2', 'R3'] },
    ],
    nodeTooltips: {
      EV: 'Función heurística que asigna score a posiciones',
      R2: 'Posición equilibrada debería dar score cercano a 0',
    },
  },
  {
    id: 'game-integration-test',
    mermaidCode: `graph LR
      S["Setup Juego"]
      L["Loop Turnos"]
      V["Validar Reglas"]
      AI["IA vs IA"]
      E{"¿Fin?"}
      R["Resultado Válido"]
      S --> L
      L --> V
      V --> AI
      AI --> E
      E -->|"no"| L
      E -->|"sí"| R`,
    steps: [
      { description: 'Se inicializa un juego completo con estado limpio', highlightNodes: ['S'] },
      { description: 'Cada turno se ejecuta y valida contra las reglas', highlightNodes: ['L', 'V'] },
      { description: 'Dos motores IA juegan partidas completas automáticamente', highlightNodes: ['AI'] },
      { description: 'Si llega al final sin errores, las reglas y la IA son correctas', highlightNodes: ['E', 'R'] },
    ],
    nodeTooltips: {
      V: 'Verifica movimientos legales, estado del tablero, fin de juego',
      AI: 'IA vs IA: miles de partidas para detectar bugs raros',
    },
  },
  {
    id: 'performance-benchmark',
    mermaidCode: `graph TD
      P["Posiciones Test"]
      B["Benchmark Suite"]
      NPS["Nodos/seg"]
      T["Tiempo/prof"]
      MEM["Memoria"]
      TT["TT Hit Rate"]
      REP["Reporte"]
      P --> B
      B --> NPS
      B --> T
      B --> MEM
      B --> TT
      NPS & T & MEM & TT --> REP`,
    steps: [
      { description: 'Set fijo de posiciones de test para mediciones consistentes', highlightNodes: ['P'] },
      { description: 'La suite mide múltiples métricas de rendimiento', highlightNodes: ['B'] },
      { description: 'Nodos/seg, tiempo por profundidad, memoria, hit rate de TT', highlightNodes: ['NPS', 'T', 'MEM', 'TT'] },
      { description: 'Reporte para comparar entre versiones del motor', highlightNodes: ['REP'] },
    ],
    nodeTooltips: {
      NPS: 'Nodos por segundo: capacidad de procesamiento',
      TT: 'Hit rate > 50% indica tabla de transposición efectiva',
    },
  },
  {
    id: 'elo-rating',
    mermaidCode: `graph LR
      V1["Motor V1: 1500"]
      V2["Motor V2: 1500"]
      M["1000 Partidas"]
      R["Nuevo Elo"]
      W["V2 gana 55%"]
      E["V2: ~1535 Elo"]
      V1 --> M
      V2 --> M
      M --> W
      W --> R
      R --> E
      style E fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'Dos versiones del motor comienzan con Elo igual', highlightNodes: ['V1', 'V2'] },
      { description: 'Juegan un torneo: cientos o miles de partidas', highlightNodes: ['M'] },
      { description: 'Si V2 gana el 55%, su Elo sube ~35 puntos', highlightNodes: ['W', 'E'] },
    ],
    nodeTooltips: {
      M: 'Más partidas = medición más fiable del Elo',
      E: 'Fórmula Elo: basada en resultados esperados vs reales',
    },
  },
  {
    id: 'performance-monitor',
    mermaidCode: `graph TD
      G["Partida en Curso"]
      MON["Monitor"]
      NPS["NPS en vivo"]
      D["Profundidad actual"]
      TT["TT uso %"]
      ALT["⚠ Alerta"]
      G --> MON
      MON --> NPS
      MON --> D
      MON --> TT
      NPS -->|"< umbral"| ALT
      style ALT fill:#713f12,stroke:#eab308`,
    steps: [
      { description: 'El monitor observa el motor durante la partida en tiempo real', highlightNodes: ['G', 'MON'] },
      { description: 'Métricas clave: NPS, profundidad alcanzada, uso de TT', highlightNodes: ['NPS', 'D', 'TT'] },
      { description: 'Si NPS cae bajo el umbral, genera una alerta', highlightNodes: ['ALT'] },
    ],
    nodeTooltips: {
      MON: 'Registra métricas sin afectar rendimiento del motor',
      ALT: 'Alerta temprana de regresión de rendimiento',
    },
  },
];
