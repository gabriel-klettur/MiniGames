import type { HelpSpec } from './types';

export const dataStructureHints: HelpSpec[] = [
  {
    id: 'bitboards',
    glossary: [
      { term: 'Enteros binarios', explanation: 'Números representados en base 2, donde cada dígito (bit) puede ser 0 o 1.' },
      { term: 'Operaciones bit a bit', explanation: 'AND, OR, XOR — operaciones que manipulan bits individuales, extremadamente rápidas.' },
      { term: 'Casilla del tablero', explanation: 'Cada posición individual en un tablero de juego.' },
    ],
    context: 'Representar el estado del juego de forma compacta permite evaluaciones mucho más rápidas.',
  },
  {
    id: 'object-pool',
    glossary: [
      { term: 'Garbage collector', explanation: 'Sistema automático que libera memoria de objetos que ya no se usan.' },
      { term: 'acquire() / release()', explanation: 'Operaciones para obtener un objeto del pool y devolverlo cuando ya no se necesita.' },
      { term: 'Pre-asignar', explanation: 'Crear los objetos necesarios al inicio en vez de bajo demanda.' },
    ],
    context: 'Reutilizar objetos en vez de crearlos y destruirlos reduce pausas del recolector de basura.',
  },
  {
    id: 'simd-operations',
    glossary: [
      { term: 'Registros vectoriales', explanation: 'Espacios del procesador que almacenan múltiples valores para procesarlos en paralelo.' },
      { term: 'Evaluación escalar', explanation: 'Calcular un solo valor a la vez (lo opuesto a SIMD).' },
      { term: 'Fallback', explanation: 'Alternativa de respaldo cuando una funcionalidad avanzada no está disponible.' },
      { term: 'Float32x4', explanation: 'Tipo que representa 4 números decimales de 32 bits procesados simultáneamente.' },
    ],
    context: 'El procesamiento paralelo a nivel de datos permite acelerar cálculos repetitivos como evaluaciones de posiciones.',
  },
];

export const testingHints: HelpSpec[] = [
  {
    id: 'search-testing',
    glossary: [
      { term: 'Posiciones predefinidas', explanation: 'Situaciones de tablero preparadas con una solución conocida de antemano.' },
      { term: 'Mate en 2', explanation: 'Posición donde existe una secuencia forzada de 2 movimientos para ganar.' },
      { term: 'Suite de tests', explanation: 'Conjunto organizado de pruebas que cubren diferentes escenarios.' },
      { term: 'Casos tácticos/estratégicos', explanation: 'Pruebas que verifican tanto jugadas de combate como de planificación.' },
    ],
    context: 'Verificar que la IA encuentra las jugadas correctas en posiciones conocidas es fundamental para validar su funcionamiento.',
  },
  {
    id: 'evaluation-testing',
    glossary: [
      { term: 'Tolerancia configurable', explanation: 'Margen de error aceptable al comparar valores numéricos.' },
      { term: 'Error promedio/máximo', explanation: 'Métricas que miden la desviación entre el valor calculado y el esperado.' },
      { term: 'Coherencia', explanation: 'Propiedad de que una posición ganadora siempre puntúe más alto que una perdedora.' },
    ],
    context: 'Medir la precisión numérica de las evaluaciones asegura que la IA valora correctamente las posiciones.',
  },
  {
    id: 'game-integration-test',
    glossary: [
      { term: 'IA vs IA', explanation: 'Simulación donde dos instancias de la inteligencia artificial juegan entre sí.' },
      { term: 'Legalidad de movimientos', explanation: 'Verificar que cada jugada cumple las reglas del juego.' },
      { term: 'Tiempo promedio/máximo', explanation: 'Métricas de rendimiento que detectan movimientos excesivamente lentos.' },
    ],
    context: 'Las pruebas de integración simulan partidas completas para verificar que todos los componentes funcionan juntos.',
  },
  {
    id: 'performance-benchmark',
    glossary: [
      { term: 'Nodes/segundo (NPS)', explanation: 'Cantidad de posiciones que la IA puede evaluar por segundo.' },
      { term: 'Hit rate', explanation: 'Porcentaje de veces que se encuentra un resultado útil ya almacenado en caché.' },
      { term: 'Regresiones', explanation: 'Degradaciones de rendimiento causadas por cambios recientes en el código.' },
    ],
    context: 'Los benchmarks de rendimiento permiten detectar degradaciones antes de que afecten la experiencia de juego.',
  },
  {
    id: 'elo-rating',
    glossary: [
      { term: 'Rating', explanation: 'Número que representa la fuerza de juego de una IA o jugador.' },
      { term: 'Factor K', explanation: 'Constante que determina cuánto cambia el rating después de cada partida.' },
      { term: 'Torneo round-robin', explanation: 'Formato donde cada participante juega contra todos los demás.' },
      { term: 'Rating esperado', explanation: 'Predicción estadística del resultado basada en la diferencia de ratings.' },
    ],
    context: 'Comparar diferentes versiones de IA en torneos permite medir objetivamente qué cambios mejoran el juego.',
  },
  {
    id: 'performance-monitor',
    glossary: [
      { term: 'Métricas en tiempo real', explanation: 'Datos de rendimiento recolectados mientras el programa se ejecuta.' },
      { term: 'Min, max, media, mediana', explanation: 'Estadísticas descriptivas que resumen la distribución de los datos.' },
      { term: 'NPS (nodos por segundo)', explanation: 'Velocidad de procesamiento de la IA medida en posiciones evaluadas por segundo.' },
      { term: 'TT hit rate', explanation: 'Porcentaje de consultas a la tabla de transposición que encuentran datos útiles.' },
    ],
    context: 'Monitorear el rendimiento en ejecución permite identificar cuellos de botella y verificar eficiencia.',
  },
];

export const machineLearningHints: HelpSpec[] = [
  {
    id: 'neural-network-eval',
    glossary: [
      { term: 'Red neuronal', explanation: 'Modelo computacional inspirado en el cerebro que aprende patrones de datos.' },
      { term: 'Tensor', explanation: 'Estructura de datos multidimensional que representa el estado del juego para la red.' },
      { term: 'One-hot encoding', explanation: 'Representación donde cada valor posible se codifica como un vector binario.' },
      { term: 'Evaluación tradicional', explanation: 'Función basada en reglas programadas manualmente por un humano.' },
    ],
    context: 'Las redes neuronales pueden aprender patrones sutiles que son difíciles de programar a mano.',
  },
  {
    id: 'reinforcement-learning',
    glossary: [
      { term: 'Agente', explanation: 'La entidad que toma decisiones (en este caso, la IA del juego).' },
      { term: 'Entorno', explanation: 'El espacio donde el agente actúa y recibe retroalimentación.' },
      { term: 'Recompensa/castigo', explanation: 'Señales que le indican al agente si su acción fue buena o mala.' },
      { term: 'Factor de descuento (gamma)', explanation: 'Valor que reduce la importancia de recompensas lejanas en el futuro.' },
    ],
    context: 'Aprender por experiencia propia permite a la IA mejorar sin necesidad de ejemplos etiquetados por humanos.',
  },
  {
    id: 'self-play',
    glossary: [
      { term: 'Buffer de experiencia', explanation: 'Almacén circular que guarda las jugadas y resultados de partidas anteriores.' },
      { term: 'Descuento temporal', explanation: 'Técnica que asigna más valor a acciones cercanas al resultado que a las iniciales.' },
      { term: 'Datos de entrenamiento', explanation: 'Ejemplos de jugadas y resultados que la IA usa para aprender.' },
    ],
    context: 'Generar datos de entrenamiento sin intervención humana permite escalar el proceso de aprendizaje.',
  },
  {
    id: 'epsilon-greedy',
    glossary: [
      { term: 'Exploración vs. explotación', explanation: 'Dilema entre probar opciones nuevas (explorar) y usar la mejor conocida (explotar).' },
      { term: 'Epsilon (ε)', explanation: 'Parámetro que controla la probabilidad de elegir una acción aleatoria.' },
      { term: 'Movimiento aleatorio', explanation: 'Jugada elegida al azar, sin considerar la evaluación del modelo.' },
    ],
    context: 'Equilibrar entre descubrir y utilizar es esencial en sistemas que aprenden por experiencia.',
  },
  {
    id: 'hybrid-evaluator',
    glossary: [
      { term: 'Blend factor', explanation: 'Proporción que determina cuánto peso tiene cada tipo de evaluación.' },
      { term: 'Evaluación tradicional (reglas)', explanation: 'Función programada manualmente con criterios definidos.' },
      { term: 'Evaluación neuronal (ML)', explanation: 'Puntuación generada por un modelo de aprendizaje automático.' },
      { term: 'Interpretabilidad', explanation: 'Capacidad de entender por qué la IA tomó una decisión específica.' },
    ],
    context: 'Combinar enfoques tradicionales y de aprendizaje automático puede aprovechar las fortalezas de ambos.',
  },
  {
    id: 'evaluation-tapering',
    glossary: [
      { term: 'Interpolación suave', explanation: 'Transición gradual entre dos valores en vez de un cambio brusco.' },
      { term: 'Pesos de evaluación', explanation: 'Multiplicadores que determinan la importancia de cada factor.' },
      { term: 'Factor continuo', explanation: 'Valor numérico que cambia gradualmente, no en saltos discretos.' },
      { term: 'Material restante', explanation: 'Cantidad de piezas en el tablero, usada como indicador de la fase del juego.' },
    ],
    context: 'Las transiciones graduales entre fases del juego producen evaluaciones más naturales y consistentes.',
  },
];
