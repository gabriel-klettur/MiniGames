import { normEval } from '../utils/math';
import { evalTitleForPlayer } from '../utils/aria';

export interface EvaluationBarProps {
  evalScore: number | null | undefined;
  atRootLabel: string;
}

export default function EvaluationBar({ evalScore, atRootLabel }: EvaluationBarProps) {
  const width = ((evalScore !== null && evalScore !== undefined)
    ? ((normEval(evalScore) + 1) / 2)
    : 0) * 100;
  return (
    <div className="eval">
      <div className="eval-bar" title={evalTitleForPlayer(evalScore ?? null, atRootLabel)}>
        <div className="eval-bar__fill" style={{ width: `${width}%` }} />
      </div>
      <span className="eval-value">
        {evalScore !== null && evalScore !== undefined ? (evalScore > 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1)) : 'NO INFO'}
      </span>
    </div>
  );
}

