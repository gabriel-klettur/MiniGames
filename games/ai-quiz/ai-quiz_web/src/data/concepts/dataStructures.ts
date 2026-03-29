import type { Concept } from '../types';

export const dataStructureConcepts: Concept[] = [
  {
    id: 'bitboards',
    term: 'Bitboards',
    termEs: 'Bitboards',
    category: 'data-structures',
    definition:
      'Representación de tablero usando enteros binarios donde cada bit representa una casilla. Permite operaciones bit a bit extremadamente rápidas para manipular y consultar el estado del tablero.',
    keyPoints: [
      'Cada bit representa una casilla del tablero',
      'Operaciones AND, OR, XOR para manipulación rápida',
      'Permite evaluar millones de posiciones por segundo',
    ],
    relatedConcepts: ['zobrist-hashing', 'recovery-evaluation'],
    difficulty: 2,
  },
  {
    id: 'object-pool',
    term: 'Object Pool',
    termEs: 'Pool de Objetos',
    category: 'data-structures',
    definition:
      'Patrón que reutiliza objetos en lugar de crearlos y destruirlos constantemente. Reduce la presión sobre el garbage collector y mejora rendimiento en aplicaciones con alta frecuencia de creación.',
    keyPoints: [
      'Pre-asigna objetos al inicializar',
      'acquire() obtiene, release() devuelve al pool',
      'Reduce presión en el garbage collector',
    ],
    relatedConcepts: ['transposition-table'],
    difficulty: 2,
  },
  {
    id: 'simd-operations',
    term: 'SIMD Operations',
    termEs: 'Operaciones SIMD',
    category: 'data-structures',
    definition:
      'Single Instruction, Multiple Data. Operaciones que realizan el mismo cálculo sobre múltiples datos simultáneamente usando registros vectoriales del procesador para acelerar evaluaciones paralelas.',
    keyPoints: [
      'Una instrucción procesa múltiples datos a la vez',
      'Usa registros vectoriales (ej: Float32x4)',
      'Fallback a evaluación escalar si no está disponible',
    ],
    relatedConcepts: ['multi-component-eval'],
    difficulty: 3,
  },
];
