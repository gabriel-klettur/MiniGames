import { useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';

export default function DevToolsPanel() {
  const { pieces, turn, winner } = useAppSelector((s: RootState) => s.game);

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-neutral-300">DevTools</h2>
        <div className="text-xs text-neutral-400">Turno: {turn}{winner ? ` • Ganador: ${winner}` : ''}</div>
      </div>
      <div className="max-h-64 overflow-auto">
        <table className="w-full text-xs">
          <thead className="text-neutral-400">
            <tr className="text-left">
              <th className="py-1 pr-2">ID</th>
              <th className="py-1 pr-2">Owner</th>
              <th className="py-1 pr-2">Lane</th>
              <th className="py-1 pr-2">Pos</th>
              <th className="py-1 pr-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pieces.map((p) => (
              <tr key={p.id} className="border-t border-neutral-800">
                <td className="py-1 pr-2 font-mono">{p.id}</td>
                <td className="py-1 pr-2">{p.owner}</td>
                <td className="py-1 pr-2">{p.laneIndex}</td>
                <td className="py-1 pr-2">{p.pos}</td>
                <td className="py-1 pr-2">{p.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

