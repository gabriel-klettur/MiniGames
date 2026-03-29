import type { HelpSpec } from './types';

export const enHintsC: HelpSpec[] = [
  // --- DevOps Tools ---
  {
    id: 'skills',
    glossary: [
      { term: 'Knowledge module', explanation: 'Package of specialized instructions for a specific domain.' },
      { term: 'AI Agent', explanation: 'System that uses a language model to execute tasks autonomously.' },
      { term: 'Workflow', explanation: 'Defined sequence of steps to complete a task.' },
      { term: 'Domain', explanation: 'Specific area of knowledge such as testing, security or documentation.' },
    ],
    context: 'Skills allow specializing AI agents for specific tasks, improving the quality of responses in specific domains.',
  },
  {
    id: 'mcp',
    glossary: [
      { term: 'Protocol', explanation: 'Set of rules that define how two systems communicate.' },
      { term: 'JSON-RPC', explanation: 'Remote procedure call protocol that uses JSON as data format.' },
      { term: 'Client-Server', explanation: 'Architecture where a client requests services and a server provides them.' },
      { term: 'External tools', explanation: 'Functions or services outside the AI model that it can invoke.' },
    ],
    context: 'MCP standardizes how AI models connect with the outside world, similar to how USB standardized peripheral connections.',
  },
  {
    id: 'cli',
    glossary: [
      { term: 'Terminal', explanation: 'Application that provides a text interface for executing commands.' },
      { term: 'Shell', explanation: 'Program that interprets user commands (bash, zsh, PowerShell).' },
      { term: 'Scripting', explanation: 'Writing command sequences in a file to automate tasks.' },
      { term: 'Pipeline', explanation: 'Chaining the output of one command as input of another using pipes (|).' },
    ],
    context: 'The command line is the most powerful developer tool for interacting with the operating system and automating tasks.',
  },
  {
    id: 'docker',
    glossary: [
      { term: 'Container', explanation: 'Lightweight software unit that packages code and dependencies together.' },
      { term: 'Image', explanation: 'Immutable template from which containers are created.' },
      { term: 'Dependencies', explanation: 'Libraries and tools the application needs to function.' },
      { term: 'Kernel', explanation: 'Operating system core that manages hardware and processes.' },
    ],
    context: 'Docker solved the classic "it works on my machine" problem by packaging everything needed inside a reproducible container.',
  },
  {
    id: 'kubernetes',
    glossary: [
      { term: 'Orchestration', explanation: 'Automatic management of deployment, scaling and operation of containers.' },
      { term: 'Cluster', explanation: 'Set of machines working together as a unified system.' },
      { term: 'Pod', explanation: 'Minimum deployment unit in Kubernetes, contains one or more containers.' },
      { term: 'Declarative YAML', explanation: 'Configuration format where you describe the desired state, not the steps.' },
    ],
    context: 'Kubernetes automates the management of hundreds or thousands of containers, ensuring availability and performance.',
  },
  {
    id: 'terraform',
    glossary: [
      { term: 'Infrastructure as Code', explanation: 'Managing servers and cloud services through configuration files.' },
      { term: 'Declarative', explanation: 'You describe what you want, not how to achieve it. The system figures out the steps.' },
      { term: 'Cloud provider', explanation: 'Company offering cloud computing services (AWS, Azure, GCP).' },
      { term: 'State', explanation: 'Record of current resources managed by Terraform.' },
    ],
    context: 'Terraform allows creating and modifying cloud infrastructure reproducibly and version-controlled, like source code.',
  },
  {
    id: 'gitlab',
    glossary: [
      { term: 'CI/CD', explanation: 'Continuous Integration and Continuous Deployment: automating the delivery cycle.' },
      { term: 'Version control', explanation: 'System that records code changes over time (Git).' },
      { term: 'Pipeline', explanation: 'Automated flow of steps: compile, test, deploy.' },
      { term: 'Container registry', explanation: 'Store for Docker images ready to be deployed.' },
    ],
    context: 'GitLab unifies in a single platform everything needed for the software lifecycle, from code to production.',
  },
  {
    id: 'dockerfile',
    glossary: [
      { term: 'Base image', explanation: 'Initial Docker image to build upon (e.g., node:18, python:3.11).' },
      { term: 'Layer', explanation: 'Each Dockerfile instruction creates a cacheable layer in the image.' },
      { term: 'Instructions', explanation: 'Dockerfile commands: FROM, RUN, COPY, CMD, EXPOSE, etc.' },
      { term: 'Build', explanation: 'Process of constructing an image from a Dockerfile.' },
    ],
    context: 'The Dockerfile is the recipe that guarantees anyone can build the same image consistently.',
  },
  {
    id: 'docker-compose',
    glossary: [
      { term: 'Multi-container', explanation: 'Application that needs multiple services: web, database, cache, etc.' },
      { term: 'Service', explanation: 'Each container defined in docker-compose.yml with its configuration.' },
      { term: 'Volume', explanation: 'Persistent storage that survives container restarts.' },
      { term: 'Network', explanation: 'Virtual network enabling communication between containers.' },
    ],
    context: 'Docker Compose simplifies local development when the application requires multiple interconnected services.',
  },
  {
    id: 'ci-cd-pipeline',
    glossary: [
      { term: 'Continuous Integration', explanation: 'Automatically verifying every code change with compilation and tests.' },
      { term: 'Continuous Deployment', explanation: 'Automatically bringing validated code to production.' },
      { term: 'Commit', explanation: 'Saving a set of changes in the code repository.' },
      { term: 'Artifact', explanation: 'Build process output: binary, Docker image, package.' },
    ],
    context: 'CI/CD pipelines eliminate error-prone manual steps and accelerate quality software delivery.',
  },
  {
    id: 'iac',
    glossary: [
      { term: 'Provision', explanation: 'Create and configure infrastructure resources (servers, networks, databases).' },
      { term: 'Versionable', explanation: 'Changes can be tracked with Git, rolled back, and history reviewed.' },
      { term: 'Reproducible', explanation: 'The same code generates the same environment each time it runs.' },
      { term: 'Automated', explanation: 'No manual intervention, reducing errors and speeding up processes.' },
    ],
    context: 'IaC treats infrastructure like software: versioned, reviewed in pull requests and deployed automatically.',
  },

  // --- Agents ---
  {
    id: 'agents',
    glossary: [
      { term: 'Autonomous', explanation: 'Capable of operating by itself without constant user intervention.' },
      { term: 'LLM', explanation: 'Large Language Model: large-scale language model like GPT or Claude.' },
      { term: 'Planning', explanation: 'Ability to decompose an objective into executable steps.' },
      { term: 'Perception', explanation: 'Ability to observe and understand the problem environment.' },
    ],
    context: 'AI agents represent the evolution of simple chatbots, going from just answering questions to executing complex tasks.',
  },
  {
    id: 'agent-tools',
    glossary: [
      { term: 'API', explanation: 'Application Programming Interface: gateway to a service.' },
      { term: 'Invoke', explanation: 'Call a function or service to execute an operation.' },
      { term: 'Sandbox', explanation: 'Isolated environment where code runs safely.' },
      { term: 'Capabilities', explanation: 'Concrete actions the agent can perform thanks to a tool.' },
    ],
    context: 'Tools are what differentiates an agent from a chatbot: they allow it to act on the world, not just talk about it.',
  },
  {
    id: 'function-calling',
    glossary: [
      { term: 'Structured call', explanation: 'Invocation with defined format: function name and parameters in JSON.' },
      { term: 'Parameters', explanation: 'Input data that the function needs to execute.' },
      { term: 'JSON Schema', explanation: 'Format that describes the expected structure of input data.' },
      { term: 'Programmatically', explanation: 'In a way that can be automatically processed by code.' },
    ],
    context: 'Function calling is the mechanism allowing LLMs to go from generating only text to interacting with real systems.',
  },
  {
    id: 'agent-memory',
    glossary: [
      { term: 'Short-term', explanation: 'Information available during the current conversation (context window).' },
      { term: 'Long-term', explanation: 'Information that persists between different conversations or sessions.' },
      { term: 'Episodic', explanation: 'Memories of specific past experiences and their results.' },
      { term: 'Context window', explanation: 'Maximum amount of text an LLM can process at once.' },
    ],
    context: 'Memory solves a fundamental LLM limitation: by themselves, they remember nothing between conversations.',
  },
  {
    id: 'rag',
    glossary: [
      { term: 'Retrieval', explanation: 'Process of searching and recovering relevant documents from a database.' },
      { term: 'Augmented', explanation: 'Generation is "augmented" with externally retrieved information.' },
      { term: 'Hallucination', explanation: 'When the model invents false information that sounds convincing.' },
      { term: 'Semantic search', explanation: 'Searching by meaning, not exact word matching.' },
    ],
    context: 'RAG enables models to give answers based on updated and specific data without retraining.',
  },
  {
    id: 'multi-agent',
    glossary: [
      { term: 'Specialized agent', explanation: 'Agent designed for a specific type of task.' },
      { term: 'Coordination', explanation: 'Process of organizing the actions of multiple agents.' },
      { term: 'Subtask', explanation: 'Part of a larger problem an agent can solve individually.' },
      { term: 'Inter-agent comm.', explanation: 'Information exchange between agents in the system.' },
    ],
    context: 'Like human teams with specialized roles, multi-agent systems divide work according to each agent strengths.',
  },
  {
    id: 'agent-orchestrator',
    glossary: [
      { term: 'Orchestrate', explanation: 'Coordinate and direct execution of multiple components or agents.' },
      { term: 'Dependencies', explanation: 'Relationships where one task needs the result of another to begin.' },
      { term: 'Conditional flow', explanation: 'Execution that takes different paths based on conditions.' },
      { term: 'Consolidate', explanation: 'Combine partial results into a coherent final output.' },
    ],
    context: 'The orchestrator is like a conductor: it plays no instrument but coordinates all the musicians.',
  },
  {
    id: 'prompt-engineering',
    glossary: [
      { term: 'Prompt', explanation: 'Instruction or input text sent to the AI model.' },
      { term: 'Few-shot', explanation: 'Giving the model a few input/output examples to guide behavior.' },
      { term: 'System prompt', explanation: 'Initial instruction establishing the model role and rules.' },
      { term: 'Role prompting', explanation: 'Assigning a character or role to the model to influence responses.' },
    ],
    context: 'Prompt engineering is the skill of effectively communicating with AI models to get the best results.',
  },
  {
    id: 'chain-of-thought',
    glossary: [
      { term: 'Step-by-step reasoning', explanation: 'Solving a problem by dividing the process into explicit intermediate steps.' },
      { term: 'Logic', explanation: 'Deduction process based on premises to reach a conclusion.' },
      { term: 'Thought process', explanation: 'The reasoning sequence that leads to a conclusion.' },
      { term: 'Verifiable', explanation: 'The correctness of each intermediate step can be checked.' },
    ],
    context: 'Chain-of-Thought mimics how humans solve problems: thinking out loud and building the answer step by step.',
  },
  {
    id: 'embeddings',
    glossary: [
      { term: 'Vector', explanation: 'List of numbers representing a position in a multidimensional space.' },
      { term: 'Semantic', explanation: 'Related to meaning, not the form of words.' },
      { term: 'Cosine similarity', explanation: 'Measure of how similar two vectors are by their angle.' },
      { term: 'Vector space', explanation: 'Mathematical space where similar concepts are close together.' },
    ],
    context: 'Embeddings translate human language into numbers that machines can compare and search efficiently.',
  },
  {
    id: 'guardrails',
    glossary: [
      { term: 'Validation', explanation: 'Process of verifying that data or actions comply with rules.' },
      { term: 'Content filter', explanation: 'Mechanism that blocks inappropriate or dangerous content.' },
      { term: 'Action limit', explanation: 'Restriction on the number or type of actions the agent can perform.' },
      { term: 'Human review', explanation: 'A human verifies and approves critical agent actions.' },
    ],
    context: 'Guardrails are like bridge railings: they let the agent move freely but within safe boundaries.',
  },
];
