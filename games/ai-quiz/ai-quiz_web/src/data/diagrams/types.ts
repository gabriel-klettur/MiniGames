export interface AnimationStep {
  /** Short description shown below the diagram */
  description: string;
  /** Mermaid node IDs to highlight in this step */
  highlightNodes: string[];
  /** Optional edge labels to highlight */
  highlightEdges?: string[];
}

export interface DiagramSpec {
  /** Must match the corresponding Concept.id */
  id: string;
  /** Mermaid syntax string defining the diagram */
  mermaidCode: string;
  /** Ordered animation steps for step-through mode */
  steps: AnimationStep[];
  /** Map of nodeId → tooltip text shown on click */
  nodeTooltips?: Record<string, string>;
}
