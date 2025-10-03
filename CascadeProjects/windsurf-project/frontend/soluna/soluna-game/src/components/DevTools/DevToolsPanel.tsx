export interface DevToolsPanelProps {
  className?: string;
  showFases?: boolean;
  onToggleFases?: () => void;
  showUX?: boolean;
  onToggleUX?: () => void;
  onToggleRules?: () => void;
  showIAPanel?: boolean;
  onToggleIAPanel?: () => void;
}

// DevToolsPanel — Acciones de desarrollo/diagnóstico (presentacional), estilo Quoridor
export default function DevToolsPanel({  
  showFases = false,
  onToggleFases = () => {},
  showUX = false,
  onToggleUX = () => {},
  onToggleRules = () => {},
  showIAPanel = false,
  onToggleIAPanel = () => {},
}: DevToolsPanelProps) {
  return (       
    <>
      <button className="btn btn-secondary" onClick={onToggleRules}>Reglas</button>
      <button
        className={`btn ${showFases ? 'btn-primary' : 'btn-secondary'}`}
        aria-pressed={showFases}
        onClick={onToggleFases}
      >
        Fases
      </button>
      <button
        className={`btn ${showUX ? 'btn-primary' : 'btn-secondary'}`}
        aria-pressed={showUX}
        onClick={onToggleUX}
      >
        UI/UX
      </button>
      <button
        className={`btn ${showIAPanel ? 'btn-primary' : 'btn-secondary'}`}
        aria-pressed={showIAPanel}
        onClick={onToggleIAPanel}
      >
        IAPanel
      </button>
    </>
  );
}

