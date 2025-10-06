import { normEval, fmtScore } from '../utils/format';

export interface EvalBarProps {
  evalScore: number | null | undefined;
  atRootLabel: string;
}

export function EvalBar({ evalScore, atRootLabel }: EvalBarProps) {
  const widthPct = (evalScore !== null && evalScore !== undefined) ? ((normEval(evalScore) + 1) / 2) * 100 : 0;
  const title = (evalScore !== null && evalScore !== undefined)
    ? `Eval para ${atRootLabel}: ${fmtScore(evalScore)}`
    : 'Sin datos';

  return (
    <div className="eval">
      <div className="eval-bar" title={title}>
        <div className="eval-bar__fill" style={{ width: `${widthPct}%` }} />
      </div>
      <span className="eval-value">{fmtScore(evalScore)}</span>
    </div>
  );
}

export default EvalBar;
