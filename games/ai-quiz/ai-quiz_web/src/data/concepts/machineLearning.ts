import type { Concept } from '../types';

export const machineLearningConcepts: Concept[] = [
  {
    id: 'neural-network-eval',
    term: 'Neural Network Evaluation',
    termEs: 'Evaluación con Red Neuronal',
    category: 'machine-learning',
    definition:
      'Uso de redes neuronales para evaluar posiciones de juego, aprendiendo patrones complejos de datos de entrenamiento que capturan matices que las funciones de evaluación tradicionales no detectan.',
    keyPoints: [
      'Aprende patrones de datos de entrenamiento',
      'Estado de juego convertido a tensor (one-hot encoding)',
      'Fallback a evaluación tradicional si el modelo falla',
    ],
    relatedConcepts: ['reinforcement-learning', 'hybrid-evaluator'],
    difficulty: 3,
  },
  {
    id: 'reinforcement-learning',
    term: 'Reinforcement Learning',
    termEs: 'Aprendizaje por Refuerzo',
    category: 'machine-learning',
    definition:
      'Paradigma de ML donde un agente aprende a tomar decisiones óptimas interactuando con un entorno, recibiendo recompensas o castigos y ajustando su estrategia para maximizar la recompensa acumulada.',
    keyPoints: [
      'Aprende por interacción con el entorno (trial and error)',
      'Maximiza recompensa acumulada a largo plazo',
      'Usa factor de descuento (gamma) para recompensas futuras',
    ],
    relatedConcepts: ['self-play', 'epsilon-greedy'],
    difficulty: 3,
  },
  {
    id: 'self-play',
    term: 'Self-Play Training',
    termEs: 'Entrenamiento por Auto-Juego',
    category: 'machine-learning',
    definition:
      'Método donde la IA juega contra sí misma para generar datos de entrenamiento. Almacena experiencias en un buffer, distribuye recompensas con descuento temporal y entrena periódicamente.',
    keyPoints: [
      'IA juega contra sí misma para generar experiencias',
      'Buffer de experiencia circular (100K entradas)',
      'Recompensas distribuidas con descuento temporal (γ=0.99)',
    ],
    relatedConcepts: ['reinforcement-learning', 'epsilon-greedy'],
    difficulty: 3,
  },
  {
    id: 'epsilon-greedy',
    term: 'Epsilon-Greedy Strategy',
    termEs: 'Estrategia Epsilon-Greedy',
    category: 'machine-learning',
    definition:
      'Estrategia de exploración que con probabilidad ε elige un movimiento aleatorio (exploración) y con probabilidad 1-ε elige el mejor movimiento según el modelo (explotación).',
    keyPoints: [
      'ε = probabilidad de exploración aleatoria',
      '1-ε = probabilidad de explotación del modelo',
      'Balance entre descubrir nuevas estrategias y usar las conocidas',
    ],
    relatedConcepts: ['reinforcement-learning', 'self-play'],
    difficulty: 2,
  },
  {
    id: 'hybrid-evaluator',
    term: 'Hybrid Evaluator',
    termEs: 'Evaluador Híbrido',
    category: 'machine-learning',
    definition:
      'Combinación de evaluación tradicional (reglas) con evaluación neuronal (ML). El blend factor se ajusta dinámicamente: más tradicional en apertura (0.3), equilibrado en medio (0.5), más neuronal en final (0.7).',
    keyPoints: [
      'Blend dinámico: apertura→tradicional, final→neuronal',
      'Aprovecha interpretabilidad tradicional + aprendizaje neuronal',
      'Factor configurable de 0 (100% tradicional) a 1 (100% neuronal)',
    ],
    relatedConcepts: ['neural-network-eval', 'multi-component-eval'],
    difficulty: 3,
  },
  {
    id: 'evaluation-tapering',
    term: 'Evaluation Tapering',
    termEs: 'Ponderación Gradual de Evaluación',
    category: 'machine-learning',
    definition:
      'Técnica que interpola suavemente los pesos de evaluación entre fases del juego en lugar de cambiar abruptamente, creando transiciones continuas que reflejan mejor la evolución gradual de una partida.',
    keyPoints: [
      'Interpolación suave entre pesos de apertura y final',
      'Evita cambios abruptos entre fases',
      'Usa factor continuo basándose en material restante',
    ],
    relatedConcepts: ['phase-based-eval', 'hybrid-evaluator'],
    difficulty: 3,
  },
];
