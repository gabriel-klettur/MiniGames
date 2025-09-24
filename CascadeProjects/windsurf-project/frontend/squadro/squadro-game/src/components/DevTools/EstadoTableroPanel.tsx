import { useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';

export default function EstadoTableroPanel() {
  const pieces = useAppSelector((s: RootState) => s.game.pieces);

  return (
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
  );
}

