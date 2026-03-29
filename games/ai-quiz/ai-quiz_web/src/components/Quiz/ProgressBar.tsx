interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-400">
        {current + 1} / {total}
      </span>
      <div className="h-2 flex-1 rounded-full bg-gray-800">
        <div
          className="h-2 rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-gray-500">{pct}%</span>
    </div>
  );
}
