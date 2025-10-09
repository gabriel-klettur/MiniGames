import { useAppSelector } from '../store/hooks';
import type { RootState } from '../store';
import fichaAmarilla from '../assets/ficha_amarilla.png';
import fichaRoja from '../assets/ficha_roja.png';

export default function InfoPanel() {
  const { pieces, ai, turn } = useAppSelector((s: RootState) => s.game);
  const retiredLight = pieces.filter((p) => p.owner === 'Light' && p.state === 'retirada').length;
  const retiredDark = pieces.filter((p) => p.owner === 'Dark' && p.state === 'retirada').length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 items-stretch">
        {/* Retiradas Light (sin label) */}
        <div className="rounded-lg border border-neutral-700 p-3 bg-neutral-800/40 text-center flex items-center justify-center">
          <div className="inline-flex items-center gap-2">
            {ai?.enabled && ai?.aiSide === 'Light' && (
              <svg
                className={[
                  'robot-icon',
                  'is-active',
                  ai?.busy ? 'is-thinking' : '',
                ].join(' ')}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                aria-label="IA (Claras)"
              >
                <path fill="currentColor" d="M11 2h2v3h-2z"/>
                <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
                <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
                <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
                <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
              </svg>
            )}
            <div className="text-xl font-bold text-yellow-300">{retiredLight} / 4</div>
          </div>
        </div>
        {/* Turno al centro: solo imagen de la ficha */}
        <div className="rounded-lg border border-neutral-700 p-1 bg-neutral-800/40 text-center flex items-center justify-center">
          <img
            src={turn === 'Light' ? fichaAmarilla : fichaRoja}
            alt={turn === 'Light' ? 'Ficha amarilla (Light)' : 'Ficha roja (Dark)'}
            draggable={false}
            className="w-10 h-auto select-none"
          />
        </div>
        {/* Retiradas Dark (sin label) */}
        <div className="rounded-lg border border-neutral-700 p-1 bg-neutral-800/40 text-center flex items-center justify-center">
          <div className="inline-flex items-center gap-2">
            {ai?.enabled && ai?.aiSide === 'Dark' && (
              <svg
                className={[
                  'robot-icon',
                  'is-active',
                  ai?.busy ? 'is-thinking' : '',
                ].join(' ')}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                aria-label="IA (Oscuras)"
              >
                <path fill="currentColor" d="M11 2h2v3h-2z"/>
                <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
                <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
                <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
                <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
              </svg>
            )}
            <div className="text-xl font-bold" style={{ color: '#dc143c', textShadow: '0 1px 0 rgba(0,0,0,0.35)' }}>{retiredDark} / 4</div>
          </div>
        </div>
      </div>
    </div>
  );
}
