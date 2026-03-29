import type { Concept } from '../types';

export const searchAlgorithms: Concept[] = [
  {
    id: 'minimax',
    term: 'Minimax',
    termEs: 'Minimax',
    category: 'search-algorithms',
    definition:
      'Algoritmo de decisión recursiva para juegos de suma cero de dos jugadores. Explora todo el árbol de juego hasta la profundidad especificada, asumiendo juego óptimo de ambos jugadores.',
    keyPoints: [
      'Explora todo el árbol de juego hasta profundidad especificada',
      'Asume juego óptimo de ambos jugadores',
      'Complejidad exponencial: O(b^d)',
    ],
    relatedConcepts: ['alpha-beta', 'negamax'],
    difficulty: 1,
  },
  {
    id: 'alpha-beta',
    term: 'Alpha-Beta Pruning',
    termEs: 'Poda Alpha-Beta',
    category: 'search-algorithms',
    definition:
      'Optimización de minimax que elimina ramas que no influirán en la decisión final, reduciendo la complejidad de O(b^d) a O(b^(d/2)) y permitiendo búsquedas mucho más profundas.',
    keyPoints: [
      'Reduce complejidad de O(b^d) a O(b^(d/2))',
      'Permite búsquedas mucho más profundas',
      'Crítico para rendimiento en tiempo real',
    ],
    relatedConcepts: ['minimax', 'negamax'],
    difficulty: 1,
  },
  {
    id: 'negamax',
    term: 'Negamax',
    termEs: 'Negamax',
    category: 'search-algorithms',
    definition:
      'Variante de minimax que simplifica el código usando cambio de perspectiva. Usa una función única (multiplicando por -1) en lugar de dos ramas separadas para maximizar y minimizar.',
    keyPoints: [
      'Código más limpio con función única',
      'Usa multiplicación por -1 para cambio de perspectiva',
      'Más fácil de mantener que minimax estándar',
    ],
    relatedConcepts: ['minimax', 'alpha-beta'],
    difficulty: 2,
  },
  {
    id: 'iterative-deepening',
    term: 'Iterative Deepening',
    termEs: 'Profundización Iterativa',
    category: 'search-algorithms',
    definition:
      'Búsqueda progresiva por profundidad con gestión de tiempo. Incrementa la profundidad en cada iteración, garantizando siempre tener un movimiento disponible y adaptándose al tiempo restante.',
    keyPoints: [
      'Siempre tiene un movimiento disponible',
      'Mejora ordenamiento de movimientos para búsquedas más profundas',
      'Se adapta al tiempo disponible',
    ],
    relatedConcepts: ['alpha-beta', 'adaptive-time'],
    difficulty: 2,
  },
  {
    id: 'quiescence-search',
    term: 'Quiescence Search',
    termEs: 'Búsqueda de Quiescencia',
    category: 'search-algorithms',
    definition:
      'Extensión de búsqueda que solo explora movimientos tácticos (capturas, promociones, jaques) cuando la búsqueda normal llega a profundidad cero, para evitar el "horizon effect" donde la IA ignora amenazas inminentes.',
    keyPoints: [
      'Evita el "horizon effect"',
      'Solo explora movimientos tácticos en profundidad cero',
      'Mejora la precisión de la evaluación en posiciones inestables',
    ],
    relatedConcepts: ['alpha-beta', 'iterative-deepening'],
    difficulty: 3,
  },
  {
    id: 'bfs-pathfinding',
    term: 'BFS Pathfinding',
    termEs: 'Búsqueda en Anchura (BFS)',
    category: 'search-algorithms',
    definition:
      'Algoritmo de Búsqueda en Anchura que explora el tablero nivel por nivel para encontrar el camino más corto desde la posición actual del peón hasta la meta, considerando obstáculos colocados.',
    keyPoints: [
      'Explora nivel por nivel garantizando camino más corto',
      'Crucial para evaluar efectividad de paredes en Quoridor',
      'Complejidad O(V + E) donde V son vértices y E aristas',
    ],
    relatedConcepts: ['wall-merit'],
    difficulty: 1,
  },
];
