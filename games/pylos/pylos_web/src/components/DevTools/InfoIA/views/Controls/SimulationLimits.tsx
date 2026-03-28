import { useI18n } from '../../../../../i18n';

export function SimulationLimits(props: {
  pliesLimit: number;
  onPliesLimitChange: (v: number) => void;
  gamesCount: number;
  onGamesCountChange: (v: number) => void;
}) {
  const { t } = useI18n();
  const { pliesLimit, onPliesLimitChange, gamesCount, onGamesCountChange } = props;
  return (
    <>
      <label className="label" htmlFor="infoia-plies">{t.infoIA.pliesLimit}</label>
      <input id="infoia-plies" className="field-num" type="number" min={1} max={400} value={pliesLimit} onChange={(e) => onPliesLimitChange(Number(e.target.value))} style={{ width: 90 }} />

      <label className="label" htmlFor="infoia-count">{t.infoIA.gamesCount}</label>
      <input id="infoia-count" className="field-num" type="number" min={1} max={1000} value={gamesCount} onChange={(e) => onGamesCountChange(Number(e.target.value))} style={{ width: 90 }} />
    </>
  );
}
