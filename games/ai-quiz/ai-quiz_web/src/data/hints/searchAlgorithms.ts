import type { HelpSpec } from './types';

export const searchAlgorithmHints: HelpSpec[] = [
  {
    id: 'minimax',
    glossary: [
      { term: 'Juego de suma cero', explanation: 'Juego donde la ganancia de un jugador es exactamente la pérdida del otro.' },
      { term: 'Árbol de juego', explanation: 'Estructura que representa todas las posibles secuencias de movimientos desde una posición.' },
      { term: 'Profundidad', explanation: 'Número de movimientos hacia adelante que el algoritmo analiza.' },
      { term: 'Juego óptimo', explanation: 'Asumir que ambos jugadores siempre eligen la mejor jugada posible.' },
    ],
    context: 'En teoría de juegos, los algoritmos de búsqueda exploran las posibles jugadas futuras para tomar decisiones.',
  },
  {
    id: 'alpha-beta',
    glossary: [
      { term: 'Poda', explanation: 'Proceso de descartar ramas del árbol de búsqueda que no afectan el resultado final.' },
      { term: 'Ramas', explanation: 'Cada posible movimiento desde una posición del juego.' },
      { term: 'Complejidad O(b^d)', explanation: 'Notación que describe cuántas posiciones se evalúan, donde b son las ramas y d la profundidad.' },
      { term: 'Tiempo real', explanation: 'Capacidad de dar una respuesta dentro de un tiempo aceptable para el jugador.' },
    ],
    context: 'Las optimizaciones de búsqueda buscan reducir el número de posiciones evaluadas sin perder calidad de decisión.',
  },
  {
    id: 'negamax',
    glossary: [
      { term: 'Cambio de perspectiva', explanation: 'Técnica donde se evalúa la posición desde el punto de vista del jugador activo.' },
      { term: 'Multiplicación por -1', explanation: 'Operación que invierte la evaluación: lo bueno para un jugador es malo para el otro.' },
      { term: 'Maximizar/Minimizar', explanation: 'Los dos jugadores buscan, respectivamente, maximizar y minimizar la puntuación.' },
    ],
    context: 'En juegos de dos jugadores, lo que beneficia a uno perjudica al otro, lo que permite simplificaciones en el código.',
  },
  {
    id: 'iterative-deepening',
    glossary: [
      { term: 'Búsqueda progresiva', explanation: 'Estrategia que comienza con búsquedas cortas y va profundizando gradualmente.' },
      { term: 'Profundidad', explanation: 'Número de jugadas futuras que se analizan.' },
      { term: 'Tiempo restante', explanation: 'Reloj de juego que limita cuánto puede pensar la IA.' },
      { term: 'Ordenamiento de movimientos', explanation: 'Organizar los movimientos por probabilidad de ser buenos antes de buscar.' },
    ],
    context: 'La gestión de tiempo es crucial en juegos con reloj: mejor una respuesta aceptable que quedarse sin tiempo buscando la perfecta.',
  },
  {
    id: 'quiescence-search',
    glossary: [
      { term: 'Horizon effect', explanation: 'Fenómeno donde la IA no detecta una amenaza porque cae justo después de su límite de profundidad.' },
      { term: 'Movimientos tácticos', explanation: 'Jugadas de acción directa como capturas, promociones o jaques.' },
      { term: 'Profundidad cero', explanation: 'El punto donde la búsqueda normal deja de profundizar.' },
      { term: 'Posiciones inestables', explanation: 'Situaciones del tablero donde hay intercambios o amenazas activas.' },
    ],
    context: 'Las posiciones con acción táctica activa requieren análisis adicional más allá del límite normal de profundidad.',
  },
  {
    id: 'bfs-pathfinding',
    glossary: [
      { term: 'Búsqueda en Anchura', explanation: 'Exploración que visita todos los vecinos de un nodo antes de pasar al siguiente nivel.' },
      { term: 'Nivel por nivel', explanation: 'Explorar primero todas las posiciones a distancia 1, luego a distancia 2, etc.' },
      { term: 'Camino más corto', explanation: 'La ruta que requiere el menor número de pasos entre dos puntos.' },
      { term: 'Obstáculos', explanation: 'Elementos del tablero que bloquean ciertos caminos.' },
    ],
    context: 'Los algoritmos de caminos sirven para calcular distancias y rutas óptimas en un tablero con restricciones.',
  },
];
