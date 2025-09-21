export interface DevToolsPanelProps {
  className?: string;
  showIA?: boolean;
  onToggleIA?: () => void;
  showHistory?: boolean;
  onToggleHistory?: () => void;
  showFases?: boolean;
  onToggleFases?: () => void;
  showUX?: boolean;
  onToggleUX?: () => void;
  onToggleRules?: () => void;
}

/**
 * DevToolsPanel — Acciones de desarrollo/diagnóstico (presentacional).
 */
export default function DevToolsPanel({
  className,
  showIA = false,
  onToggleIA = () => {},
  showHistory = false,
  onToggleHistory = () => {},
  showFases = false,
  onToggleFases = () => {},
  showUX = false,
  onToggleUX = () => {},
  onToggleRules = () => {},
}: DevToolsPanelProps) {
  return (
    <div className={["rounded-lg", "border", "border-white/10", "bg-gray-900/50", "p-4", className ?? ""].join(" ").trim()}>
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-sm" onClick={onToggleRules}>
          Reglas
        </button>
        <button
          className={["px-3 py-1.5 rounded-md text-sm", showFases ? "bg-blue-700 hover:bg-blue-600" : "bg-gray-800 hover:bg-gray-700"].join(" ")}
          aria-pressed={showFases}
          onClick={onToggleFases}
        >
          Fases
        </button>
        <button
          className={["px-3 py-1.5 rounded-md text-sm", showHistory ? "bg-blue-700 hover:bg-blue-600" : "bg-gray-800 hover:bg-gray-700"].join(" ")}
          aria-pressed={showHistory}
          onClick={onToggleHistory}
        >
          Historial
        </button>
        <button
          className={["px-3 py-1.5 rounded-md text-sm", showIA ? "bg-blue-700 hover:bg-blue-600" : "bg-gray-800 hover:bg-gray-700"].join(" ")}
          aria-pressed={showIA}
          onClick={onToggleIA}
        >
          IA
        </button>
        <button
          className={["px-3 py-1.5 rounded-md text-sm", showUX ? "bg-blue-700 hover:bg-blue-600" : "bg-gray-800 hover:bg-gray-700"].join(" ")}
          aria-pressed={showUX}
          onClick={onToggleUX}
        >
          UI/UX
        </button>
      </div>
    </div>
  );
}

