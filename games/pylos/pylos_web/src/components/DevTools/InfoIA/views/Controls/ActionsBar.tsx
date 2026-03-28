import { useI18n } from '../../../../../i18n';

export function ActionsBar(props: {
  running: boolean;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
  onDefault: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onAddCompare: () => void;
  onClearAll: () => void;
  canClearLocal: boolean;
  activeTableSourceId: string;
}) {
  const { t } = useI18n();
  const {
    running, loading, onStart, onStop, onDefault,
    onExportJSON, onExportCSV,
    onAddCompare, onClearAll, canClearLocal, activeTableSourceId,
  } = props;

  return (
    <div className="infoia__actions">
      {!running ? (
        <button className="primary" onClick={onStart} disabled={loading} title={t.infoIA.startTitle}>{t.infoIA.start}</button>
      ) : (
        <button className="btn-stop" onClick={onStop} title={t.infoIA.stopTitle}>{t.infoIA.stop}</button>
      )}
      <button
        className="btn-accent"
        onClick={onDefault}
        title={t.infoIA.defaultTitle}
        disabled={running}
      >{t.infoIA.defaultBtn}</button>
      <button className="btn-ghost" onClick={onExportJSON}>{t.infoIA.exportJSON}</button>
      <button className="btn-ghost" onClick={onExportCSV}>{t.infoIA.exportCSV}</button>
      <button className="btn-ghost" onClick={onAddCompare} title={t.infoIA.addCompareTitle}>{t.infoIA.addCompareBtn}</button>
      <button className="btn-danger" onClick={onClearAll} disabled={!canClearLocal} title={activeTableSourceId !== 'local' ? t.infoIA.clearAllOnlyLocal : t.infoIA.clearAllTitle}>{t.infoIA.clearAllBtn}</button>
    </div>
  );
}

