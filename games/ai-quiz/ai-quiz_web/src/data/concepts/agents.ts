import type { Concept } from '../types';

export const agentsConcepts: Concept[] = [
  {
    id: 'agents',
    term: 'AI Agents',
    termEs: 'Agentes de IA',
    category: 'agents',
    definition:
      'Sistemas de IA autónomos capaces de percibir su entorno, razonar sobre él y ejecutar acciones para alcanzar objetivos. Combinan modelos de lenguaje con herramientas, memoria y capacidad de planificación para resolver tareas complejas de forma autónoma.',
    keyPoints: [
      'Sistemas autónomos que perciben, razonan y actúan',
      'Combinan LLMs con herramientas, memoria y planificación',
      'Pueden descomponer y resolver tareas complejas de forma autónoma',
    ],
    relatedConcepts: ['agent-tools', 'agent-memory', 'multi-agent'],
    difficulty: 1,
  },
  {
    id: 'agent-tools',
    term: 'Agent Tools',
    termEs: 'Herramientas de Agentes',
    category: 'agents',
    definition:
      'Funciones o APIs externas que un agente de IA puede invocar para interactuar con el mundo real. Incluyen acceso a archivos, búsqueda web, ejecución de código, APIs de terceros y bases de datos, ampliando enormemente las capacidades del modelo.',
    keyPoints: [
      'Funciones externas que el agente invoca para actuar',
      'Incluyen lectura/escritura de archivos, búsqueda, ejecución de código',
      'Conectan al agente con sistemas y datos del mundo real',
    ],
    relatedConcepts: ['agents', 'mcp', 'function-calling'],
    difficulty: 1,
  },
  {
    id: 'function-calling',
    term: 'Function Calling',
    termEs: 'Llamada a Funciones',
    category: 'agents',
    definition:
      'Capacidad de los modelos de lenguaje para generar llamadas estructuradas a funciones externas. El modelo decide cuándo y con qué parámetros invocar una función, permitiendo la integración con APIs y herramientas de forma programática.',
    keyPoints: [
      'El modelo genera llamadas estructuradas (JSON) a funciones',
      'Decide autónomamente cuándo y con qué parámetros llamar',
      'Base fundamental del patrón de agentes con herramientas',
    ],
    relatedConcepts: ['agent-tools', 'agents', 'mcp'],
    difficulty: 2,
  },
  {
    id: 'agent-memory',
    term: 'Agent Memory',
    termEs: 'Memoria de Agentes',
    category: 'agents',
    definition:
      'Sistema que permite a los agentes retener y recuperar información entre interacciones. Incluye memoria a corto plazo (contexto de conversación), memoria a largo plazo (persistente entre sesiones) y memoria episódica (experiencias pasadas).',
    keyPoints: [
      'Memoria a corto plazo: contexto de la conversación actual',
      'Memoria a largo plazo: persiste entre sesiones del agente',
      'Permite al agente aprender de experiencias anteriores',
    ],
    relatedConcepts: ['agents', 'rag'],
    difficulty: 2,
  },
  {
    id: 'rag',
    term: 'RAG (Retrieval-Augmented Generation)',
    termEs: 'RAG (Generación Aumentada por Recuperación)',
    category: 'agents',
    definition:
      'Técnica que mejora las respuestas de un modelo de IA recuperando documentos relevantes de una base de conocimiento antes de generar la respuesta. Combina búsqueda semántica con generación, reduciendo alucinaciones y aportando información actualizada.',
    keyPoints: [
      'Recupera documentos relevantes antes de generar respuestas',
      'Reduce alucinaciones proporcionando contexto factual',
      'Combina búsqueda semántica con generación de texto',
    ],
    relatedConcepts: ['agent-memory', 'agents', 'embeddings'],
    difficulty: 2,
  },
  {
    id: 'multi-agent',
    term: 'Multi-Agent Systems',
    termEs: 'Sistemas Multi-Agente',
    category: 'agents',
    definition:
      'Arquitectura donde múltiples agentes especializados colaboran para resolver problemas complejos. Cada agente tiene un rol específico (planificador, ejecutor, revisor) y se comunican entre sí para coordinar tareas y compartir resultados.',
    keyPoints: [
      'Múltiples agentes con roles especializados colaboran',
      'Cada agente se enfoca en una subtarea específica',
      'Comunicación y coordinación entre agentes para resolver problemas complejos',
    ],
    relatedConcepts: ['agents', 'agent-orchestrator'],
    difficulty: 3,
  },
  {
    id: 'agent-orchestrator',
    term: 'Agent Orchestrator',
    termEs: 'Orquestador de Agentes',
    category: 'agents',
    definition:
      'Componente central que coordina la ejecución de múltiples agentes o pasos en un flujo de trabajo. Decide qué agente ejecutar, gestiona dependencias entre tareas, maneja errores y consolida resultados parciales.',
    keyPoints: [
      'Coordina la ejecución de múltiples agentes o pasos',
      'Gestiona dependencias, errores y resultados parciales',
      'Implementa patrones como secuencial, paralelo o condicional',
    ],
    relatedConcepts: ['multi-agent', 'agents'],
    difficulty: 3,
  },
  {
    id: 'prompt-engineering',
    term: 'Prompt Engineering',
    termEs: 'Ingeniería de Prompts',
    category: 'agents',
    definition:
      'Disciplina de diseñar y optimizar las instrucciones (prompts) dadas a modelos de IA para obtener respuestas precisas y útiles. Incluye técnicas como few-shot, chain-of-thought y system prompts que guían el comportamiento del modelo.',
    keyPoints: [
      'Diseña instrucciones precisas para guiar al modelo',
      'Técnicas: few-shot, chain-of-thought, role prompting',
      'Fundamental para obtener resultados de calidad de agentes',
    ],
    relatedConcepts: ['agents', 'chain-of-thought'],
    difficulty: 1,
  },
  {
    id: 'chain-of-thought',
    term: 'Chain-of-Thought (CoT)',
    termEs: 'Cadena de Pensamiento (CoT)',
    category: 'agents',
    definition:
      'Técnica de prompting que pide al modelo razonar paso a paso antes de dar una respuesta final. Mejora significativamente el rendimiento en tareas de razonamiento, matemáticas y lógica al hacer explícito el proceso de pensamiento.',
    keyPoints: [
      'El modelo razona paso a paso antes de responder',
      'Mejora el rendimiento en tareas de lógica y matemáticas',
      'Hace explícito y verificable el proceso de razonamiento',
    ],
    relatedConcepts: ['prompt-engineering', 'agents'],
    difficulty: 2,
  },
  {
    id: 'embeddings',
    term: 'Embeddings',
    termEs: 'Embeddings (Vectores de Representación)',
    category: 'agents',
    definition:
      'Representaciones numéricas (vectores) de texto, imágenes u otros datos que capturan su significado semántico. Textos similares producen vectores cercanos, permitiendo búsqueda semántica, clustering y comparación de conceptos.',
    keyPoints: [
      'Vectores numéricos que representan el significado semántico',
      'Textos similares generan vectores cercanos en el espacio',
      'Base para búsqueda semántica y sistemas RAG',
    ],
    relatedConcepts: ['rag', 'agent-memory'],
    difficulty: 2,
  },
  {
    id: 'guardrails',
    term: 'Guardrails',
    termEs: 'Guardarraíles (Guardrails)',
    category: 'agents',
    definition:
      'Mecanismos de seguridad que limitan y validan las acciones de los agentes de IA. Incluyen filtros de contenido, validación de entradas/salidas, límites de acciones y revisión humana para prevenir comportamientos no deseados o peligrosos.',
    keyPoints: [
      'Limitan y validan las acciones del agente',
      'Incluyen filtros de contenido y validación de I/O',
      'Esenciales para la seguridad y confiabilidad del agente',
    ],
    relatedConcepts: ['agents', 'agent-tools'],
    difficulty: 2,
  },
];
