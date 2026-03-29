import type { DiagramSpec } from './types';

export const dataStructureDiagrams: DiagramSpec[] = [
  {
    id: 'bitboards',
    mermaidCode: `graph TD
      B["Bitboard 64 bits"]
      R1["Fila 1: 1 0 1 1 0 0 1 0"]
      R2["Fila 2: 0 1 0 0 1 1 0 0"]
      OP["Operaciones Bitwise"]
      AND["AND → Intersección"]
      OR["OR → Unión"]
      XOR["XOR → Diferencia"]
      B --> R1
      B --> R2
      R1 & R2 --> OP
      OP --> AND
      OP --> OR
      OP --> XOR`,
    steps: [
      { description: 'Un bitboard usa 64 bits para representar un tablero 8×8', highlightNodes: ['B'] },
      { description: 'Cada bit indica presencia (1) o ausencia (0) de una pieza', highlightNodes: ['R1', 'R2'] },
      { description: 'Operaciones bitwise procesan el tablero completo en 1 instrucción', highlightNodes: ['OP'] },
      { description: 'AND: intersección, OR: unión, XOR: diferencia simétrica', highlightNodes: ['AND', 'OR', 'XOR'] },
    ],
    nodeTooltips: {
      B: 'Un entero de 64 bits = un tablero completo',
      AND: 'piezas_blancas AND atacadas = piezas blancas bajo ataque',
      XOR: 'Útil para Zobrist hashing incremental',
    },
  },
  {
    id: 'object-pool',
    mermaidCode: `graph LR
      P["Object Pool"]
      A["Activo 1"]
      A2["Activo 2"]
      F["Free List"]
      F1["Libre 1"]
      F2["Libre 2"]
      REQ["Solicitar"]
      RET["Devolver"]
      REQ -->|"O(1)"| P
      P --> A
      P --> A2
      P --> F
      F --> F1
      F --> F2
      RET -->|"O(1)"| F
      style F fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'El pool pre-asigna objetos para evitar allocaciones en runtime', highlightNodes: ['P'] },
      { description: 'Objetos activos están en uso durante la búsqueda', highlightNodes: ['A', 'A2'] },
      { description: 'Objetos libres esperan en una free list para reutilización', highlightNodes: ['F', 'F1', 'F2'] },
      { description: 'Solicitar y devolver: O(1), sin garbage collection', highlightNodes: ['REQ', 'RET'] },
    ],
    nodeTooltips: {
      P: 'Elimina la latencia de malloc/new durante búsqueda',
      F: 'Lista enlazada de objetos disponibles',
      REQ: 'Pop del free list, mucho más rápido que new',
    },
  },
  {
    id: 'simd-operations',
    mermaidCode: `graph TD
      D["Datos: 4 posiciones"]
      V["Vector SIMD (128-bit)"]
      P1["Pos 1: 32b"]
      P2["Pos 2: 32b"]
      P3["Pos 3: 32b"]
      P4["Pos 4: 32b"]
      OP["1 Instrucción"]
      R["4 Resultados"]
      D --> V
      V --> P1
      V --> P2
      V --> P3
      V --> P4
      P1 & P2 & P3 & P4 -->|"paralelo"| OP
      OP --> R
      style OP fill:#065f46,stroke:#10b981`,
    steps: [
      { description: '4 datos se empaquetan en un registro SIMD de 128 bits', highlightNodes: ['D', 'V'] },
      { description: 'Cada dato ocupa 32 bits del registro vectorial', highlightNodes: ['P1', 'P2', 'P3', 'P4'] },
      { description: 'Una sola instrucción procesa los 4 en paralelo', highlightNodes: ['OP'] },
      { description: 'Throughput 4× mayor que procesamiento escalar', highlightNodes: ['R'] },
    ],
    nodeTooltips: {
      V: 'SIMD: Single Instruction, Multiple Data',
      OP: 'Suma, resta, comparación, etc. en 1 ciclo para 4 valores',
    },
  },
];
