interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium tabular-nums text-gray-500">
        {current + 1} / {total}
      </span>
      <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]">
        <div
          className="h-1.5 rounded-full progress-gradient transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-gray-500">{pct}%</span>
    </div>
  );
}
