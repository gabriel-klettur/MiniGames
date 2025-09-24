export interface HeaderPanelProps {
  title?: string;
  onNewGame?: () => void;
  /** Toggle visibility for IAUserPanel in the main layout */
  onToggleIAUser?: () => void;
  /** Whether IAUserPanel is currently visible (for button state) */
  showIAUser?: boolean;
}

/**
 * HeaderPanel — Encabezado compacto con acciones principales.
 */
export default function HeaderPanel({
  title = 'Quoridor',
  onNewGame = () => {},
  onToggleIAUser,
  showIAUser = false,
}: HeaderPanelProps) {
  return (
    <section className="w-full border-b border-white/10 bg-gray-900/70">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleIAUser}
            className={[
              'px-3 py-1.5 rounded-md text-sm border border-white/10',
              showIAUser ? 'bg-indigo-700 hover:bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-100'
            ].join(' ')}
            title={showIAUser ? 'Ocultar panel IA' : 'Mostrar panel IA'}
            aria-pressed={showIAUser}
          >
            IA
          </button>
          <button
            onClick={onNewGame}
            className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm"
            title="Nueva partida"
            aria-label="Nueva partida"
          >
            Nueva
          </button>
        </div>
      </div>
    </section>
  );
}

