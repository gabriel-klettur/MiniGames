import type { Concept } from '../types';

export const optimizationConcepts: Concept[] = [
  {
    id: 'transposition-table',
    term: 'Transposition Table',
    termEs: 'Tabla de Transposición',
    category: 'optimization',
    definition:
      'Estructura de datos que cachea resultados de posiciones ya evaluadas para evitar recálculo. Usa hashing para identificar posiciones idénticas alcanzadas por diferentes secuencias de movimientos.',
    keyPoints: [
      'Cachea evaluaciones para evitar trabajo redundante',
      'Identifica transposiciones (misma posición, diferente camino)',
      'Usa flags EXACT, ALPHA, BETA para tipo de resultado',
    ],
    relatedConcepts: ['zobrist-hashing', 'age-based-replacement'],
    difficulty: 2,
  },
  {
    id: 'zobrist-hashing',
    term: 'Zobrist Hashing',
    termEs: 'Hashing Zobrist',
    category: 'optimization',
    definition:
      'Técnica de hashing eficiente que genera claves únicas para posiciones de tablero usando XOR de números aleatorios pre-generados. Permite identificar rápidamente posiciones idénticas sin comparar todo el estado.',
    keyPoints: [
      'Usa operaciones XOR con números aleatorios pre-generados',
      'Permite actualización incremental del hash (muy eficiente)',
      'Cada pieza en cada posición tiene un número aleatorio único',
    ],
    relatedConcepts: ['transposition-table'],
    difficulty: 2,
  },
  {
    id: 'killer-moves',
    term: 'Killer Moves',
    termEs: 'Movimientos Asesinos',
    category: 'optimization',
    definition:
      'Movimientos que causaron podas de beta (cutoffs) en niveles anteriores del árbol de búsqueda. Se guardan porque tienden a ser buenos movimientos en posiciones similares del mismo nivel.',
    keyPoints: [
      'Almacenan los 2 mejores movimientos por nivel (ply)',
      'Movimientos que causaron cutoffs en el mismo nivel',
      'Mejoran el ordenamiento de movimientos significativamente',
    ],
    relatedConcepts: ['history-heuristic', 'move-ordering'],
    difficulty: 2,
  },
  {
    id: 'history-heuristic',
    term: 'History Heuristic',
    termEs: 'Heurística de Historia',
    category: 'optimization',
    definition:
      'Técnica que registra qué movimientos han sido históricamente buenos en posiciones similares, asignando mayor prioridad a movimientos que han producido buenas evaluaciones anteriormente.',
    keyPoints: [
      'Registra éxitos de movimientos ponderados por depth²',
      'Mejora ordenamiento para podas más eficientes',
      'Complementa a killer moves con información global',
    ],
    relatedConcepts: ['killer-moves', 'move-ordering'],
    difficulty: 2,
  },
  {
    id: 'move-ordering',
    term: 'Move Ordering',
    termEs: 'Ordenamiento de Movimientos',
    category: 'optimization',
    definition:
      'Estrategia de ordenar movimientos antes de buscarlos para maximizar podas alpha-beta. Prioriza: movimiento TT, movimientos tácticos (capturas), killer moves y history heuristic.',
    keyPoints: [
      'Prioridad: TT move > capturas > killer moves > history',
      'Usa MVV-LVA para ordenar movimientos tácticos',
      'Mejor ordenamiento = más podas = búsqueda más rápida',
    ],
    relatedConcepts: ['killer-moves', 'history-heuristic', 'mvv-lva'],
    difficulty: 2,
  },
  {
    id: 'mvv-lva',
    term: 'MVV-LVA',
    termEs: 'Víctima Más Valiosa - Atacante Menos Valioso',
    category: 'optimization',
    definition:
      'Most Valuable Victim - Least Valuable Attacker. Heurística que prioriza capturas donde se captura la pieza más valiosa con la pieza menos valiosa para optimizar la predicción de branches.',
    keyPoints: [
      'Prioriza capturar piezas valiosas con piezas baratas',
      'Mejora predicción de branches del procesador',
      'Separa movimientos tácticos de normales para mejor predicción',
    ],
    relatedConcepts: ['move-ordering'],
    difficulty: 3,
  },
  {
    id: 'age-based-replacement',
    term: 'Age-Based Replacement',
    termEs: 'Reemplazo Basado en Edad',
    category: 'optimization',
    definition:
      'Política de reemplazo en tablas de transposición que considera la edad de las entradas. Reemplaza si la entrada está vacía, la nueva tiene mayor profundidad, o la entrada actual es demasiado vieja.',
    keyPoints: [
      'Tres criterios: vacía, mayor profundidad, edad excesiva',
      'Actualiza edad en búsquedas exitosas (LRU approx)',
      'Mantiene entradas relevantes, descarta obsoletas',
    ],
    relatedConcepts: ['transposition-table'],
    difficulty: 3,
  },
];
