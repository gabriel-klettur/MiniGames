export interface HeaderPanelProps {
  title?: string;
  onNewGame?: () => void;
}

/**
 * HeaderPanel — Encabezado compacto con acciones principales.
 */
export default function HeaderPanel({
  title = 'Quoridor',
  onNewGame = () => {},
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
        </div>
      </div>
    </section>
  );
}

