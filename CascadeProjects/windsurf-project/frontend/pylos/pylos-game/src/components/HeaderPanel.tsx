import newGameImg from '../assets/btn_nueva_partida.png';

export interface HeaderPanelProps {
  title?: string;
  onNewGame: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onRedo?: () => void;
  canRedo?: boolean;
  showTools: boolean;
  onToggleDev: () => void;
  // IA toggle button (placed to the left of 'Dev')
  showIA?: boolean;
  onToggleIA?: () => void;
}

/**
 * HeaderPanel: muestra el nombre del juego y acciones principales (Nuevo, Dev).
 * Se piensa para el Sidebar y busca ser compacto en altura.
 */
function HeaderPanel({ title = 'Pylos', onNewGame, onUndo = () => {}, canUndo = false, onRedo = () => {}, canRedo = false, showTools, onToggleDev, showIA = false, onToggleIA = () => {} }: HeaderPanelProps) {
  return (
    <section className="header-bar" aria-label="Encabezado">
      <div className="row header">
        <h2>{title}</h2>
        <div className="header-actions">
          <button className="btn-img" onClick={onNewGame} aria-label="Nueva partida">
            <img src={newGameImg} alt="Nueva partida" />
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Volver atrás"
            title="Deshacer última jugada"
          >
            ← Atrás
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Rehacer"
            title="Rehacer jugada"
          >
            Rehacer →
          </button>
          <button
            onClick={onToggleIA}
            aria-pressed={showIA}
            aria-label="Alternar panel de IA"
            title="IA"
          >
            IA
          </button>
          <button
            onClick={onToggleDev}
            aria-pressed={showTools}
            aria-label="Alternar controles de desarrollo"
            title="Dev"
          >
            Dev
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeaderPanel;

