import React from 'react';
import './IAUserPanel.css';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { setAIDifficulty, setAIEnabled, setAISide } from '../../store/gameSlice';

type DepthSelectProps = { depth: number; onChangeDepth: (d: number) => void };
function DepthSelect({ depth, onChangeDepth }: DepthSelectProps) {
  return (
    <div className="iauser-left" aria-label="Dificultad">
      <div className="vsai-title">Dificultad</div>
      <div className="vsai-diffs" role="listbox" aria-label="Nivel de dificultad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
          <button
            key={d}
            className={d === depth ? 'active' : ''}
            onClick={() => onChangeDepth(d)}
            title={`Nivel ${d}`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

type PlayerToggleButtonProps = { label: 'P1' | 'P2'; active: boolean; onClick: () => void };
function PlayerToggleButton({ label, active, onClick }: PlayerToggleButtonProps) {
  return (
    <button className="ia-toggle-btn" onClick={onClick} aria-pressed={active} title={`IA controla ${label}`}>
      <span className={`ia-badge ${label === 'P1' ? 'p1' : 'p2'}`}>{label}</span>
    </button>
  );
}

function RobotIcon({ className = '', size = 18, ...rest }: { className?: string; size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...rest}>
      <path fill="currentColor" d="M11 2h2v3h-2z"/>
      <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
      <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
      <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
      <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
    </svg>
  );
}

export default function IAUserPanel() {
  const dispatch = useAppDispatch();
  const { ai, winner } = useAppSelector((s: RootState) => s.game);
  const depth = ai?.difficulty ?? 3;
  const aiControlP1 = !!(ai?.enabled && ai?.aiSide === 'Light');
  const aiControlP2 = !!(ai?.enabled && ai?.aiSide === 'Dark');
  const busy = !!ai?.busy;

  return (
    <section className="panel small iauser-panel" aria-label="Controles de IA (usuario)">
      <div className="row actions iauser-inline" aria-label="Dificultad y acciones de IA">
        <DepthSelect depth={depth} onChangeDepth={(d) => dispatch(setAIDifficulty(d))} />
        <div className="iauser-right">
          <PlayerToggleButton
            label="P1"
            active={aiControlP1}
            onClick={() => {
              if (aiControlP1) {
                dispatch(setAIEnabled(false));
              } else {
                dispatch(setAISide('Light'));
                dispatch(setAIEnabled(true));
              }
            }}
          />
          <PlayerToggleButton
            label="P2"
            active={aiControlP2}
            onClick={() => {
              if (aiControlP2) {
                dispatch(setAIEnabled(false));
              } else {
                dispatch(setAISide('Dark'));
                dispatch(setAIEnabled(true));
              }
            }}
          />
          <button
            className={["ia-move-btn", busy ? "is-busy" : ""].join(" ")}
            onClick={() => {
              // En Squadro, el movimiento IA se dispara automáticamente en App.tsx
              // cuando ai.enabled y es el turno de ai.aiSide. Aquí garantizamos
              // que IA esté activa (y respetamos el lado ya seleccionado).
              if (!ai?.enabled) dispatch(setAIEnabled(true));
            }}
            disabled={!!winner || busy}
            aria-pressed={busy}
          >
            <RobotIcon className="robot-icon" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}

