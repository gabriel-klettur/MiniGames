import type { Concept } from '../types';

export const devopsToolsConcepts: Concept[] = [
  {
    id: 'skills',
    term: 'Skills',
    termEs: 'Skills',
    category: 'devops-tools',
    definition:
      'Módulos de conocimiento especializado que extienden las capacidades de un agente de IA. Proporcionan instrucciones, flujos de trabajo y mejores prácticas para dominios específicos como testing, diseño de APIs o documentación.',
    keyPoints: [
      'Extienden las capacidades de agentes de IA con conocimiento de dominio',
      'Contienen instrucciones probadas y flujos de trabajo especializados',
      'Se pueden combinar múltiples Skills para tareas complejas',
    ],
    relatedConcepts: ['mcp', 'agents'],
    difficulty: 1,
  },
  {
    id: 'mcp',
    term: 'MCP (Model Context Protocol)',
    termEs: 'MCP (Protocolo de Contexto de Modelo)',
    category: 'devops-tools',
    definition:
      'Protocolo abierto que estandariza la comunicación entre aplicaciones de IA y herramientas externas. Permite que los modelos de lenguaje accedan a datos, ejecuten acciones y se integren con servicios de terceros de forma segura y uniforme.',
    keyPoints: [
      'Protocolo abierto que estandariza la conexión IA ↔ herramientas',
      'Permite acceso a datos externos y ejecución de acciones',
      'Arquitectura cliente-servidor con servidores MCP especializados',
    ],
    relatedConcepts: ['skills', 'agents', 'cli'],
    difficulty: 2,
  },
  {
    id: 'cli',
    term: 'CLI (Command Line Interface)',
    termEs: 'CLI (Interfaz de Línea de Comandos)',
    category: 'devops-tools',
    definition:
      'Interfaz de usuario basada en texto que permite interactuar con un sistema operativo o aplicación mediante comandos escritos. Es la herramienta principal de los desarrolladores para automatizar tareas, gestionar servidores y ejecutar scripts.',
    keyPoints: [
      'Interfaz basada en texto para ejecutar comandos del sistema',
      'Fundamental para automatización y scripting',
      'Mayor eficiencia y control que interfaces gráficas para tareas repetitivas',
    ],
    relatedConcepts: ['docker', 'terraform', 'gitlab'],
    difficulty: 1,
  },
  {
    id: 'docker',
    term: 'Docker',
    termEs: 'Docker',
    category: 'devops-tools',
    definition:
      'Plataforma de contenedorización que empaqueta aplicaciones junto con sus dependencias en contenedores ligeros y portables. Garantiza que la aplicación funcione igual en cualquier entorno: desarrollo, testing y producción.',
    keyPoints: [
      'Empaqueta aplicaciones con todas sus dependencias en contenedores',
      'Garantiza consistencia entre entornos (dev, test, prod)',
      'Más ligero que máquinas virtuales al compartir el kernel del host',
    ],
    relatedConcepts: ['kubernetes', 'cli', 'gitlab'],
    difficulty: 1,
  },
  {
    id: 'kubernetes',
    term: 'Kubernetes',
    termEs: 'Kubernetes',
    category: 'devops-tools',
    definition:
      'Sistema de orquestación de contenedores que automatiza el despliegue, escalado y gestión de aplicaciones contenedorizadas. Gestiona clústeres de máquinas, distribuye carga y recupera automáticamente servicios caídos.',
    keyPoints: [
      'Orquesta y gestiona contenedores a gran escala',
      'Autoescalado, auto-recuperación y balanceo de carga automáticos',
      'Usa declaraciones YAML para definir el estado deseado del sistema',
    ],
    relatedConcepts: ['docker', 'terraform'],
    difficulty: 2,
  },
  {
    id: 'terraform',
    term: 'Terraform',
    termEs: 'Terraform',
    category: 'devops-tools',
    definition:
      'Herramienta de Infraestructura como Código (IaC) que permite definir, provisionar y gestionar recursos de infraestructura cloud mediante archivos de configuración declarativos. Soporta múltiples proveedores como AWS, Azure y GCP.',
    keyPoints: [
      'Define infraestructura cloud como código declarativo (IaC)',
      'Soporta múltiples proveedores: AWS, Azure, GCP y más',
      'Gestiona el estado de la infraestructura y aplica cambios incrementales',
    ],
    relatedConcepts: ['kubernetes', 'docker', 'gitlab'],
    difficulty: 2,
  },
  {
    id: 'gitlab',
    term: 'GitLab',
    termEs: 'GitLab',
    category: 'devops-tools',
    definition:
      'Plataforma DevOps completa que integra control de versiones Git, CI/CD (Integración y Despliegue Continuos), gestión de proyectos y registro de contenedores en una sola herramienta. Permite automatizar todo el ciclo de vida del software.',
    keyPoints: [
      'Plataforma DevOps todo-en-uno: Git + CI/CD + gestión de proyectos',
      'Pipelines CI/CD para automatizar build, test y deploy',
      'Incluye registro de contenedores y gestión de artefactos',
    ],
    relatedConcepts: ['docker', 'kubernetes', 'terraform', 'cli'],
    difficulty: 1,
  },
  {
    id: 'dockerfile',
    term: 'Dockerfile',
    termEs: 'Dockerfile',
    category: 'devops-tools',
    definition:
      'Archivo de texto con instrucciones paso a paso para construir una imagen Docker. Define la imagen base, las dependencias a instalar, los archivos a copiar y el comando de inicio del contenedor.',
    keyPoints: [
      'Receta paso a paso para construir imágenes Docker',
      'Define imagen base, dependencias, archivos y comando de arranque',
      'Cada instrucción crea una capa cacheable optimizando rebuilds',
    ],
    relatedConcepts: ['docker', 'docker-compose'],
    difficulty: 2,
  },
  {
    id: 'docker-compose',
    term: 'Docker Compose',
    termEs: 'Docker Compose',
    category: 'devops-tools',
    definition:
      'Herramienta para definir y ejecutar aplicaciones Docker multi-contenedor. Usa un archivo YAML (docker-compose.yml) para configurar servicios, redes y volúmenes, levantando toda la infraestructura con un solo comando.',
    keyPoints: [
      'Orquesta múltiples contenedores con un archivo YAML',
      'Define servicios, redes y volúmenes en docker-compose.yml',
      'Ideal para entornos de desarrollo con múltiples servicios',
    ],
    relatedConcepts: ['docker', 'dockerfile', 'kubernetes'],
    difficulty: 2,
  },
  {
    id: 'ci-cd-pipeline',
    term: 'CI/CD Pipeline',
    termEs: 'Pipeline CI/CD',
    category: 'devops-tools',
    definition:
      'Flujo automatizado que integra, prueba y despliega código de forma continua. CI (Integración Continua) verifica automáticamente cada cambio, y CD (Despliegue Continuo) lo lleva a producción tras pasar todas las validaciones.',
    keyPoints: [
      'CI: compila y testea automáticamente cada commit',
      'CD: despliega automáticamente tras pasar las validaciones',
      'Reduce errores humanos y acelera el ciclo de entrega',
    ],
    relatedConcepts: ['gitlab', 'docker', 'terraform'],
    difficulty: 1,
  },
  {
    id: 'iac',
    term: 'Infrastructure as Code (IaC)',
    termEs: 'Infraestructura como Código (IaC)',
    category: 'devops-tools',
    definition:
      'Práctica de gestionar y provisionar infraestructura mediante archivos de configuración en lugar de procesos manuales. Permite versionar, revisar y reproducir entornos completos de forma automatizada y consistente.',
    keyPoints: [
      'Gestiona infraestructura mediante código versionable',
      'Permite reproducir entornos de forma idéntica y automatizada',
      'Herramientas principales: Terraform, Pulumi, CloudFormation',
    ],
    relatedConcepts: ['terraform', 'gitlab', 'kubernetes'],
    difficulty: 2,
  },
];
