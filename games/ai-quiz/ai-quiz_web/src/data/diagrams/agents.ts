import type { DiagramSpec } from './types';

export const agentsDiagrams: DiagramSpec[] = [
  {
    id: 'agents',
    mermaidCode: `graph TD
      U["👤 Usuario"]
      A["🤖 Agente IA"]
      P["🧠 Planificación"]
      T["🔧 Herramientas"]
      M["💾 Memoria"]
      R["✅ Resultado"]
      U -->|objetivo| A
      A --> P
      P -->|pasos| A
      A -->|invoca| T
      T -->|resultado| A
      A -->|almacena| M
      M -->|recuerda| A
      A -->|entrega| R
      style A fill:#1e3a5f,stroke:#60a5fa
      style P fill:#1e1b4b,stroke:#818cf8`,
    steps: [
      { description: 'El usuario define un objetivo para el agente', highlightNodes: ['U'] },
      { description: 'El agente planifica los pasos necesarios', highlightNodes: ['A', 'P'] },
      { description: 'Invoca herramientas para ejecutar acciones', highlightNodes: ['T'] },
      { description: 'Almacena contexto en memoria para futuras decisiones', highlightNodes: ['M'] },
      { description: 'Itera hasta entregar el resultado final', highlightNodes: ['A', 'R'] },
    ],
    nodeTooltips: {
      A: 'Agente: combina razonamiento, herramientas y memoria',
      P: 'Planificación: descompone el objetivo en subtareas',
      T: 'Herramientas: APIs, archivos, código, búsqueda',
      M: 'Memoria: retiene contexto entre pasos e interacciones',
    },
  },
  {
    id: 'agent-tools',
    mermaidCode: `graph TD
      A["🤖 Agente"]
      FS["📁 Sistema de Archivos"]
      WEB["🌐 Búsqueda Web"]
      CODE["💻 Ejecutar Código"]
      API["🔗 APIs Externas"]
      DB["🗄️ Base de Datos"]
      A -->|lee/escribe| FS
      A -->|consulta| WEB
      A -->|ejecuta| CODE
      A -->|llama| API
      A -->|query| DB
      style A fill:#1e3a5f,stroke:#60a5fa
      style FS fill:#065f46,stroke:#10b981
      style WEB fill:#065f46,stroke:#10b981
      style CODE fill:#065f46,stroke:#10b981
      style API fill:#065f46,stroke:#10b981
      style DB fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'El agente tiene acceso a múltiples herramientas', highlightNodes: ['A'] },
      { description: 'Puede leer y escribir archivos del sistema', highlightNodes: ['FS'] },
      { description: 'Puede buscar información en la web', highlightNodes: ['WEB'] },
      { description: 'Ejecuta código para cálculos y transformaciones', highlightNodes: ['CODE'] },
      { description: 'Se conecta a APIs y bases de datos externas', highlightNodes: ['API', 'DB'] },
    ],
    nodeTooltips: {
      A: 'Agente que decide qué herramienta usar para cada subtarea',
      FS: 'Lectura, escritura, búsqueda de archivos',
      CODE: 'Ejecución de scripts Python, JS, etc.',
    },
  },
  {
    id: 'function-calling',
    mermaidCode: `graph LR
      U["📝 Prompt"]
      LLM["🧠 LLM"]
      FC["📤 JSON Call"]
      FN["⚙️ Función"]
      RES["📥 Resultado"]
      OUT["💬 Respuesta"]
      U --> LLM
      LLM -->|genera| FC
      FC -->|ejecuta| FN
      FN --> RES
      RES --> LLM
      LLM --> OUT
      style LLM fill:#1e3a5f,stroke:#60a5fa
      style FC fill:#1e1b4b,stroke:#818cf8`,
    steps: [
      { description: 'El usuario envía un prompt al modelo', highlightNodes: ['U'] },
      { description: 'El LLM decide que necesita llamar a una función', highlightNodes: ['LLM'] },
      { description: 'Genera una llamada estructurada en JSON con parámetros', highlightNodes: ['FC'] },
      { description: 'La función se ejecuta y devuelve el resultado', highlightNodes: ['FN', 'RES'] },
      { description: 'El LLM incorpora el resultado en su respuesta final', highlightNodes: ['LLM', 'OUT'] },
    ],
    nodeTooltips: {
      FC: 'Llamada JSON estructurada: nombre de función + argumentos',
      FN: 'Función ejecutada por el sistema host, no por el LLM',
    },
  },
  {
    id: 'agent-memory',
    mermaidCode: `graph TD
      A["🤖 Agente"]
      STM["💭 Memoria Corto Plazo"]
      LTM["💾 Memoria Largo Plazo"]
      EP["📓 Memoria Episódica"]
      VDB["🔍 Vector DB"]
      A -->|contexto actual| STM
      A -->|persistente| LTM
      A -->|experiencias| EP
      LTM --> VDB
      EP --> VDB
      VDB -->|recupera| A
      style A fill:#1e3a5f,stroke:#60a5fa
      style VDB fill:#1e1b4b,stroke:#818cf8`,
    steps: [
      { description: 'El agente utiliza tres tipos de memoria', highlightNodes: ['A'] },
      { description: 'Memoria a corto plazo: ventana de contexto actual', highlightNodes: ['STM'] },
      { description: 'Memoria a largo plazo: hechos persistentes entre sesiones', highlightNodes: ['LTM'] },
      { description: 'Memoria episódica: experiencias y resultados pasados', highlightNodes: ['EP'] },
      { description: 'Una base de datos vectorial permite recuperación semántica', highlightNodes: ['VDB'] },
    ],
    nodeTooltips: {
      STM: 'Ventana de contexto del LLM (limitada por tokens)',
      LTM: 'Almacenamiento persistente de preferencias y hechos',
      EP: 'Registro de interacciones pasadas y sus resultados',
      VDB: 'Base de datos de vectores para búsqueda semántica',
    },
  },
  {
    id: 'rag',
    mermaidCode: `graph LR
      Q["❓ Consulta"]
      EMB["🔢 Embedding"]
      VDB["🗄️ Vector DB"]
      DOCS["📄 Documentos"]
      CTX["📋 Contexto"]
      LLM["🧠 LLM"]
      ANS["💬 Respuesta"]
      Q --> EMB
      EMB -->|busca| VDB
      VDB -->|top-k| DOCS
      DOCS --> CTX
      Q --> CTX
      CTX --> LLM
      LLM --> ANS
      style VDB fill:#1e1b4b,stroke:#818cf8
      style LLM fill:#1e3a5f,stroke:#60a5fa`,
    steps: [
      { description: 'El usuario hace una consulta', highlightNodes: ['Q'] },
      { description: 'La consulta se convierte en un embedding (vector)', highlightNodes: ['EMB'] },
      { description: 'Se buscan los documentos más similares en la base vectorial', highlightNodes: ['VDB', 'DOCS'] },
      { description: 'Los documentos relevantes se agregan como contexto', highlightNodes: ['CTX'] },
      { description: 'El LLM genera la respuesta usando el contexto recuperado', highlightNodes: ['LLM', 'ANS'] },
    ],
    nodeTooltips: {
      EMB: 'Convierte texto en vectores numéricos (ej. OpenAI Ada)',
      VDB: 'Base de datos vectorial: Pinecone, Weaviate, ChromaDB',
      DOCS: 'Fragmentos de documentos más relevantes (top-k)',
    },
  },
  {
    id: 'multi-agent',
    mermaidCode: `graph TD
      O["🎯 Orquestador"]
      P["📋 Planificador"]
      E1["⚡ Ejecutor A"]
      E2["⚡ Ejecutor B"]
      R["✅ Revisor"]
      OUT["📦 Resultado"]
      O -->|planifica| P
      P -->|asigna| E1
      P -->|asigna| E2
      E1 -->|resultado| R
      E2 -->|resultado| R
      R -->|validado| OUT
      R -.->|corregir| P
      style O fill:#7f1d1d,stroke:#ef4444
      style R fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'El orquestador recibe el objetivo y coordina', highlightNodes: ['O'] },
      { description: 'El planificador descompone en subtareas', highlightNodes: ['P'] },
      { description: 'Los ejecutores trabajan en paralelo en sus subtareas', highlightNodes: ['E1', 'E2'] },
      { description: 'El revisor valida los resultados parciales', highlightNodes: ['R'] },
      { description: 'Si hay errores, se repite; si no, se entrega el resultado', highlightNodes: ['OUT'] },
    ],
    nodeTooltips: {
      O: 'Orquestador: decide qué agentes participan',
      P: 'Planificador: descompone la tarea en subtareas',
      E1: 'Agente especializado en un tipo de tarea',
      R: 'Revisor: valida calidad y coherencia',
    },
  },
  {
    id: 'prompt-engineering',
    mermaidCode: `graph TD
      SYS["📜 System Prompt"]
      FS["📌 Few-Shot Examples"]
      COT["🔗 Chain-of-Thought"]
      RP["🎭 Role Prompting"]
      LLM["🧠 LLM"]
      OUT["💬 Output"]
      SYS -->|contexto base| LLM
      FS -->|ejemplos| LLM
      COT -->|razonamiento| LLM
      RP -->|rol/persona| LLM
      LLM --> OUT
      style LLM fill:#1e3a5f,stroke:#60a5fa`,
    steps: [
      { description: 'El System Prompt establece el comportamiento base', highlightNodes: ['SYS'] },
      { description: 'Few-shot: ejemplos que guían el formato de respuesta', highlightNodes: ['FS'] },
      { description: 'Chain-of-Thought: instrucciones de razonar paso a paso', highlightNodes: ['COT'] },
      { description: 'Role Prompting: asigna un rol/persona específica', highlightNodes: ['RP'] },
      { description: 'Combinando técnicas se obtiene la mejor salida', highlightNodes: ['LLM', 'OUT'] },
    ],
    nodeTooltips: {
      SYS: 'Instrucción inicial que define el comportamiento del modelo',
      FS: 'Ejemplos de entrada/salida que el modelo debe seguir',
      COT: 'Forzar razonamiento explícito paso a paso',
      RP: 'Asignar un rol: "Eres un experto en seguridad"',
    },
  },
  {
    id: 'chain-of-thought',
    mermaidCode: `graph LR
      Q["❓ Problema"]
      S1["🔹 Paso 1"]
      S2["🔹 Paso 2"]
      S3["🔹 Paso 3"]
      A["✅ Respuesta"]
      Q --> S1
      S1 --> S2
      S2 --> S3
      S3 --> A
      style Q fill:#1e1b4b,stroke:#818cf8
      style A fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'Se presenta un problema de razonamiento', highlightNodes: ['Q'] },
      { description: 'El modelo identifica el primer paso lógico', highlightNodes: ['S1'] },
      { description: 'Cada paso se construye sobre el anterior', highlightNodes: ['S2'] },
      { description: 'El razonamiento gradual lleva a la respuesta correcta', highlightNodes: ['S3', 'A'] },
    ],
    nodeTooltips: {
      Q: 'Problema que requiere razonamiento multi-paso',
      S1: 'Primer paso: identifica los datos relevantes',
      S2: 'Segundo paso: aplica la lógica necesaria',
      A: 'Respuesta derivada del razonamiento explícito',
    },
  },
];
