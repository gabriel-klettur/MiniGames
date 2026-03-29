import type { Concept } from '../types';

export const architectureConcepts: Concept[] = [
  {
    id: 'separation-of-concerns',
    term: 'Separation of Concerns',
    termEs: 'Separación de Responsabilidades',
    category: 'architecture',
    definition:
      'Principio de diseño que establece que cada módulo debe tener una única responsabilidad bien definida. En IA de juegos: separar generación de movimientos, evaluación, búsqueda y gestión de tiempo.',
    keyPoints: [
      'Cada módulo con una sola responsabilidad',
      'Módulos interactúan por interfaces claras',
      'Facilita testing, mantenimiento y extensibilidad',
    ],
    relatedConcepts: ['dependency-injection'],
    difficulty: 1,
  },
  {
    id: 'dependency-injection',
    term: 'Dependency Injection',
    termEs: 'Inyección de Dependencias',
    category: 'architecture',
    definition:
      'Patrón de diseño que implementa Inversión de Control (IoC). Las dependencias se "inyectan" desde el exterior en lugar de crearlas internamente, facilitando testing y el intercambio de implementaciones.',
    keyPoints: [
      'Implementa Inversión de Control (IoC)',
      'Dependencias se reciben como parámetros del constructor',
      'Facilita testing con mocks y cambio de implementaciones',
    ],
    relatedConcepts: ['separation-of-concerns', 'runtime-config'],
    difficulty: 1,
  },
  {
    id: 'worker-pool',
    term: 'Worker Pool',
    termEs: 'Pool de Workers',
    category: 'architecture',
    definition:
      'Patrón que gestiona un conjunto de hilos de trabajo (Workers) reutilizables para ejecutar tareas concurrentemente. Reduce sobrecarga de creación de hilos y controla el nivel de paralelismo.',
    keyPoints: [
      'Reutiliza workers en vez de crear/destruir por tarea',
      'Cola de tareas cuando todos los workers están ocupados',
      'Ideal para CPU-intensive tasks como búsquedas de IA',
    ],
    relatedConcepts: ['root-parallelization', 'second-ply-split'],
    difficulty: 2,
  },
  {
    id: 'root-parallelization',
    term: 'Root Parallelization',
    termEs: 'Paralelización Raíz',
    category: 'architecture',
    definition:
      'Técnica que distribuye los movimientos del nivel raíz entre múltiples workers, permitiendo evaluar diferentes movimientos principales simultáneamente para reducir el tiempo total.',
    keyPoints: [
      'Distribuye movimientos raíz entre workers',
      'Cada worker evalúa un subconjunto de movimientos',
      'Resultados se combinan para seleccionar el mejor',
    ],
    relatedConcepts: ['worker-pool', 'second-ply-split'],
    difficulty: 3,
  },
  {
    id: 'second-ply-split',
    term: 'Second-Ply Split',
    termEs: 'División de Segundo Nivel',
    category: 'architecture',
    definition:
      'Técnica alternativa a root parallelization, usada cuando hay pocos movimientos raíz. Paraleliza la búsqueda en el segundo nivel del árbol, distribuyendo las respuestas del oponente entre workers.',
    keyPoints: [
      'Alternativa cuando hay pocos movimientos raíz',
      'Paraleliza en el segundo nivel del árbol',
      'Mejor utilización de workers con pocos movimientos',
    ],
    relatedConcepts: ['root-parallelization', 'worker-pool'],
    difficulty: 3,
  },
  {
    id: 'adaptive-time',
    term: 'Adaptive Time Management',
    termEs: 'Gestión Adaptativa de Tiempo',
    category: 'architecture',
    definition:
      'Sistema que ajusta dinámicamente el tiempo de búsqueda según complejidad de la posición, fase del juego, presión temporal y urgencia. Optimiza la calidad de decisiones dentro de restricciones temporales.',
    keyPoints: [
      'Ajusta por complejidad (±50%), fase del juego, urgencia',
      'Máximo 10% del tiempo restante por movimiento',
      'Margen de seguridad del 10% y mínimo de 50ms',
    ],
    relatedConcepts: ['iterative-deepening', 'runtime-config'],
    difficulty: 2,
  },
  {
    id: 'runtime-config',
    term: 'Runtime Configuration',
    termEs: 'Configuración en Tiempo de Ejecución',
    category: 'architecture',
    definition:
      'Sistema que permite modificar parámetros de la IA sin recompilar. Soporta presets para diferentes niveles de dificultad, deep merge de configuraciones parciales y ajuste dinámico en partida.',
    keyPoints: [
      'Presets predefinidos (beginner, expert)',
      'Modificación de parámetros sin recompilar',
      'Deep merge para actualizaciones parciales',
    ],
    relatedConcepts: ['dependency-injection', 'adaptive-time'],
    difficulty: 2,
  },
];
