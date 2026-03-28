import { useEffect, useMemo, useRef, useState } from 'react';
import { clearRepetitionDb, exportRepetitionDb, getAvoidList, getTopRepeated, importRepetitionDb, getGlobalPenalty, setGlobalPenalty, getGlobalEnabled, setGlobalEnabled, getLastAvoidImpact, type AvoidImpact, getImpactHistory, clearImpactHistory } from '../../../../utils/repetitionDb';
import { useI18n } from '../../../../i18n';

export default function RepeatsTab() {
  const { t } = useI18n();
  const [limit, setLimit] = useState<number>(10);
  const [data, setData] = useState<Array<{ key: string; hi: number; lo: number; count: number }>>([]);
  const [stats, setStats] = useState<{ totalOccurrences: number; distinctKeys: number }>(() => ({ totalOccurrences: 0, distinctKeys: 0 }));
  // Cross-game settings
  const [globalEnabled, setGlobalEnabledState] = useState<boolean>(() => getGlobalEnabled());
  // Cross-game penalty scale (global)
  const [globalPenalty, setGlobalPenaltyState] = useState<number>(() => getGlobalPenalty());
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [lastImpact, setLastImpact] = useState<AvoidImpact | null>(() => getLastAvoidImpact());
  const [histLimit, setHistLimit] = useState<number>(50);
  const [avgWindow, setAvgWindow] = useState<number>(10);
  const [history, setHistory] = useState<AvoidImpact[]>(() => getImpactHistory(histLimit));

  const avg = useMemo(() => {
    const n = Math.max(1, Math.min(avgWindow, history.length));
    const slice = history.slice(-n);
    const sumCount = slice.reduce((a, b) => a + (b?.count || 0), 0);
    const sumWeight = slice.reduce((a, b) => a + (b?.weight || 0), 0);
    return { n, count: Math.round(sumCount / n), weight: Math.round(sumWeight / n) };
  }, [history, avgWindow]);

  const weightsPreview = useMemo(() => getAvoidList({ scale: globalPenalty, limit: 32, minCount: 2 }), [globalPenalty]);

  const refresh = () => {
    try {
      const top = getTopRepeated(limit);
      setData(top);
      const raw = exportRepetitionDb();
      const parsed = JSON.parse(raw) as { order: string[]; map: Record<string, number> };
      const totalOccurrences = Array.isArray(parsed.order) ? parsed.order.length : 0;
      const distinctKeys = parsed.map ? Object.keys(parsed.map).length : 0;
      setStats({ totalOccurrences, distinctKeys });
    } catch {}
  };

  useEffect(() => { refresh(); }, [limit]);
  useEffect(() => { setHistory(getImpactHistory(histLimit)); }, [histLimit]);
  // Poll and listen for recent impact updates
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'pylos.repeats.lastImpact') {
        setLastImpact(getLastAvoidImpact());
        setHistory(getImpactHistory(histLimit));
      }
      if (e.key === 'pylos.repeats.impactHistory.v1') {
        setHistory(getImpactHistory(histLimit));
      }
      if (e.key === 'pylos.repeats.globalEnabled') {
        // Reflect global toggle changes made from other panels (e.g., IAPanel)
        setGlobalEnabledState(getGlobalEnabled());
      }
    };
    window.addEventListener('storage', onStorage);
    const t = window.setInterval(() => {
      setLastImpact(getLastAvoidImpact());
      setHistory(getImpactHistory(histLimit));
      // Keep global toggle in sync even if storage event doesn't fire (same tab)
      setGlobalEnabledState(getGlobalEnabled());
    }, 1500);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(t);
    };
  }, []);

  // Persist global cross-game settings on change
  useEffect(() => {
    setGlobalEnabled(globalEnabled);
  }, [globalEnabled]);
  useEffect(() => {
    setGlobalPenalty(globalPenalty);
  }, [globalPenalty]);

  const onExport = () => {
    try {
      const json = exportRepetitionDb();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pylos-repeats-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage(t.repeatsTab.exportedOk);
    } catch { setMessage(t.repeatsTab.exportError); }
  };

  const onImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const res = importRepetitionDb(String(reader.result || ''));
        if (res.ok) {
          setMessage(t.repeatsTab.importedOk);
          refresh();
        } else {
          setMessage(res.error || t.repeatsTab.importError);
        }
      } catch (err) {
        setMessage(t.repeatsTab.importError);
      } finally {
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setMessage(t.repeatsTab.fileReadError);
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="infoia__repeats" style={{ paddingTop: 8 }} title={t.repeatsTab.panelTitle}>
      {message && (
        <div role="status" aria-live="polite" style={{ marginBottom: 12, color: '#2563eb' }}>{message}</div>
      )}

      <div className="row" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="panel small" style={{ minWidth: 260 }} title={t.repeatsTab.summaryTitle}>
          <h4 style={{ marginTop: 0 }} title={t.repeatsTab.summaryIndicators}>{t.repeatsTab.summary}</h4>
          <div style={{ fontSize: 13 }}>
            <div title={t.repeatsTab.totalOccurrencesTitle}>{t.repeatsTab.totalOccurrences}: <b>{stats.totalOccurrences}</b></div>
            <div title={t.repeatsTab.distinctKeysTitle}>{t.repeatsTab.distinctKeys}: <b>{stats.distinctKeys}</b></div>
          </div>
        </div>
        <div className="panel small" style={{ minWidth: 260 }} title={t.repeatsTab.controlsTitle}>
          <h4 style={{ marginTop: 0 }} title={t.repeatsTab.configTitle}>{t.repeatsTab.controls}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
            <label htmlFor="rep-limit" title={t.repeatsTab.topNTitle}>{t.repeatsTab.topN}</label>
            <input id="rep-limit" type="number" min={10} max={500} step={10} value={limit} onChange={(e) => setLimit(Math.max(10, Math.min(500, Number(e.target.value))))} title={t.repeatsTab.topNInputTitle} />
            <label htmlFor="rep-enabled" title={t.repeatsTab.protocolActiveTitle}>{t.repeatsTab.protocolActive}</label>
            <input id="rep-enabled" type="checkbox" checked={globalEnabled} onChange={(e) => setGlobalEnabledState(e.target.checked)} title={t.repeatsTab.protocolDisabledTitle} />
            <label title={t.repeatsTab.exportTitle}>{t.repeatsTab.export}</label>
            <button onClick={onExport} title={t.repeatsTab.downloadJSONTitle}>{t.repeatsTab.downloadJSON}</button>
            <label title={t.repeatsTab.importTitle}>{t.repeatsTab.import}</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input ref={fileRef} type="file" accept="application/json,.json" onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (f) onImport(f);
              }} title={t.repeatsTab.selectFile} />
            </div>
            <label title={t.repeatsTab.clearTitle}>{t.repeatsTab.clear}</label>
            <button onClick={() => { clearRepetitionDb(); setMessage(t.repeatsTab.dbCleared); refresh(); }} title={t.repeatsTab.clearDBTitle}>{t.repeatsTab.clearDB}</button>
          </div>
        </div>
        <div className="panel small" style={{ minWidth: 260 }} title={t.repeatsTab.effectivePenaltyTitle}>
          <h4 style={{ marginTop: 0 }} title={t.repeatsTab.penaltyCalcTitle}>{t.repeatsTab.effectivePenalty}</h4>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }} title={t.repeatsTab.penaltyIAApplies}>
            {t.repeatsTab.penaltyDescription}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
            <label htmlFor="rep-pen" title={t.repeatsTab.basePenaltyTitle}>{t.repeatsTab.basePenalty}</label>
            <input id="rep-pen" type="number" min={0} max={500} step={5} value={globalPenalty} onChange={(e) => setGlobalPenaltyState(Math.max(0, Math.min(500, Number(e.target.value))))} title={t.repeatsTab.basePenaltyInputTitle} />
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }} title={t.repeatsTab.previewTitle}>{t.repeatsTab.previewLabel}</div>
          <ul style={{ maxHeight: 180, overflow: 'auto', margin: '6px 0 0 0', paddingLeft: 16 }} title={t.repeatsTab.previewListTitle}>
            {weightsPreview.map((w) => (
              <li key={`${w.hi}:${w.lo}`} style={{ fontFamily: 'monospace' }}>{w.hi}:{w.lo} — {w.weight}</li>
            ))}
          </ul>
        </div>
        <div className="panel small" style={{ minWidth: 260 }} title={t.repeatsTab.recentImpactTitle}>
          <h4 style={{ marginTop: 0 }} title={t.repeatsTab.lastSearchMetric}>{t.repeatsTab.recentImpact}</h4>
          <div style={{ fontSize: 13 }}>
            <div title={t.repeatsTab.penalizedRootTitle}>{t.repeatsTab.penalizedRoot}: <b>{lastImpact?.count ?? 0}</b></div>
            <div title={t.repeatsTab.totalWeightAppliedTitle}>{t.repeatsTab.totalWeightApplied}: <b>{lastImpact?.weight ?? 0}</b></div>
            <div title={t.repeatsTab.lastUpdateTitle}>{t.repeatsTab.lastUpdate}: <b>{lastImpact ? new Date(lastImpact.ts).toLocaleTimeString() : '—'}</b></div>
          </div>
        </div>
        <div className="panel" style={{ minWidth: 300 }} title={t.repeatsTab.historyTitle}>
          <h4 style={{ marginTop: 0 }} title={t.repeatsTab.historyListTitle}>{t.repeatsTab.history}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
            <label htmlFor="hist-limit" title={t.repeatsTab.lastNTitle}>{t.repeatsTab.lastN}</label>
            <input id="hist-limit" type="number" min={10} max={500} step={10} value={histLimit} onChange={(e) => setHistLimit(Math.max(10, Math.min(500, Number(e.target.value))))} title={t.repeatsTab.lastNInputTitle} />
            <label htmlFor="avg-window" title={t.repeatsTab.movingAvgTitle}>{t.repeatsTab.movingAvg}</label>
            <input id="avg-window" type="number" min={1} max={200} step={1} value={avgWindow} onChange={(e) => setAvgWindow(Math.max(1, Math.min(200, Number(e.target.value))))} title={t.repeatsTab.movingAvgInputTitle} />
            <label title={t.repeatsTab.clearHistoryTitle}>{t.repeatsTab.clearHistory}</label>
            <button onClick={() => { clearImpactHistory(); setHistory([]); }} title={t.repeatsTab.clearHistoryBtnTitle}>{t.repeatsTab.clearHistoryBtn}</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <div title={t.repeatsTab.avgPenalizedTitle}>{t.repeatsTab.avgPenalized}: <b>{avg.count}</b></div>
            <div title={t.repeatsTab.avgWeightTitle}>{t.repeatsTab.avgWeight}: <b>{avg.weight}</b></div>
          </div>
          <table className="table" role="table" aria-label={t.repeatsTab.historyTableLabel} style={{ width: '100%', marginTop: 8 }} title={t.repeatsTab.historyTableTitle}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }} title={t.repeatsTab.timeColTitle}>{t.repeatsTab.timeCol}</th>
                <th style={{ textAlign: 'right' }} title={t.repeatsTab.penalizedColTitle}>{t.repeatsTab.penalizedCol}</th>
                <th style={{ textAlign: 'right' }} title={t.repeatsTab.weightColTitle}>{t.repeatsTab.weightCol}</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={3} style={{ opacity: 0.7 }}>{t.repeatsTab.noDataYet}</td></tr>
              ) : (
                history.slice(-histLimit).reverse().map((h, i) => (
                  <tr key={h.ts + ':' + i}>
                    <td>{new Date(h.ts).toLocaleTimeString()}</td>
                    <td style={{ textAlign: 'right' }}>{h.count}</td>
                    <td style={{ textAlign: 'right' }}>{h.weight}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <h4 style={{ marginTop: 0 }} title={t.repeatsTab.topRepeatedTitle}>{t.repeatsTab.topRepeated}</h4>
        <table className="table" role="table" aria-label={t.repeatsTab.topRepeatedTableLabel} style={{ width: '100%' }} title={t.repeatsTab.topRepeatedTableTitle}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }} title={t.repeatsTab.rankColTitle}>{t.repeatsTab.rankCol}</th>
              <th style={{ textAlign: 'left' }} title={t.repeatsTab.keyColTitle}>{t.repeatsTab.keyCol}</th>
              <th style={{ textAlign: 'right' }} title={t.repeatsTab.countColTitle}>{t.repeatsTab.countCol}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.key}>
                <td>{idx + 1}</td>
                <td style={{ fontFamily: 'monospace' }}>{row.hi}:{row.lo}</td>
                <td style={{ textAlign: 'right' }}>{row.count}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr title={t.repeatsTab.noDataPlayTitle}>
                <td colSpan={3} style={{ opacity: 0.7 }}>{t.repeatsTab.noDataPlay}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }} title={t.repeatsTab.footerNoteTitle}>
        {t.repeatsTab.footerNote}
      </div>
    </div>
  );
}
