import type { HelpSpec } from './types';

export const architectureHints: HelpSpec[] = [
  {
    id: 'separation-of-concerns',
    glossary: [
      { term: 'Módulo', explanation: 'Unidad de código con una responsabilidad específica y bien delimitada.' },
      { term: 'Interfaces', explanation: 'Contratos que definen cómo se comunican los módulos entre sí, sin exponer detalles internos.' },
      { term: 'Testing', explanation: 'Proceso de verificar que cada parte del código funciona correctamente de forma aislada.' },
      { term: 'Extensibilidad', explanation: 'Capacidad de añadir nuevas funcionalidades sin modificar el código existente.' },
    ],
    context: 'Un buen diseño de software divide la IA en módulos independientes que colaboran a través de interfaces claras.',
  },
  {
    id: 'dependency-injection',
    glossary: [
      { term: 'Inversión de Control (IoC)', explanation: 'Principio donde un módulo no crea sus dependencias, sino que las recibe del exterior.' },
      { term: 'Constructor', explanation: 'Función que inicializa un objeto, recibiendo sus dependencias como parámetros.' },
      { term: 'Mocks', explanation: 'Objetos simulados que reemplazan dependencias reales para facilitar las pruebas.' },
      { term: 'Implementaciones intercambiables', explanation: 'Poder cambiar un componente por otro compatible sin alterar el resto.' },
    ],
    context: 'Controlar cómo se conectan los módulos permite mayor flexibilidad y facilita las pruebas automatizadas.',
  },
  {
    id: 'worker-pool',
    glossary: [
      { term: 'Workers (hilos de trabajo)', explanation: 'Unidades de ejecución independientes que procesan tareas en paralelo.' },
      { term: 'Concurrencia', explanation: 'Ejecución simultánea de múltiples tareas para aprovechar todos los núcleos del procesador.' },
      { term: 'Cola de tareas', explanation: 'Lista de trabajo pendiente que se asigna a workers conforme se liberan.' },
      { term: 'CPU-intensive', explanation: 'Tareas que requieren mucho procesamiento, como búsquedas profundas en árboles de juego.' },
    ],
    context: 'Gestionar hilos de trabajo eficientemente permite aprovechar el hardware moderno para cálculos pesados.',
  },
  {
    id: 'root-parallelization',
    glossary: [
      { term: 'Nivel raíz', explanation: 'El primer nivel del árbol de búsqueda, con los movimientos inmediatamente disponibles.' },
      { term: 'Workers', explanation: 'Unidades de ejecución independientes que procesan tareas en paralelo.' },
      { term: 'Subconjunto de movimientos', explanation: 'Porción del total de movimientos asignada a cada worker.' },
    ],
    context: 'Dividir el trabajo entre múltiples procesadores reduce el tiempo total para encontrar la mejor jugada.',
  },
  {
    id: 'second-ply-split',
    glossary: [
      { term: 'Segundo nivel del árbol', explanation: 'Las respuestas del oponente a cada movimiento del nivel raíz.' },
      { term: 'Pocos movimientos raíz', explanation: 'Situación donde hay pocas opciones en el primer nivel, limitando la paralelización.' },
      { term: 'Utilización de workers', explanation: 'Porcentaje del tiempo que los workers están activamente procesando tareas.' },
    ],
    context: 'Cuando hay pocas opciones principales, distribuir el trabajo en niveles más profundos aprovecha mejor los recursos.',
  },
  {
    id: 'adaptive-time',
    glossary: [
      { term: 'Complejidad de la posición', explanation: 'Número de opciones y factores a considerar en una situación del tablero.' },
      { term: 'Presión temporal', explanation: 'Situación donde queda poco tiempo en el reloj y las decisiones deben ser más rápidas.' },
      { term: 'Margen de seguridad', explanation: 'Tiempo reservado para evitar perder por agotamiento del reloj.' },
    ],
    context: 'Decidir cuánto tiempo dedicar a cada jugada es un problema de optimización en sí mismo.',
  },
  {
    id: 'runtime-config',
    glossary: [
      { term: 'Presets', explanation: 'Configuraciones predefinidas para diferentes niveles de dificultad o estilos de juego.' },
      { term: 'Recompilar', explanation: 'Generar una nueva versión del programa, lo cual implica detener la ejecución.' },
      { term: 'Deep merge', explanation: 'Combinación recursiva de configuraciones donde valores parciales sobrescriben sin destruir el resto.' },
      { term: 'Ajuste dinámico', explanation: 'Modificar parámetros mientras el programa está en ejecución.' },
    ],
    context: 'Poder ajustar la IA sin recompilar permite experimentar rápidamente y adaptar la dificultad en tiempo real.',
  },
];
