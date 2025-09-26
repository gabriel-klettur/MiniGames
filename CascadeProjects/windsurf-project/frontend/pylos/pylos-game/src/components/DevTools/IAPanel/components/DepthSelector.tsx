export interface DepthSelectorProps {
  depth: number;
  onChangeDepth: (d: number) => void;
}

export default function DepthSelector({ depth, onChangeDepth }: DepthSelectorProps) {
  return (
    <>
      <label htmlFor="ia-depth" className="label">Profundidad</label>
      <select id="ia-depth" value={depth} onChange={(e) => onChangeDepth(Number(e.target.value))}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </>
  );
}

