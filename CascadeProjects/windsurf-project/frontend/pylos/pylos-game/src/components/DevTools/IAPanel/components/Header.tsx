export interface HeaderProps {
  title?: string;
  moving?: boolean;
  busy?: boolean;
  progressDepth?: number | null;
}

export default function Header({ title = 'Inteligencia Artificial', moving = false, busy = false, progressDepth = null }: HeaderProps) {
  return (
    <div className="ia-panel__header">
      <h3 className="ia-panel__title">{title}</h3>
      <div className="ia-panel__status">
        {moving && <span className="kpi kpi--accent" aria-live="polite">Moviendo</span>}
        {busy && !moving && <span className="kpi">Pensando…{typeof progressDepth === 'number' ? ` d${progressDepth}` : ''}</span>}
        {!busy && !moving && <span className="kpi kpi--muted">En espera</span>}
      </div>
    </div>
  );
}

