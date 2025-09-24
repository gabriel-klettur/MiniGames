import { useAppSelector } from '../store/hooks';
import type { RootState } from '../store';

export default function InfoPanel() {
  const { pieces } = useAppSelector((s: RootState) => s.game);
  const retiredLight = pieces.filter((p) => p.owner === 'Light' && p.state === 'retirada').length;
  const retiredDark = pieces.filter((p) => p.owner === 'Dark' && p.state === 'retirada').length;

  return (
    <div className="flex flex-col gap-3">
    
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

      <div className="text-xs text-neutral-400">
        Consejo: haz clic sobre una pieza del jugador en turno para moverla.
      </div>
    </div>
  );
}

