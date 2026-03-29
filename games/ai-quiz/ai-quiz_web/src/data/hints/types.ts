export interface GlossaryEntry {
  /** The jargon/term being explained */
  term: string;
  /** Plain-language explanation (must NOT reveal the concept answer) */
  explanation: string;
}

export interface HelpSpec {
  /** Must match the corresponding Concept.id */
  id: string;
  /** Glossary entries explaining jargon in the concept's definition */
  glossary: GlossaryEntry[];
  /** General context about the domain area */
  context: string;
}
