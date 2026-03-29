import type { DiagramSpec } from './types';

export const devopsToolsDiagrams: DiagramSpec[] = [
  {
    id: 'skills',
    mermaidCode: `graph TD
      A["🤖 Agente IA"]
      S1["📐 Skill: Testing"]
      S2["📐 Skill: API Design"]
      S3["📐 Skill: Docs"]
      T["📋 Tarea del Usuario"]
      R["✅ Resultado"]
      T -->|solicita| A
      A -->|carga| S1
      A -->|carga| S2
      A -->|carga| S3
      S1 -->|instrucciones| A
      S2 -->|instrucciones| A
      S3 -->|instrucciones| A
      A -->|ejecuta| R
      style A fill:#1e3a5f,stroke:#60a5fa
      style S1 fill:#1e1b4b,stroke:#818cf8
      style S2 fill:#1e1b4b,stroke:#818cf8
      style S3 fill:#1e1b4b,stroke:#818cf8`,
    steps: [
      { description: 'El usuario envía una tarea al agente de IA', highlightNodes: ['T'] },
      { description: 'El agente determina qué Skills necesita para la tarea', highlightNodes: ['A'] },
      { description: 'Carga los Skills relevantes con instrucciones especializadas', highlightNodes: ['S1', 'S2', 'S3'] },
      { description: 'Las instrucciones del Skill guían al agente en su ejecución', highlightNodes: ['A', 'R'] },
    ],
    nodeTooltips: {
      A: 'Agente IA que combina múltiples Skills para resolver tareas',
      S1: 'Skill con mejores prácticas de testing',
      S2: 'Skill con patrones de diseño de APIs',
      S3: 'Skill con guías de documentación',
      T: 'La tarea solicitada por el usuario',
    },
  },
  {
    id: 'mcp',
    mermaidCode: `graph LR
      App["🖥️ App IA"]
      Client["📡 Cliente MCP"]
      Server1["⚙️ Servidor MCP\\nArchivos"]
      Server2["⚙️ Servidor MCP\\nBD"]
      Server3["⚙️ Servidor MCP\\nAPI"]
      App --> Client
      Client -->|JSON-RPC| Server1
      Client -->|JSON-RPC| Server2
      Client -->|JSON-RPC| Server3
      style App fill:#1e3a5f,stroke:#60a5fa
      style Client fill:#065f46,stroke:#10b981
      style Server1 fill:#1e1b4b,stroke:#818cf8
      style Server2 fill:#1e1b4b,stroke:#818cf8
      style Server3 fill:#1e1b4b,stroke:#818cf8`,
    steps: [
      { description: 'La aplicación IA necesita acceder a recursos externos', highlightNodes: ['App'] },
      { description: 'El cliente MCP gestiona la comunicación con los servidores', highlightNodes: ['Client'] },
      { description: 'Cada servidor MCP expone herramientas especializadas', highlightNodes: ['Server1', 'Server2', 'Server3'] },
      { description: 'Comunicación estandarizada via JSON-RPC entre todos', highlightNodes: ['Client', 'Server1', 'Server2', 'Server3'] },
    ],
    nodeTooltips: {
      App: 'Aplicación de IA (ej. VS Code, Claude Desktop)',
      Client: 'Intermediario que conecta con los servidores MCP',
      Server1: 'Servidor que da acceso al sistema de archivos',
      Server2: 'Servidor que da acceso a bases de datos',
      Server3: 'Servidor que da acceso a APIs externas',
    },
  },
  {
    id: 'cli',
    mermaidCode: `graph TD
      U["👤 Usuario"]
      T["💻 Terminal"]
      S["🖥️ Shell"]
      C1["📄 Comando 1"]
      C2["📄 Comando 2"]
      P["⚙️ Pipeline"]
      R["📋 Resultado"]
      U -->|escribe| T
      T -->|interpreta| S
      S --> C1
      S --> C2
      C1 -->|pipe| P
      C2 -->|pipe| P
      P --> R
      style T fill:#1e3a5f,stroke:#60a5fa
      style S fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'El usuario escribe comandos en la terminal', highlightNodes: ['U', 'T'] },
      { description: 'El shell interpreta y ejecuta los comandos', highlightNodes: ['S'] },
      { description: 'Los comandos pueden encadenarse con pipes', highlightNodes: ['C1', 'C2', 'P'] },
      { description: 'El resultado se muestra al usuario', highlightNodes: ['R'] },
    ],
    nodeTooltips: {
      T: 'Terminal: interfaz de texto para interactuar con el sistema',
      S: 'Shell: intérprete de comandos (bash, zsh, PowerShell)',
      P: 'Pipeline: encadena la salida de un comando como entrada de otro',
    },
  },
  {
    id: 'docker',
    mermaidCode: `graph TD
      DF["📄 Dockerfile"]
      IMG["📦 Imagen"]
      C1["🐳 Contenedor 1"]
      C2["🐳 Contenedor 2"]
      REG["☁️ Registry"]
      HOST["🖥️ Host OS"]
      DF -->|build| IMG
      IMG -->|push| REG
      REG -->|pull| IMG
      IMG -->|run| C1
      IMG -->|run| C2
      C1 --> HOST
      C2 --> HOST
      style IMG fill:#1e3a5f,stroke:#60a5fa
      style C1 fill:#065f46,stroke:#10b981
      style C2 fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'Se define la aplicación en un Dockerfile', highlightNodes: ['DF'] },
      { description: 'Se construye (build) una imagen inmutable', highlightNodes: ['IMG'] },
      { description: 'La imagen se sube a un registry para compartir', highlightNodes: ['REG'] },
      { description: 'Se ejecutan contenedores aislados desde la imagen', highlightNodes: ['C1', 'C2'] },
      { description: 'Los contenedores comparten el kernel del host', highlightNodes: ['HOST'] },
    ],
    nodeTooltips: {
      DF: 'Receta con instrucciones para construir la imagen',
      IMG: 'Imagen inmutable con la app y sus dependencias',
      C1: 'Instancia en ejecución de la imagen',
      REG: 'Docker Hub u otro registro de imágenes',
      HOST: 'Sistema operativo que ejecuta los contenedores',
    },
  },
  {
    id: 'kubernetes',
    mermaidCode: `graph TD
      M["🎛️ Control Plane"]
      N1["📦 Node 1"]
      N2["📦 Node 2"]
      P1["🐳 Pod A"]
      P2["🐳 Pod B"]
      P3["🐳 Pod C"]
      SVC["🔀 Service"]
      M -->|gestiona| N1
      M -->|gestiona| N2
      N1 --> P1
      N1 --> P2
      N2 --> P3
      SVC -->|balancea| P1
      SVC -->|balancea| P2
      SVC -->|balancea| P3
      style M fill:#7f1d1d,stroke:#ef4444
      style SVC fill:#1e3a5f,stroke:#60a5fa`,
    steps: [
      { description: 'El Control Plane gestiona el estado del clúster', highlightNodes: ['M'] },
      { description: 'Los Nodes son las máquinas donde se ejecutan los Pods', highlightNodes: ['N1', 'N2'] },
      { description: 'Los Pods son la unidad mínima de despliegue (uno o más contenedores)', highlightNodes: ['P1', 'P2', 'P3'] },
      { description: 'Los Services balancean el tráfico entre los Pods', highlightNodes: ['SVC'] },
    ],
    nodeTooltips: {
      M: 'Control Plane: API Server, Scheduler, etcd',
      N1: 'Worker Node con kubelet y container runtime',
      P1: 'Pod: uno o más contenedores que comparten red y almacenamiento',
      SVC: 'Service: abstracción de red que balancea entre pods',
    },
  },
  {
    id: 'terraform',
    mermaidCode: `graph LR
      HCL["📄 .tf Files"]
      PLAN["📋 Plan"]
      STATE["💾 State"]
      AWS["☁️ AWS"]
      AZ["☁️ Azure"]
      GCP["☁️ GCP"]
      HCL -->|terraform plan| PLAN
      PLAN -->|terraform apply| STATE
      STATE -->|provisiona| AWS
      STATE -->|provisiona| AZ
      STATE -->|provisiona| GCP
      style HCL fill:#1e1b4b,stroke:#818cf8
      style STATE fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'Se define la infraestructura en archivos .tf (HCL)', highlightNodes: ['HCL'] },
      { description: 'terraform plan muestra los cambios a realizar', highlightNodes: ['PLAN'] },
      { description: 'terraform apply ejecuta los cambios y actualiza el estado', highlightNodes: ['STATE'] },
      { description: 'Los recursos se crean en los proveedores cloud', highlightNodes: ['AWS', 'AZ', 'GCP'] },
    ],
    nodeTooltips: {
      HCL: 'Archivos de configuración en HashiCorp Configuration Language',
      PLAN: 'Vista previa de los cambios antes de aplicarlos',
      STATE: 'Archivo que rastrea el estado actual de la infraestructura',
    },
  },
  {
    id: 'gitlab',
    mermaidCode: `graph LR
      DEV["👩‍💻 Developer"]
      GIT["📂 Git Repo"]
      CI["⚙️ CI Pipeline"]
      TEST["🧪 Tests"]
      BUILD["📦 Build"]
      CD["🚀 CD Deploy"]
      PROD["☁️ Producción"]
      DEV -->|push| GIT
      GIT -->|trigger| CI
      CI --> TEST
      CI --> BUILD
      BUILD --> CD
      CD -->|deploy| PROD
      style CI fill:#1e3a5f,stroke:#60a5fa
      style PROD fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'El developer hace push de código al repositorio', highlightNodes: ['DEV', 'GIT'] },
      { description: 'GitLab CI se activa automáticamente con el push', highlightNodes: ['CI'] },
      { description: 'Se ejecutan tests y se construyen artefactos', highlightNodes: ['TEST', 'BUILD'] },
      { description: 'Si todo pasa, el CD despliega automáticamente a producción', highlightNodes: ['CD', 'PROD'] },
    ],
    nodeTooltips: {
      CI: 'Pipeline de Integración Continua definido en .gitlab-ci.yml',
      CD: 'Despliegue Continuo: automatiza la puesta en producción',
      GIT: 'Repositorio Git alojado en GitLab',
    },
  },
  {
    id: 'ci-cd-pipeline',
    mermaidCode: `graph LR
      C["💻 Commit"]
      B["🔨 Build"]
      T["🧪 Test"]
      S["📊 Static Analysis"]
      STG["🟡 Staging"]
      PRD["🟢 Production"]
      C --> B
      B --> T
      T --> S
      S -->|aprobado| STG
      STG -->|validado| PRD
      style C fill:#1e1b4b,stroke:#818cf8
      style PRD fill:#065f46,stroke:#10b981`,
    steps: [
      { description: 'Un commit dispara el pipeline automáticamente', highlightNodes: ['C'] },
      { description: 'Se compila y construye la aplicación', highlightNodes: ['B'] },
      { description: 'Se ejecutan tests unitarios, integración y E2E', highlightNodes: ['T'] },
      { description: 'Análisis estático de calidad y seguridad', highlightNodes: ['S'] },
      { description: 'Despliegue a staging y luego a producción', highlightNodes: ['STG', 'PRD'] },
    ],
    nodeTooltips: {
      C: 'Cada commit dispara el pipeline',
      T: 'Tests automatizados: unitarios, integración, E2E',
      S: 'Linting, SAST, análisis de dependencias',
      STG: 'Entorno de pre-producción para validación final',
    },
  },
];
