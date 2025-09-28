import { useCallback, useEffect, useMemo, useState } from 'react';

export type BooksProps = {
  onExportBook: () => void;
  onPublishBooks?: (minSupportPct: number) => void;
  onClearBooks?: () => void;
};

type Difficulty = 'facil' | 'medio' | 'dificil';
type Phase = 'aperturas' | 'medio' | 'cierres';

type BookFileInfo = {
  difficulty: Difficulty;
  phase: Phase;
  url: string;
  status: 'loading' | 'ok' | 'missing' | 'error';
  entries: number | null;
  bytes: number | null;
};

const difficulties: Difficulty[] = ['facil', 'medio', 'dificil'];
const phases: Phase[] = ['aperturas', 'medio', 'cierres'];

export default function Books(props: BooksProps) {
  const [supportPct, setSupportPct] = useState<number>(55);
  const [files, setFiles] = useState<BookFileInfo[]>(() =>
    buildTargets().map((t) => ({ ...t, status: 'loading', entries: null, bytes: null }))
  );
  const [loading, setLoading] = useState<boolean>(false);

  const totalOk = useMemo(() => files.filter((f) => f.status === 'ok').length, [files]);

  function buildTargets(): Array<Pick<BookFileInfo, 'difficulty' | 'phase' | 'url'>> {
    const out: Array<Pick<BookFileInfo, 'difficulty' | 'phase' | 'url'>> = [];
    for (const d of difficulties) {
      for (const p of phases) {
        out.push({ difficulty: d, phase: p, url: `/books/${d}/${d}_${p}_book.json` });
      }
    }
    return out;
  }

  const loadAll = useCallback(async () => {
    setLoading(true);
    const targets = buildTargets();
    setFiles(targets.map((t) => ({ ...t, status: 'loading', entries: null, bytes: null })));
    const results: BookFileInfo[] = [];
    for (const t of targets) {
      try {
        const res = await fetch(t.url, { cache: 'no-store' });
        if (!res.ok) {
          results.push({ ...t, status: res.status === 404 ? 'missing' : 'error', entries: null, bytes: null });
          continue;
        }
        const text = await res.text();
        let entries = 0;
        try {
          const json = JSON.parse(text);
          entries = Array.isArray(json?.entries) ? json.entries.length : 0;
        } catch {
          // parse error -> mark error
          results.push({ ...t, status: 'error', entries: null, bytes: text.length });
          continue;
        }
        results.push({ ...t, status: 'ok', entries, bytes: text.length });
      } catch {
        results.push({ ...t, status: 'error', entries: null, bytes: null });
      }
    }
    setFiles(results);
    setLoading(false);
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const onPublishClick = useCallback(() => {
    const pct = Math.max(0, Math.min(100, Math.floor(supportPct)));
    props.onPublishBooks?.(pct);
    // After publishing, re-load to reflect changes
    // Delay a tiny bit to let dev server write files
    setTimeout(() => { void loadAll(); }, 300);
  }, [supportPct, props, loadAll]);

  const onClearClick = useCallback(() => {
    props.onClearBooks?.();
    // After clearing, refresh list
    setTimeout(() => { void loadAll(); }, 300);
  }, [props, loadAll]);

  return (
    <div className="infoia__books" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h4 className="ia-panel__title" style={{ marginRight: 'auto' }}>Books</h4>
        <button className="btn-ghost" onClick={props.onExportBook} title="Generar y descargar los 9 books">Exportar Book</button>
        <label className="label" htmlFor="books-support" title="Soporte mínimo para incluir jugadas en el book (0–100%)">Soporte (%)</label>
        <input
          id="books-support"
          className="field-num"
          type="number"
          min={0}
          max={100}
          value={supportPct}
          onChange={(e) => setSupportPct(Number(e.target.value))}
          style={{ width: 90 }}
        />
        <button className="btn-accent" onClick={onPublishClick} title="Publicar todos los books en public/books (dev)">Publicar Books</button>
        <button className="btn-warning" onClick={onClearClick} title="Vaciar la carpeta public/books (dev)">Vaciar Books</button>
        <button className="btn-ghost" onClick={() => loadAll()} disabled={loading} title="Recargar estado de books">{loading ? 'Cargando…' : 'Recargar'}</button>
        <span className="kpi" title="Cantidad de books encontrados">{totalOk}/9</span>
      </div>

      <div className="panel" style={{ padding: 12 }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 6 }}>Dificultad</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Fase</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Archivo</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Entradas</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Bytes</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Estado</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={`${f.difficulty}-${f.phase}`}>
                <td style={{ padding: 6 }}>{f.difficulty}</td>
                <td style={{ padding: 6 }}>{f.phase}</td>
                <td style={{ padding: 6 }}>
                  <code>{`${f.difficulty}_${f.phase}_book.json`}</code>
                </td>
                <td style={{ padding: 6, textAlign: 'right' }}>{f.entries != null ? f.entries : '—'}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{f.bytes != null ? f.bytes : '—'}</td>
                <td style={{ padding: 6 }}>
                  {f.status === 'ok' && <span className="kpi kpi--accent">OK</span>}
                  {f.status === 'missing' && <span className="kpi kpi--warning">No encontrado</span>}
                  {f.status === 'loading' && <span className="kpi"><span className="spinner" aria-hidden="true" /> Cargando…</span>}
                  {f.status === 'error' && <span className="kpi kpi--danger">Error</span>}
                </td>
                <td style={{ padding: 6 }}>
                  {f.status === 'ok' ? (
                    <a className="btn-ghost" href={f.url} target="_blank" rel="noreferrer" download>
                      Descargar
                    </a>
                  ) : (
                    <button className="btn-ghost" disabled title="No disponible">Descargar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
