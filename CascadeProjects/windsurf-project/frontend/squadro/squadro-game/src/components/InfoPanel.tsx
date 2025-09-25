import { useAppSelector } from '../store/hooks';
import type { RootState } from '../store';

export default function InfoPanel() {
  const { pieces, ai } = useAppSelector((s: RootState) => s.game);
  const retiredLight = pieces.filter((p) => p.owner === 'Light' && p.state === 'retirada').length;
  const retiredDark = pieces.filter((p) => p.owner === 'Dark' && p.state === 'retirada').length;

  return (
    <div className="flex flex-col gap-3">
      {/* IA status (copied style from Pylos): robot icons with blink when thinking */}
      {ai?.enabled && (
        <div className="flex items-center justify-center gap-8 text-neutral-300">
          <div className="inline-flex items-center gap-2">
            <svg
              className={[
                'robot-icon',
                ai?.aiSide === 'Light' ? 'is-active' : 'is-passive',
                ai?.aiSide === 'Light' && ai?.busy ? 'is-thinking' : '',
              ].join(' ')}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
            <span className="text-xs">Claras</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <svg
              className={[
                'robot-icon',
                ai?.aiSide === 'Dark' ? 'is-active' : 'is-passive',
                ai?.aiSide === 'Dark' && ai?.busy ? 'is-thinking' : '',
              ].join(' ')}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
            <span className="text-xs">Oscuras</span>
          </div>
        </div>
      )}
    
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-700 p-3 bg-neutral-800/40">
          <div className="text-xs text-neutral-400">Retiradas Light</div>
          <div className="text-xl font-bold text-yellow-300">{retiredLight} / 4</div>
        </div>
        <div className="rounded-lg border border-neutral-700 p-3 bg-neutral-800/40">
          <div className="text-xs text-neutral-400">Retiradas Dark</div>
          <div className="text-xl font-bold text-emerald-400">{retiredDark} / 4</div>
        </div>
      </div>
    </div>
  );
}

