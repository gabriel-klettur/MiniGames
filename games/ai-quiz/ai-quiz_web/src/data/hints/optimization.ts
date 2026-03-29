import type { HelpSpec } from './types';

export const optimizationHints: HelpSpec[] = [
  {
    id: 'transposition-table',
    glossary: [
      { term: 'Caché', explanation: 'Almacenamiento temporal de resultados para evitar recalcularlos.' },
      { term: 'Hashing', explanation: 'Proceso de generar un identificador único y compacto para un estado del tablero.' },
      { term: 'Transposición', explanation: 'Misma posición del tablero alcanzada por secuencias de movimientos diferentes.' },
      { term: 'Flags EXACT, ALPHA, BETA', explanation: 'Indicadores del tipo de evaluación almacenada (exacta o cota superior/inferior).' },
    ],
    context: 'Evitar recalcular posiciones ya evaluadas es una de las optimizaciones más importantes en búsqueda de IA.',
  },
  {
    id: 'zobrist-hashing',
    glossary: [
      { term: 'XOR', explanation: 'Operación lógica bit a bit que combina valores de forma reversible y eficiente.' },
      { term: 'Números aleatorios pre-generados', explanation: 'Tabla de valores aleatorios creados al inicio para representar cada pieza en cada casilla.' },
      { term: 'Actualización incremental', explanation: 'Modificar el hash existente solo con los cambios, sin recalcular todo.' },
      { term: 'Clave única', explanation: 'Identificador numérico que representa una posición específica del tablero.' },
    ],
    context: 'Un buen sistema de hashing permite identificar posiciones rápidamente sin comparar todo el estado del tablero.',
  },
  {
    id: 'killer-moves',
    glossary: [
      { term: 'Poda beta (cutoff)', explanation: 'Momento en que se descarta una rama porque se encontró un movimiento suficientemente bueno.' },
      { term: 'Nivel (ply)', explanation: 'Capa o profundidad específica dentro del árbol de búsqueda.' },
      { term: 'Ordenamiento de movimientos', explanation: 'Organizar los movimientos a evaluar empezando por los más prometedores.' },
    ],
    context: 'Recordar qué movimientos fueron efectivos antes permite probarlos primero en posiciones similares.',
  },
  {
    id: 'history-heuristic',
    glossary: [
      { term: 'Heurística', explanation: 'Regla práctica basada en experiencia para tomar mejores decisiones de búsqueda.' },
      { term: 'Éxitos ponderados por depth²', explanation: 'Los movimientos exitosos en búsquedas más profundas reciben mayor peso.' },
      { term: 'Información global', explanation: 'Estadísticas acumuladas de toda la búsqueda, no solo del nivel actual.' },
    ],
    context: 'Llevar un registro del rendimiento histórico de los movimientos ayuda a ordenarlos mejor en futuras búsquedas.',
  },
  {
    id: 'move-ordering',
    glossary: [
      { term: 'Podas alpha-beta', explanation: 'Técnica que descarta ramas del árbol que no afectarán la decisión final.' },
      { term: 'Movimiento TT', explanation: 'Mejor movimiento almacenado en la tabla de transposición para esa posición.' },
      { term: 'Capturas', explanation: 'Movimientos que eliminan una pieza del oponente del tablero.' },
    ],
    context: 'Evaluar primero los movimientos más prometedores permite descartar más ramas y buscar más rápido.',
  },
  {
    id: 'mvv-lva',
    glossary: [
      { term: 'Víctima más valiosa', explanation: 'La pieza capturada de mayor valor en un intercambio.' },
      { term: 'Atacante menos valioso', explanation: 'La pieza que realiza la captura, idealmente de menor valor.' },
      { term: 'Predicción de branches', explanation: 'Optimización de procesador que predice el resultado de condiciones para ejecutar código más rápido.' },
      { term: 'Movimientos tácticos vs. normales', explanation: 'Distinción entre capturas/intercambios y movimientos posicionales.' },
    ],
    context: 'Priorizar capturas ventajosas mejora la eficiencia de la búsqueda al explorar primero las jugadas más impactantes.',
  },
  {
    id: 'age-based-replacement',
    glossary: [
      { term: 'Política de reemplazo', explanation: 'Regla que decide qué entrada antigua eliminar cuando la tabla se llena.' },
      { term: 'Mayor profundidad', explanation: 'Búsquedas más profundas generan resultados más valiosos que merecen conservarse.' },
      { term: 'LRU (Least Recently Used)', explanation: 'Estrategia que descarta los elementos que llevan más tiempo sin usarse.' },
      { term: 'Entradas obsoletas', explanation: 'Datos almacenados que ya no son relevantes para la búsqueda actual.' },
    ],
    context: 'Cuando el espacio es limitado, decidir qué datos conservar y cuáles descartar afecta directamente al rendimiento.',
  },
];
