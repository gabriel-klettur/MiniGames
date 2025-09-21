export interface HeaderPanelProps {
  title?: string;
  onNewGame?: () => void;
  onToggleRules?: () => void;
  onToggleDev?: () => void;
  showTools?: boolean;
}

/**
 * HeaderPanel — Encabezado compacto con acciones principales.
 */
export default function HeaderPanel({
  title = 'Quoridor',
  onNewGame = () => {},
  onToggleRules = () => {},
  onToggleDev = () => {},
  showTools = false,
}: HeaderPanelProps) {
  return (
    <section className="w-full border-b border-white/10 bg-gray-900/70">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewGame}
            className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm"
            title="Nueva partida"
            aria-label="Nueva partida"
          >
            Nueva
          </button>
          <button
            onClick={onToggleRules}
            className="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-sm"
            title="Mostrar/Ocultar reglas"
            aria-label="Reglas"
          >
            Reglas
          </button>
          <button
            onClick={onToggleDev}
            className={[
              'px-3 py-1.5 rounded-md text-sm',
              showTools ? 'bg-blue-700 hover:bg-blue-600' : 'bg-gray-800 hover:bg-gray-700',
            ].join(' ')}
            aria-pressed={showTools}
            title="Mostrar/Ocultar DevTools"
            aria-label="DevTools"
          >
            Dev
          </button>
        </div>
      </div>
    </section>
  );
}

