export interface DevToolsPanelProps {
  className?: string;
  showUX?: boolean;
  onToggleUX?: () => void;
  showIAPanel?: boolean;
  onToggleIAPanel?: () => void;
  showInfoIA?: boolean;
  onToggleInfoIA?: () => void;
}

// DevToolsPanel — Acciones de desarrollo/diagnóstico (presentacional), estilo Quoridor
export default function DevToolsPanel({  
  showUX = false,
  onToggleUX = () => {},
  showIAPanel = false,
  onToggleIAPanel = () => {},
  showInfoIA = false,
  onToggleInfoIA = () => {},
}: DevToolsPanelProps) {
  return (       
    <div style={{ width: '100%', maxWidth: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
      <button
        className={`btn ${showInfoIA ? 'btn-primary' : 'btn-secondary'}`}
        aria-pressed={showInfoIA}
        onClick={onToggleInfoIA}
      >
        InfoIA
      </button>
    </div>
  );
}

