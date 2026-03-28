export interface FootPanelProps {
  showTools?: boolean;
  onToggleDev?: () => void;
}

/**
 * FootPanel — Botón flotante (abajo-derecha) para alternar DevTools.
 */
export default function FootPanel({ showTools = false, onToggleDev = () => {} }: FootPanelProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={onToggleDev}
        aria-pressed={showTools}
        aria-label="Alternar DevTools"
        title="Dev"
        className={[
          'px-4 py-2 rounded-full shadow-lg text-sm font-medium',
          showTools ? 'bg-blue-700 hover:bg-blue-600' : 'bg-gray-800 hover:bg-gray-700',
          'text-white border border-white/10',
        ].join(' ')}
      >
        Dev
      </button>
    </div>
  );
}

