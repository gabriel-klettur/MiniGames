import type { Concept } from '../types';

export const evaluationConcepts: Concept[] = [
  {
    id: 'multi-component-eval',
    term: 'Multi-Component Evaluation',
    termEs: 'Evaluación Multi-Componente',
    category: 'evaluation',
    definition:
      'Combina múltiples factores estratégicos (material, posicional, táctico, movilidad, potencial) en un solo puntaje ponderado para evaluar la calidad de una posición de juego.',
    keyPoints: [
      'Combina material, posición, táctica, movilidad y potencial',
      'Cada componente se multiplica por un peso configurable',
      'Fundamento de toda función de evaluación moderna',
    ],
    relatedConcepts: ['phase-based-eval', 'evaluation-tapering'],
    difficulty: 1,
  },
  {
    id: 'phase-based-eval',
    term: 'Phase-Based Evaluation',
    termEs: 'Evaluación Basada en Fases',
    category: 'evaluation',
    definition:
      'Ajusta los pesos de evaluación basados en la fase del juego (apertura, medio juego, final), reconociendo que la importancia relativa de cada factor cambia a lo largo de la partida.',
    keyPoints: [
      'Apertura: más peso posicional, menos táctico',
      'Medio juego: pesos equilibrados',
      'Final: más peso a material y potencial',
    ],
    relatedConcepts: ['multi-component-eval', 'evaluation-tapering'],
    difficulty: 2,
  },
  {
    id: 'fusion-evaluation',
    term: 'Fusion Evaluation',
    termEs: 'Evaluación de Fusión',
    category: 'evaluation',
    definition:
      'Sistema que analiza las oportunidades de fusionar piezas del mismo tipo y nivel en Soluna. Evalúa fusiones inmediatas, potenciales y en cadena, considerando impacto en control del tablero.',
    keyPoints: [
      'Evalúa fusiones inmediatas, potenciales y en cadena',
      'Calcula ventaja de altura entre jugadores',
      'Específico del juego Soluna',
    ],
    relatedConcepts: ['multi-component-eval'],
    difficulty: 2,
  },
  {
    id: '12-signal-system',
    term: '12-Signal Evaluation System',
    termEs: 'Sistema de Evaluación de 12 Señales',
    category: 'evaluation',
    definition:
      'Sistema de evaluación multi-factor sofisticado para Squadro que analiza 12 características distintas: race, done, clash, chain, sprint, block, parity, struct, ones, ret, waste y mob.',
    keyPoints: [
      'Analiza 12 señales: race, done, clash, chain, sprint, block, parity, struct, ones, ret, waste, mob',
      'Cada señal se combina con pesos específicos',
      'Diseñado específicamente para juegos de carrera asimétricos',
    ],
    relatedConcepts: ['multi-component-eval', 'collision-chain'],
    difficulty: 3,
  },
  {
    id: 'wall-merit',
    term: 'Wall Merit Function',
    termEs: 'Función de Mérito de Pared',
    category: 'evaluation',
    definition:
      'Algoritmo que evalúa cuán efectiva es una pared para bloquear al oponente en Quoridor. Considera el aumento en distancia del camino, si la pared está en una ruta crítica y su valor posicional.',
    keyPoints: [
      'Mide delta de distancia al colocar una pared',
      'Evalúa si la pared está en la ruta crítica del oponente',
      'Combina factores: distancia (70%), bloqueo (20%), posición (10%)',
    ],
    relatedConcepts: ['bfs-pathfinding'],
    difficulty: 2,
  },
  {
    id: 'recovery-evaluation',
    term: 'Recovery Evaluation',
    termEs: 'Evaluación de Recuperación',
    category: 'evaluation',
    definition:
      'Evalúa oportunidades de recuperación de piezas en Pylos: recuperaciones inmediatas (alto valor), futuras (menor valor) y amenazas del oponente (valor negativo).',
    keyPoints: [
      'Recuperación inmediata: +15 puntos por oportunidad',
      'Recuperación futura: +5 puntos',
      'Amenazas del oponente: -10 puntos',
    ],
    relatedConcepts: ['multi-component-eval', 'bitboards'],
    difficulty: 2,
  },
  {
    id: 'collision-chain',
    term: 'Collision Chain Analysis',
    termEs: 'Análisis de Cadena de Colisiones',
    category: 'evaluation',
    definition:
      'Algoritmo que analiza las reacciones en cadena cuando una pieza colisiona con otra en Squadro. Calcula colisiones inmediatas, secundarias y terciarias, evaluando el impacto táctico total.',
    keyPoints: [
      'Analiza colisiones directas y reacciones en cadena',
      'Calcula profundidad máxima de cadena',
      'Evalúa impacto total en ventaja posicional',
    ],
    relatedConcepts: ['12-signal-system'],
    difficulty: 3,
  },
];
