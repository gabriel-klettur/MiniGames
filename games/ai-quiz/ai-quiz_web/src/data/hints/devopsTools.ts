import type { HelpSpec } from './types';

export const devopsToolsHints: HelpSpec[] = [
  {
    id: 'skills',
    glossary: [
      { term: 'Módulo de conocimiento', explanation: 'Paquete de instrucciones especializadas para un dominio concreto.' },
      { term: 'Agente de IA', explanation: 'Sistema que usa un modelo de lenguaje para ejecutar tareas de forma autónoma.' },
      { term: 'Flujo de trabajo', explanation: 'Secuencia de pasos definidos para completar una tarea.' },
      { term: 'Dominio', explanation: 'Área de conocimiento específica como testing, seguridad o documentación.' },
    ],
    context: 'Los Skills permiten especializar agentes de IA en tareas concretas, mejorando la calidad de sus respuestas en dominios específicos.',
  },
  {
    id: 'mcp',
    glossary: [
      { term: 'Protocolo', explanation: 'Conjunto de reglas que definen cómo se comunican dos sistemas.' },
      { term: 'JSON-RPC', explanation: 'Protocolo de llamada a procedimiento remoto que usa JSON como formato de datos.' },
      { term: 'Cliente-Servidor', explanation: 'Arquitectura donde un cliente solicita servicios y un servidor los proporciona.' },
      { term: 'Herramientas externas', explanation: 'Funciones o servicios fuera del modelo de IA que este puede invocar.' },
    ],
    context: 'MCP estandariza cómo los modelos de IA se conectan con el mundo exterior, similar a cómo USB estandarizó la conexión de periféricos.',
  },
  {
    id: 'cli',
    glossary: [
      { term: 'Terminal', explanation: 'Aplicación que proporciona una interfaz de texto para ejecutar comandos.' },
      { term: 'Shell', explanation: 'Programa que interpreta los comandos del usuario (bash, zsh, PowerShell).' },
      { term: 'Scripting', explanation: 'Escribir secuencias de comandos en un archivo para automatizar tareas.' },
      { term: 'Pipeline', explanation: 'Encadenar la salida de un comando como entrada de otro usando pipes (|).' },
    ],
    context: 'La línea de comandos es la herramienta más poderosa del desarrollador para interactuar con el sistema operativo y automatizar tareas.',
  },
  {
    id: 'docker',
    glossary: [
      { term: 'Contenedor', explanation: 'Unidad ligera de software que empaqueta código y dependencias juntos.' },
      { term: 'Imagen', explanation: 'Plantilla inmutable a partir de la cual se crean contenedores.' },
      { term: 'Dependencias', explanation: 'Librerías y herramientas que la aplicación necesita para funcionar.' },
      { term: 'Kernel', explanation: 'Núcleo del sistema operativo que gestiona hardware y procesos.' },
    ],
    context: 'Docker resolvió el clásico problema de "en mi máquina funciona" al empaquetar todo lo necesario dentro de un contenedor reproducible.',
  },
  {
    id: 'kubernetes',
    glossary: [
      { term: 'Orquestación', explanation: 'Gestión automática del despliegue, escalado y operación de contenedores.' },
      { term: 'Clúster', explanation: 'Conjunto de máquinas que trabajan juntas como un sistema unificado.' },
      { term: 'Pod', explanation: 'Unidad mínima de despliegue en Kubernetes, contiene uno o más contenedores.' },
      { term: 'YAML declarativo', explanation: 'Formato de configuración donde describes el estado deseado, no los pasos.' },
    ],
    context: 'Kubernetes automatiza la gestión de cientos o miles de contenedores, garantizando disponibilidad y rendimiento.',
  },
  {
    id: 'terraform',
    glossary: [
      { term: 'Infraestructura como Código', explanation: 'Gestionar servidores y servicios cloud mediante archivos de configuración.' },
      { term: 'Declarativo', explanation: 'Describes qué quieres, no cómo conseguirlo. El sistema calcula los pasos.' },
      { term: 'Proveedor cloud', explanation: 'Empresa que ofrece servicios de computación en la nube (AWS, Azure, GCP).' },
      { term: 'Estado', explanation: 'Registro de los recursos actuales gestionados por Terraform.' },
    ],
    context: 'Terraform permite crear y modificar infraestructura cloud de forma reproducible y versionable, como si fuera código fuente.',
  },
  {
    id: 'gitlab',
    glossary: [
      { term: 'CI/CD', explanation: 'Integración Continua y Despliegue Continuo: automatización del ciclo de entrega.' },
      { term: 'Control de versiones', explanation: 'Sistema que registra los cambios del código a lo largo del tiempo (Git).' },
      { term: 'Pipeline', explanation: 'Flujo automatizado de pasos: compilar, testear, desplegar.' },
      { term: 'Registro de contenedores', explanation: 'Almacén de imágenes Docker listo para ser desplegadas.' },
    ],
    context: 'GitLab unifica en una sola plataforma todo lo necesario para el ciclo de vida del software, desde el código hasta producción.',
  },
  {
    id: 'dockerfile',
    glossary: [
      { term: 'Imagen base', explanation: 'Imagen Docker inicial sobre la que se construye (ej. node:18, python:3.11).' },
      { term: 'Capa', explanation: 'Cada instrucción del Dockerfile crea una capa cacheable en la imagen.' },
      { term: 'Instrucciones', explanation: 'Comandos del Dockerfile: FROM, RUN, COPY, CMD, EXPOSE, etc.' },
      { term: 'Build', explanation: 'Proceso de construir una imagen a partir del Dockerfile.' },
    ],
    context: 'El Dockerfile es la receta que garantiza que cualquier persona puede construir la misma imagen de forma consistente.',
  },
  {
    id: 'docker-compose',
    glossary: [
      { term: 'Multi-contenedor', explanation: 'Aplicación que necesita varios servicios: web, base de datos, cache, etc.' },
      { term: 'Servicio', explanation: 'Cada contenedor definido en docker-compose.yml con su configuración.' },
      { term: 'Volumen', explanation: 'Almacenamiento persistente que sobrevive al reinicio del contenedor.' },
      { term: 'Red', explanation: 'Red virtual que permite la comunicación entre contenedores.' },
    ],
    context: 'Docker Compose simplifica el desarrollo local cuando la aplicación requiere múltiples servicios interconectados.',
  },
  {
    id: 'ci-cd-pipeline',
    glossary: [
      { term: 'Integración Continua', explanation: 'Verificar automáticamente cada cambio de código con compilación y tests.' },
      { term: 'Despliegue Continuo', explanation: 'Llevar automáticamente el código validado a producción.' },
      { term: 'Commit', explanation: 'Guardar un conjunto de cambios en el repositorio de código.' },
      { term: 'Artefacto', explanation: 'Resultado del proceso de build: binario, imagen Docker, paquete.' },
    ],
    context: 'Los pipelines CI/CD eliminan pasos manuales propensos a errores y aceleran la entrega de software de calidad.',
  },
  {
    id: 'iac',
    glossary: [
      { term: 'Provisionar', explanation: 'Crear y configurar recursos de infraestructura (servidores, redes, bases de datos).' },
      { term: 'Versionable', explanation: 'Se puede rastrear cambios con Git, hacer rollback, y revisar historial.' },
      { term: 'Reproducible', explanation: 'El mismo código genera el mismo entorno cada vez que se ejecuta.' },
      { term: 'Automatizado', explanation: 'Sin intervención manual, reduciendo errores y acelerando procesos.' },
    ],
    context: 'IaC trata la infraestructura como software: se versiona, se revisa en pull requests y se despliega automáticamente.',
  },
];
