import type { Concept } from '../types';

export const testingConcepts: Concept[] = [
  {
    id: 'search-testing',
    term: 'Search Algorithm Testing',
    termEs: 'Testing de Algoritmos de Búsqueda',
    category: 'testing',
    definition:
      'Framework de tests que valida algoritmos de búsqueda usando posiciones predefinidas con movimiento esperado conocido, midiendo correctitud y tiempo de ejecución.',
    keyPoints: [
      'Posiciones con solución conocida (ej: mate en 2)',
      'Valida movimiento exacto + tiempo límite',
      'Suite completa con casos tácticos y estratégicos',
    ],
    relatedConcepts: ['evaluation-testing', 'performance-benchmark'],
    difficulty: 1,
  },
  {
    id: 'evaluation-testing',
    term: 'Evaluation Function Testing',
    termEs: 'Testing de Funciones de Evaluación',
    category: 'testing',
    definition:
      'Tests que verifican la evaluación numérica de posiciones contra valores esperados con tolerancia configurable. Miden error promedio, máximo y por posición.',
    keyPoints: [
      'Posiciones con score esperado + tolerancia',
      'Métricas: error promedio, error máximo',
      'Valida coherencia (posición ganadora > posición perdedora)',
    ],
    relatedConcepts: ['search-testing'],
    difficulty: 1,
  },
  {
    id: 'game-integration-test',
    term: 'Game Integration Testing',
    termEs: 'Testing de Integración End-to-End',
    category: 'testing',
    definition:
      'Simulación de partidas completas donde la IA juega contra sí misma, validando que todos los movimientos son legales, midiendo tiempos y verificando que el juego termina correctamente.',
    keyPoints: [
      'Ejecuta partidas completas IA vs IA',
      'Valida legalidad de cada movimiento',
      'Mide tiempo promedio y máximo por movimiento',
    ],
    relatedConcepts: ['elo-rating', 'performance-benchmark'],
    difficulty: 2,
  },
  {
    id: 'performance-benchmark',
    term: 'Performance Benchmark Suite',
    termEs: 'Suite de Benchmarks de Rendimiento',
    category: 'testing',
    definition:
      'Conjunto de benchmarks que miden nodes/segundo, tiempo por profundidad, tasa de hit de transposition table y rendimiento de evaluación para detectar regresiones.',
    keyPoints: [
      'Mide NPS (nodos por segundo) por profundidad',
      'Mide tasa de acierto de transposition table',
      'Benchmark de evaluaciones por segundo',
    ],
    relatedConcepts: ['transposition-table', 'performance-monitor'],
    difficulty: 2,
  },
  {
    id: 'elo-rating',
    term: 'Elo Rating System',
    termEs: 'Sistema de Rating Elo',
    category: 'testing',
    definition:
      'Sistema estadístico para medir la fuerza relativa de diferentes versiones de IA mediante torneos. Calcula rating esperado y actualiza con factor K basado en resultados reales.',
    keyPoints: [
      'Rating esperado: 1/(1 + 10^((Rb-Ra)/400))',
      'Actualización: Ra + K × (resultado - esperado)',
      'Torneo round-robin entre diferentes configuraciones',
    ],
    relatedConcepts: ['game-integration-test'],
    difficulty: 2,
  },
  {
    id: 'performance-monitor',
    term: 'Performance Monitor',
    termEs: 'Monitor de Rendimiento',
    category: 'testing',
    definition:
      'Sistema de monitoreo que recolecta métricas en tiempo real: tiempos de búsqueda, nodos explorados, uso de memoria y tasa de hit de TT. Genera reportes estadísticos.',
    keyPoints: [
      'Métricas: min, max, media, mediana por operación',
      'Mantiene últimos 1000 valores por métrica',
      'Reporta NPS, TT hit rate y uso de memoria',
    ],
    relatedConcepts: ['performance-benchmark'],
    difficulty: 2,
  },
];
