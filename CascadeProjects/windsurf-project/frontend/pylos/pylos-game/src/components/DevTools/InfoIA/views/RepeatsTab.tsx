import { useEffect, useMemo, useRef, useState } from 'react';
import { clearRepetitionDb, exportRepetitionDb, getAvoidList, getTopRepeated, importRepetitionDb, getGlobalPenalty, setGlobalPenalty, getGlobalEnabled, setGlobalEnabled, getLastAvoidImpact, type AvoidImpact, getImpactHistory, clearImpactHistory } from '../../../../utils/repetitionDb';

export default function RepeatsTab() {
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
      setMessage('Exportado correctamente');
    } catch { setMessage('Error al exportar'); }
  };

  const onImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const res = importRepetitionDb(String(reader.result || ''));
        if (res.ok) {
          setMessage('Importado correctamente');
          refresh();
        } else {
          setMessage(res.error || 'Error al importar');
        }
      } catch (err) {
        setMessage('Error al importar');
      } finally {
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setMessage('Error al leer el archivo');
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="infoia__repeats" style={{ paddingTop: 8 }} title="Panel para gestionar y entender repeticiones globales entre partidas (jugador y simuladas)">
      {message && (
        <div role="status" aria-live="polite" style={{ marginBottom: 12, color: '#2563eb' }} title="Mensajes de acción (éxito/error)">{message}</div>
      )}

      <div className="row" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }} title="Tarjetas con resumen y controles de la DB de repeticiones entre partidas">
        <div className="panel small" style={{ minWidth: 260 }} title="Resumen agregado de la base de repeticiones (localStorage)">
          <h4 style={{ marginTop: 0 }} title="Indicadores de tamaño de la base">Resumen</h4>
          <div style={{ fontSize: 13 }}>
            <div title="Número total de estados registrados (incluye duplicados)">Total de ocurrencias: <b>{stats.totalOccurrences}</b></div>
            <div title="Número de claves Zobrist únicas registradas">Claves distintas: <b>{stats.distinctKeys}</b></div>
          </div>
        </div>
        <div className="panel small" style={{ minWidth: 260 }} title="Acciones para explorar y mantener la base de repeticiones entre partidas">
          <h4 style={{ marginTop: 0 }} title="Configura vista y mantenimiento">Controles</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
            <label htmlFor="rep-limit" title="Cantidad de filas a mostrar en el Top">Top N</label>
            <input id="rep-limit" type="number" min={10} max={500} step={10} value={limit} onChange={(e) => setLimit(Math.max(10, Math.min(500, Number(e.target.value))))} title="Número de entradas a listar en la tabla inferior" />
            <label htmlFor="rep-enabled" title="Activa o desactiva el protocolo global de evitación de jugadas repetidas entre partidas">Protocolo activo</label>
            <input id="rep-enabled" type="checkbox" checked={globalEnabled} onChange={(e) => setGlobalEnabledState(e.target.checked)} title="Si se desactiva, la IA no usará la base global para evitar repeticiones entre partidas" />
            <label title="Exporta la base a un archivo JSON">Exportar</label>
            <button onClick={onExport} title="Descarga la DB de repeticiones como JSON">Descargar JSON</button>
            <label title="Importa una base previamente exportada">Importar</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} title="Selecciona un archivo .json con la DB de repeticiones">
              <input ref={fileRef} type="file" accept="application/json,.json" onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (f) onImport(f);
              }} title="Seleccionar archivo JSON" />
            </div>
            <label title="Borra completamente la base de repeticiones">Limpiar</label>
            <button onClick={() => { clearRepetitionDb(); setMessage('DB de repeticiones limpiada'); refresh(); }} title="Vacía la DB de repeticiones (no reversible)">Vaciar DB</button>
          </div>
        </div>
        <div className="panel small" style={{ minWidth: 260 }} title="Previsualización de pesos de evitación aplicados a estados repetidos entre partidas">
          <h4 style={{ marginTop: 0 }} title="Cálculo de pesos según tu configuración">Penalización efectiva</h4>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }} title="La IA aplica estos pesos para evitar estados frecuentes">
            Muestra cómo se construirían pesos con la penalización base (coincide con IAPanel Avanzado).
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
            <label htmlFor="rep-pen" title="Escala base de penalización por repetición entre partidas">Penalización base</label>
            <input id="rep-pen" type="number" min={0} max={500} step={5} value={globalPenalty} onChange={(e) => setGlobalPenaltyState(Math.max(0, Math.min(500, Number(e.target.value))))} title="A mayor valor, más se evitan estados repetidos entre partidas" />
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }} title="Lista de ejemplos con pesos aplicados">Previsualización (Top 32 claves con peso aplicado):</div>
          <ul style={{ maxHeight: 180, overflow: 'auto', margin: '6px 0 0 0', paddingLeft: 16 }} title="Estados con mayor peso de evitación">
            {weightsPreview.map((w) => (
              <li key={`${w.hi}:${w.lo}`} style={{ fontFamily: 'monospace' }} title={`Clave ${w.hi}:${w.lo} con peso ${w.weight}`}>{w.hi}:{w.lo} — peso {w.weight}</li>
            ))}
          </ul>
        </div>
        <div className="panel small" style={{ minWidth: 260 }} title="Resumen del impacto aplicado en la última búsqueda de la IA">
          <h4 style={{ marginTop: 0 }} title="Métrica de última búsqueda">Impacto reciente</h4>
          <div style={{ fontSize: 13 }}>
            <div title="Cuántos hijos de raíz penalizó el protocolo en la última decisión">Penalizados (raíz): <b>{lastImpact?.count ?? 0}</b></div>
            <div title="Suma de pesos aplicados a esos hijos">Peso total aplicado: <b>{lastImpact?.weight ?? 0}</b></div>
            <div title="Momento de la última actualización">Última act.: <b>{lastImpact ? new Date(lastImpact.ts).toLocaleTimeString() : '—'}</b></div>
          </div>
        </div>
        <div className="panel" style={{ minWidth: 300 }} title="Histórico de impactos aplicados por la IA en el protocolo entre partidas">
          <h4 style={{ marginTop: 0 }} title="Lista de últimas decisiones y su impacto">Histórico</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
            <label htmlFor="hist-limit" title="Número de entradas recientes a mostrar">Últimas N</label>
            <input id="hist-limit" type="number" min={10} max={500} step={10} value={histLimit} onChange={(e) => setHistLimit(Math.max(10, Math.min(500, Number(e.target.value))))} title="Tamaño de la ventana de visualización del histórico" />
            <label htmlFor="avg-window" title="Ventana para el promedio móvil (usa últimas W entradas)">Promedio móvil (W)</label>
            <input id="avg-window" type="number" min={1} max={200} step={1} value={avgWindow} onChange={(e) => setAvgWindow(Math.max(1, Math.min(200, Number(e.target.value))))} title="Cuántas últimas entradas considerar para el promedio móvil" />
            <label title="Elimina todo el histórico almacenado">Borrar histórico</label>
            <button onClick={() => { clearImpactHistory(); setHistory([]); }} title="Vacía el histórico de impactos">Limpiar</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <div title="Promedio móvil de penalizados en la ventana W">Promedio móvil — Penalizados: <b>{avg.count}</b></div>
            <div title="Promedio móvil de peso total en la ventana W">Promedio móvil — Peso: <b>{avg.weight}</b></div>
          </div>
          <table className="table" role="table" aria-label="Histórico de impactos" style={{ width: '100%', marginTop: 8 }} title="Últimas decisiones">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }} title="Marca temporal">Hora</th>
                <th style={{ textAlign: 'right' }} title="# penalizados a nivel raíz">Penalizados</th>
                <th style={{ textAlign: 'right' }} title="Suma de pesos aplicados">Peso</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={3} style={{ opacity: 0.7 }}>Sin datos</td></tr>
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

      <div className="panel" style={{ marginTop: 12 }} title="Tabla con las claves Zobrist más repetidas (histórico)">
        <h4 style={{ marginTop: 0 }} title="Ranking de estados repetidos">Top jugadas/posiciones repetidas</h4>
        <table className="table" role="table" aria-label="Top claves repetidas" style={{ width: '100%' }} title="Listado de estados por frecuencia">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }} title="Posición en el ranking">#</th>
              <th style={{ textAlign: 'left' }} title="Clave Zobrist (hi:lo)">Clave</th>
              <th style={{ textAlign: 'right' }} title="Número de apariciones registradas">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.key} title={`Clave ${row.hi}:${row.lo} repetida ${row.count} veces`}>
                <td title={`Ranking #${idx + 1}`}>{idx + 1}</td>
                <td style={{ fontFamily: 'monospace' }} title={`Identificador de estado ${row.hi}:${row.lo}`}>{row.hi}:{row.lo}</td>
                <td style={{ textAlign: 'right' }} title={`Apariciones: ${row.count}`}>{row.count}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr title="No hay datos aún">
                <td colSpan={3} style={{ opacity: 0.7 }} title="Juega partidas o ejecuta simulaciones para generar datos">Sin datos aún. Juega partidas para acumular repeticiones.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }} title="Cómo influye esta base en la IA">
        Nota: Esta DB afecta a la elección en raíz de la IA entre partidas (evitación ponderada global). El umbral intra-partida y otros ajustes se configuran en el panel de IA Avanzado.
      </div>
    </div>
  );
}
