import type { HelpSpec } from './types';

export const evaluationHints: HelpSpec[] = [
  {
    id: 'multi-component-eval',
    glossary: [
      { term: 'Puntaje ponderado', explanation: 'Valor numérico calculado multiplicando cada factor por su importancia relativa.' },
      { term: 'Material', explanation: 'Cantidad y valor de las piezas que tiene un jugador.' },
      { term: 'Movilidad', explanation: 'Número de movimientos legales disponibles para un jugador en una posición.' },
      { term: 'Peso configurable', explanation: 'Factor multiplicador que determina la importancia relativa de cada componente.' },
    ],
    context: 'Evaluar una posición de juego requiere combinar múltiples aspectos en un solo número que represente quién va ganando.',
  },
  {
    id: 'phase-based-eval',
    glossary: [
      { term: 'Fase del juego', explanation: 'Etapa de la partida (apertura, medio juego, final) donde cambian las prioridades estratégicas.' },
      { term: 'Pesos de evaluación', explanation: 'Multiplicadores que determinan cuánto influye cada factor en la puntuación.' },
      { term: 'Apertura/Medio juego/Final', explanation: 'Las tres etapas tradicionales de una partida según el progreso.' },
    ],
    context: 'La importancia de cada factor estratégico varía según el momento de la partida.',
  },
  {
    id: 'fusion-evaluation',
    glossary: [
      { term: 'Fusionar piezas', explanation: 'Combinar dos piezas del mismo tipo y nivel para crear una pieza de nivel superior.' },
      { term: 'Cadena', explanation: 'Secuencia de fusiones consecutivas que se desencadenan una tras otra.' },
      { term: 'Control del tablero', explanation: 'Dominio sobre áreas estratégicas del tablero de juego.' },
      { term: 'Ventaja de altura', explanation: 'Diferencia en niveles de piezas entre los jugadores.' },
    ],
    context: 'En juegos con mecánica de fusión, evaluar oportunidades de combinar piezas es clave para la estrategia.',
  },
  {
    id: '12-signal-system',
    glossary: [
      { term: 'Señal/Signal', explanation: 'Cada una de las características medibles que se analizan para evaluar una posición.' },
      { term: 'Juegos de carrera asimétricos', explanation: 'Juegos donde ambos jugadores compiten por llegar a una meta pero en direcciones diferentes.' },
      { term: 'Pesos específicos', explanation: 'Multiplicadores calibrados para determinar la importancia de cada señal.' },
    ],
    context: 'Los sistemas multi-señal evalúan muchos aspectos del juego simultáneamente para capturar la complejidad estratégica.',
  },
  {
    id: 'wall-merit',
    glossary: [
      { term: 'Delta de distancia', explanation: 'Cambio en la longitud del camino más corto al colocar un obstáculo.' },
      { term: 'Ruta crítica', explanation: 'El camino más corto actual que un jugador usa para llegar a su meta.' },
      { term: 'Valor posicional', explanation: 'Importancia estratégica de una ubicación específica en el tablero.' },
    ],
    context: 'Evaluar la efectividad de obstáculos requiere medir su impacto en las rutas de los jugadores.',
  },
  {
    id: 'recovery-evaluation',
    glossary: [
      { term: 'Recuperación de piezas', explanation: 'Acción de retirar una pieza propia del tablero para reutilizarla después.' },
      { term: 'Amenazas del oponente', explanation: 'Oportunidades que el rival tiene para realizar jugadas ventajosas.' },
      { term: 'Valor negativo', explanation: 'Puntuación que penaliza situaciones desfavorables para el jugador evaluado.' },
    ],
    context: 'En juegos donde las piezas se pueden recuperar, evaluar estas oportunidades da ventaja estratégica.',
  },
  {
    id: 'collision-chain',
    glossary: [
      { term: 'Colisión', explanation: 'Evento donde una pieza en movimiento impacta contra una pieza rival.' },
      { term: 'Reacción en cadena', explanation: 'Serie de colisiones que se desencadenan una tras otra a partir de una inicial.' },
      { term: 'Impacto táctico', explanation: 'Efecto total de una jugada considerando todas sus consecuencias inmediatas.' },
      { term: 'Ventaja posicional', explanation: 'Mejora en la posición relativa de las piezas de un jugador.' },
    ],
    context: 'Analizar cadenas de eventos ayuda a prever el impacto total de una única acción.',
  },
];
