/** English overrides for concept definitions and keyPoints (devops-tools + agents) */
interface ConceptOverride {
  definition: string;
  keyPoints: string[];
}

export const enConceptsC: Record<string, ConceptOverride> = {
  // --- DevOps Tools ---
  skills: {
    definition: 'Specialized knowledge modules that extend the capabilities of an AI agent. They provide instructions, workflows and best practices for specific domains like testing, API design or documentation.',
    keyPoints: ['Extend AI agent capabilities with domain knowledge', 'Contain tested instructions and specialized workflows', 'Multiple Skills can be combined for complex tasks'],
  },
  mcp: {
    definition: 'Open protocol that standardizes communication between AI applications and external tools. Allows language models to access data, execute actions and integrate with third-party services securely and uniformly.',
    keyPoints: ['Open protocol standardizing AI ↔ tools connection', 'Enables access to external data and action execution', 'Client-server architecture with specialized MCP servers'],
  },
  cli: {
    definition: 'Text-based user interface that allows interaction with an operating system or application through written commands. It is the primary tool for developers to automate tasks, manage servers and execute scripts.',
    keyPoints: ['Text-based interface for executing system commands', 'Fundamental for automation and scripting', 'Greater efficiency and control than GUIs for repetitive tasks'],
  },
  docker: {
    definition: 'Containerization platform that packages applications together with their dependencies in lightweight, portable containers. Guarantees the application works identically in any environment: development, testing and production.',
    keyPoints: ['Packages applications with all dependencies in containers', 'Guarantees consistency across environments (dev, test, prod)', 'Lighter than VMs by sharing the host kernel'],
  },
  kubernetes: {
    definition: 'Container orchestration system that automates deployment, scaling and management of containerized applications. Manages machine clusters, distributes load and automatically recovers failed services.',
    keyPoints: ['Orchestrates and manages containers at scale', 'Auto-scaling, self-healing and automatic load balancing', 'Uses YAML declarations to define the desired system state'],
  },
  terraform: {
    definition: 'Infrastructure as Code (IaC) tool that allows defining, provisioning and managing cloud infrastructure resources through declarative configuration files. Supports multiple providers like AWS, Azure and GCP.',
    keyPoints: ['Defines cloud infrastructure as declarative code (IaC)', 'Supports multiple providers: AWS, Azure, GCP and more', 'Manages infrastructure state and applies incremental changes'],
  },
  gitlab: {
    definition: 'Complete DevOps platform that integrates Git version control, CI/CD (Continuous Integration and Deployment), project management and container registry in a single tool. Enables automating the entire software lifecycle.',
    keyPoints: ['All-in-one DevOps platform: Git + CI/CD + project management', 'CI/CD pipelines to automate build, test and deploy', 'Includes container registry and artifact management'],
  },
  dockerfile: {
    definition: 'Text file with step-by-step instructions to build a Docker image. Defines the base image, dependencies to install, files to copy and the container startup command.',
    keyPoints: ['Step-by-step recipe for building Docker images', 'Defines base image, dependencies, files and startup command', 'Each instruction creates a cacheable layer optimizing rebuilds'],
  },
  'docker-compose': {
    definition: 'Tool for defining and running multi-container Docker applications. Uses a YAML file (docker-compose.yml) to configure services, networks and volumes, launching all infrastructure with a single command.',
    keyPoints: ['Orchestrates multiple containers with a single YAML file', 'Defines services, networks and volumes in docker-compose.yml', 'Ideal for development environments with multiple services'],
  },
  'ci-cd-pipeline': {
    definition: 'Automated flow that continuously integrates, tests and deploys code. CI (Continuous Integration) automatically verifies each change, and CD (Continuous Deployment) pushes it to production after passing all validations.',
    keyPoints: ['CI: automatically compiles and tests every commit', 'CD: automatically deploys after passing validations', 'Reduces human errors and accelerates the delivery cycle'],
  },
  iac: {
    definition: 'Practice of managing and provisioning infrastructure through configuration files instead of manual processes. Enables versioning, reviewing and reproducing complete environments in an automated and consistent manner.',
    keyPoints: ['Manages infrastructure through versionable code', 'Enables identical and automated environment reproduction', 'Main tools: Terraform, Pulumi, CloudFormation'],
  },

  // --- Agents ---
  agents: {
    definition: 'Autonomous AI systems capable of perceiving their environment, reasoning about it and executing actions to achieve goals. They combine language models with tools, memory and planning capabilities to solve complex tasks autonomously.',
    keyPoints: ['Autonomous systems that perceive, reason and act', 'Combine LLMs with tools, memory and planning', 'Can decompose and solve complex tasks autonomously'],
  },
  'agent-tools': {
    definition: 'External functions or APIs that an AI agent can invoke to interact with the real world. These include file access, web search, code execution, third-party APIs and databases, enormously expanding the model capabilities.',
    keyPoints: ['External functions the agent invokes to act', 'Include file read/write, search, code execution', 'Connect the agent with real-world systems and data'],
  },
  'function-calling': {
    definition: 'Capability of language models to generate structured calls to external functions. The model decides when and with what parameters to invoke a function, enabling programmatic integration with APIs and tools.',
    keyPoints: ['The model generates structured (JSON) function calls', 'Autonomously decides when and with what parameters to call', 'Fundamental basis of the agent-with-tools pattern'],
  },
  'agent-memory': {
    definition: 'System that allows agents to retain and retrieve information between interactions. Includes short-term memory (conversation context), long-term memory (persistent across sessions) and episodic memory (past experiences).',
    keyPoints: ['Short-term memory: current conversation context', 'Long-term memory: persists across agent sessions', 'Enables the agent to learn from previous experiences'],
  },
  rag: {
    definition: 'Technique that improves AI model responses by retrieving relevant documents from a knowledge base before generating the response. Combines semantic search with generation, reducing hallucinations and providing up-to-date information.',
    keyPoints: ['Retrieves relevant documents before generating responses', 'Reduces hallucinations by providing factual context', 'Combines semantic search with text generation'],
  },
  'multi-agent': {
    definition: 'Architecture where multiple specialized agents collaborate to solve complex problems. Each agent has a specific role (planner, executor, reviewer) and they communicate to coordinate tasks and share results.',
    keyPoints: ['Multiple agents with specialized roles collaborate', 'Each agent focuses on a specific subtask', 'Communication and coordination between agents to solve complex problems'],
  },
  'agent-orchestrator': {
    definition: 'Central component that coordinates the execution of multiple agents or steps in a workflow. Decides which agent to run, manages task dependencies, handles errors and consolidates partial results.',
    keyPoints: ['Coordinates execution of multiple agents or steps', 'Manages dependencies, errors and partial results', 'Implements patterns like sequential, parallel or conditional'],
  },
  'prompt-engineering': {
    definition: 'Discipline of designing and optimizing instructions (prompts) given to AI models to obtain precise and useful responses. Includes techniques like few-shot, chain-of-thought and system prompts that guide model behavior.',
    keyPoints: ['Designs precise instructions to guide the model', 'Techniques: few-shot, chain-of-thought, role prompting', 'Fundamental for obtaining quality results from agents'],
  },
  'chain-of-thought': {
    definition: 'Prompting technique that asks the model to reason step by step before giving a final answer. Significantly improves performance on reasoning, math and logic tasks by making the thought process explicit.',
    keyPoints: ['The model reasons step by step before answering', 'Improves performance on logic and math tasks', 'Makes the reasoning process explicit and verifiable'],
  },
  embeddings: {
    definition: 'Numerical representations (vectors) of text, images or other data that capture their semantic meaning. Similar texts produce nearby vectors, enabling semantic search, clustering and concept comparison.',
    keyPoints: ['Numerical vectors representing semantic meaning', 'Similar texts generate nearby vectors in the space', 'Foundation for semantic search and RAG systems'],
  },
  guardrails: {
    definition: 'Safety mechanisms that limit and validate the actions of AI agents. Include content filters, input/output validation, action limits and human review to prevent unwanted or dangerous behaviors.',
    keyPoints: ['Limit and validate the agent actions', 'Include content filters and I/O validation', 'Essential for agent safety and reliability'],
  },
};
