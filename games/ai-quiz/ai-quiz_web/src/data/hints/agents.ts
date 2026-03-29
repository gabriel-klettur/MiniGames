import type { HelpSpec } from './types';

export const agentsHints: HelpSpec[] = [
  {
    id: 'agents',
    glossary: [
      { term: 'Autónomo', explanation: 'Capaz de operar por sí mismo sin intervención constante del usuario.' },
      { term: 'LLM', explanation: 'Large Language Model: modelo de lenguaje de gran escala como GPT o Claude.' },
      { term: 'Planificación', explanation: 'Capacidad de descomponer un objetivo en pasos ejecutables.' },
      { term: 'Percepción', explanation: 'Capacidad de observar y entender el entorno del problema.' },
    ],
    context: 'Los agentes de IA representan la evolución de los chatbots simples, pasando de solo responder preguntas a ejecutar tareas complejas.',
  },
  {
    id: 'agent-tools',
    glossary: [
      { term: 'API', explanation: 'Interfaz de Programación de Aplicaciones: puerta de entrada a un servicio.' },
      { term: 'Invocar', explanation: 'Llamar a una función o servicio para que ejecute una operación.' },
      { term: 'Sandbox', explanation: 'Entorno aislado donde el código se ejecuta de forma segura.' },
      { term: 'Capacidades', explanation: 'Acciones concretas que el agente puede realizar gracias a una herramienta.' },
    ],
    context: 'Las herramientas son lo que diferencia a un agente de un chatbot: le permiten actuar sobre el mundo, no solo hablar sobre él.',
  },
  {
    id: 'function-calling',
    glossary: [
      { term: 'Llamada estructurada', explanation: 'Invocación con formato definido: nombre de función y parámetros en JSON.' },
      { term: 'Parámetros', explanation: 'Datos de entrada que la función necesita para ejecutarse.' },
      { term: 'JSON Schema', explanation: 'Formato que describe la estructura esperada de los datos de entrada.' },
      { term: 'Programáticamente', explanation: 'De forma que puede ser procesado automáticamente por código.' },
    ],
    context: 'Function calling es el mecanismo que permite a los LLMs pasar de generar solo texto a interactuar con sistemas reales.',
  },
  {
    id: 'agent-memory',
    glossary: [
      { term: 'Corto plazo', explanation: 'Información disponible durante la conversación actual (ventana de contexto).' },
      { term: 'Largo plazo', explanation: 'Información que persiste entre diferentes conversaciones o sesiones.' },
      { term: 'Episódica', explanation: 'Recuerdos de experiencias pasadas específicas y sus resultados.' },
      { term: 'Ventana de contexto', explanation: 'Cantidad máxima de texto que un LLM puede procesar a la vez.' },
    ],
    context: 'La memoria resuelve una limitación fundamental de los LLMs: por sí solos, no recuerdan nada entre conversaciones.',
  },
  {
    id: 'rag',
    glossary: [
      { term: 'Retrieval', explanation: 'Proceso de buscar y recuperar documentos relevantes de una base de datos.' },
      { term: 'Augmented', explanation: 'La generación se "aumenta" con información recuperada externamente.' },
      { term: 'Alucinación', explanation: 'Cuando el modelo inventa información falsa que suena convincente.' },
      { term: 'Búsqueda semántica', explanation: 'Buscar por significado, no por coincidencia exacta de palabras.' },
    ],
    context: 'RAG permite a los modelos dar respuestas basadas en datos actualizados y específicos sin necesidad de reentrenamiento.',
  },
  {
    id: 'multi-agent',
    glossary: [
      { term: 'Agente especializado', explanation: 'Agente diseñado para un tipo específico de tarea.' },
      { term: 'Coordinación', explanation: 'Proceso de organizar las acciones de múltiples agentes.' },
      { term: 'Subtarea', explanation: 'Parte de un problema más grande que un agente puede resolver individualmente.' },
      { term: 'Comunicación inter-agente', explanation: 'Intercambio de información entre agentes del sistema.' },
    ],
    context: 'Al igual que equipos humanos con roles especializados, los sistemas multi-agente dividen el trabajo según las fortalezas de cada agente.',
  },
  {
    id: 'agent-orchestrator',
    glossary: [
      { term: 'Orquestar', explanation: 'Coordinar y dirigir la ejecución de múltiples componentes o agentes.' },
      { term: 'Dependencias', explanation: 'Relaciones donde una tarea necesita el resultado de otra para comenzar.' },
      { term: 'Flujo condicional', explanation: 'Ejecución que toma caminos diferentes según las condiciones.' },
      { term: 'Consolidar', explanation: 'Combinar resultados parciales en un resultado final coherente.' },
    ],
    context: 'El orquestador es como un director de orquesta: no toca ningún instrumento, pero coordina a todos los músicos.',
  },
  {
    id: 'prompt-engineering',
    glossary: [
      { term: 'Prompt', explanation: 'Instrucción o texto de entrada que se envía al modelo de IA.' },
      { term: 'Few-shot', explanation: 'Dar al modelo algunos ejemplos de entrada/salida para guiar su comportamiento.' },
      { term: 'System prompt', explanation: 'Instrucción inicial que establece el rol y las reglas del modelo.' },
      { term: 'Role prompting', explanation: 'Asignar un personaje o rol al modelo para influir en sus respuestas.' },
    ],
    context: 'El prompt engineering es la habilidad de comunicarse efectivamente con modelos de IA para obtener los mejores resultados.',
  },
  {
    id: 'chain-of-thought',
    glossary: [
      { term: 'Razonamiento paso a paso', explanation: 'Resolver un problema dividiendo el proceso en pasos intermedios explícitos.' },
      { term: 'Lógica', explanation: 'Proceso de deducción basado en premisas para llegar a una conclusión.' },
      { term: 'Proceso de pensamiento', explanation: 'La secuencia de razonamiento que lleva a una conclusión.' },
      { term: 'Verificable', explanation: 'Que se puede comprobar la corrección de cada paso intermedio.' },
    ],
    context: 'Chain-of-Thought imita cómo los humanos resuelven problemas: pensando en voz alta y construyendo la respuesta paso a paso.',
  },
  {
    id: 'embeddings',
    glossary: [
      { term: 'Vector', explanation: 'Lista de números que representan una posición en un espacio multidimensional.' },
      { term: 'Semántico', explanation: 'Relacionado con el significado, no con la forma de las palabras.' },
      { term: 'Similitud coseno', explanation: 'Medida de cuán parecidos son dos vectores por su ángulo.' },
      { term: 'Espacio vectorial', explanation: 'Espacio matemático donde los conceptos similares están cerca.' },
    ],
    context: 'Los embeddings traducen el lenguaje humano a números que las máquinas pueden comparar y buscar eficientemente.',
  },
  {
    id: 'guardrails',
    glossary: [
      { term: 'Validación', explanation: 'Proceso de verificar que los datos o acciones cumplen con las reglas.' },
      { term: 'Filtro de contenido', explanation: 'Mecanismo que bloquea contenido inapropiado o peligroso.' },
      { term: 'Límite de acciones', explanation: 'Restricción en el número o tipo de acciones que puede realizar el agente.' },
      { term: 'Revisión humana', explanation: 'Un humano verifica y aprueba acciones críticas del agente.' },
    ],
    context: 'Los guardrails son como los barandales de un puente: permiten al agente moverse libremente pero dentro de límites seguros.',
  },
];
