import { useEffect, useRef, useState } from 'react';
import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';
import { useI18n, type Language } from '../i18n';

export interface HeaderPanelProps {
  title?: string;
  onNewGame: () => void;
  showTools: boolean;
  onToggleDev: () => void;
  // IA toggle button (placed to the left of 'Dev')
  showIA?: boolean;
  onToggleIA?: () => void;
  // Control para ocultar el botón IA en el header
  showIAToggle?: boolean;
  // Control para ocultar el botón Dev en el header
  showDevToggle?: boolean;
  // Iniciar partida contra IA (selección de lado y dificultad)
  onStartVsAI?: (enemy: 'L' | 'D', depth: number) => void;
}

/**
 * HeaderPanel: muestra el nombre del juego y acciones principales (Nuevo, Dev).
 * Se piensa para el Sidebar y busca ser compacto en altura.
 */
function HeaderPanel({ title = 'Pylos v1.1.10.2025.ALE', onNewGame, showTools, onToggleDev, showIA = false, onToggleIA = () => {}, showIAToggle = true, showDevToggle = true, onStartVsAI = () => {} }: HeaderPanelProps) {
  const { lang, setLang, t } = useI18n();
  // Estado del popover para Partida Vs IA
  const [vsOpen, setVsOpen] = useState<boolean>(false);
  // Estado del popover para selector de idioma
  const [langOpen, setLangOpen] = useState<boolean>(false);
  const langBtnRef = useRef<HTMLButtonElement | null>(null);
  const langPopRef = useRef<HTMLDivElement | null>(null);
  const [selectedSide, setSelectedSide] = useState<'L' | 'D' | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const [popTop, setPopTop] = useState<number | null>(null);

  // Cerrar al hacer click fuera (vsOpen y langOpen)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      // Close vsOpen popover
      if (vsOpen) {
        if (popRef.current && popRef.current.contains(target)) return;
        if (btnRef.current && btnRef.current.contains(target)) return;
        setVsOpen(false);
      }
      // Close langOpen popover
      if (langOpen) {
        if (langPopRef.current && langPopRef.current.contains(target)) return;
        if (langBtnRef.current && langBtnRef.current.contains(target)) return;
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [vsOpen, langOpen]);

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    setLangOpen(false);
  };


  // Inicio inmediato tras elegir dificultad
  const onPickDifficulty = (depth: number) => {
    if (!selectedSide) return;
    onStartVsAI(selectedSide, depth);
    setVsOpen(false);
    setSelectedSide(null);
  };

  // Posicionamiento: pegado a la derecha y debajo del botón, sin salir de viewport
  useEffect(() => {
    if (!vsOpen) return;
    const margin = 8;
    const updatePosition = () => {
      const rect = btnRef.current?.getBoundingClientRect() ?? anchorRect;
      if (rect) setAnchorRect(rect);
      const popEl = popRef.current;
      const popH = popEl ? popEl.offsetHeight : 0;
      let desiredTop = (rect ? rect.bottom : 0) + margin;
      // clamp to viewport
      const maxTop = Math.max(margin, window.innerHeight - popH - margin);
      const clampedTop = Math.min(Math.max(margin, desiredTop), maxTop);
      setPopTop(clampedTop);
    };
    // Measure after paint
    const id = window.requestAnimationFrame(updatePosition);
    const onWin = () => updatePosition();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, { passive: true });
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin);
    };
  }, [vsOpen, anchorRect]);
  return (
    <section className="header-bar" aria-label={lang === 'es' ? 'Encabezado' : 'Header'}>
      <div className="row header">
        <h2>{title}</h2>
        <div className="header-actions">
          <button onClick={onNewGame} aria-label={t.header.newGame} title={t.header.newGame}>
            {/* plus icon */}
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 11V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6z"/></svg>
            <span className="sr-only">{t.header.newGame}</span>
          </button>          
          {showIAToggle && (
            <button
              onClick={onToggleIA}
              aria-pressed={showIA}
              aria-label={t.header.toggleIA}
              title={t.header.ia}
            >
              <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M11 2h2v3h-2z"/>
                <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
                <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
                <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
                <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
              </svg>
              <span className="header-btn__label">{t.header.ia}</span>
            </button>
          )}
          {/* Language selector */}
          <button
            ref={langBtnRef}
            onClick={() => setLangOpen((v) => !v)}
            aria-pressed={langOpen}
            aria-label={t.language.label}
            title={t.language.label}
          >
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 12h20" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            <span className="header-btn__label">{lang.toUpperCase()}</span>
          </button>
          {/* History toggle removed as requested */}
          {showDevToggle && (
            <button
              onClick={onToggleDev}
              aria-pressed={showTools}
              aria-label={t.header.toggleDev}
              title={t.header.dev}
            >
              <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.88 7.88 0 0 0-1.7-.98l-.38-2.65A.5.5 0 0 0 13 1h-4a.5.5 0 0 0-.49.42l-.38 2.65c-.6.24-1.17.56-1.7.98l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L3.57 11c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.13.22.38.31.6.22l2.49-1c.53.42 1.1.74 1.7.98l.38 2.65c.04.24.25.42.49.42h4c.24 0 .45-.18.49-.42l.38-2.65c.6-.24 1.17-.56 1.7-.98l2.49 1c.22.09.47 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.64L19.43 12.98Z" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
              <span className="header-btn__label">{t.header.dev}</span>
            </button>
          )}
        </div>
      </div>
      {/* Language selector popover */}
      {langOpen && (
        <div
          ref={langPopRef}
          className="popover lang-popover"
          role="dialog"
          aria-label={t.language.label}
          style={{
            position: 'fixed',
            top: (langBtnRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
            right: 8,
            minWidth: 120,
            padding: '8px 0',
            background: 'var(--panel-bg, #1e1e1e)',
            border: '1px solid var(--border-color, #444)',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100,
          }}
        >
          <button
            className={lang === 'es' ? 'lang-option active' : 'lang-option'}
            onClick={() => handleLangChange('es')}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              textAlign: 'left',
              background: lang === 'es' ? 'var(--accent-color, #3b82f6)' : 'transparent',
              color: 'inherit',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t.language.es}
          </button>
          <button
            className={lang === 'en' ? 'lang-option active' : 'lang-option'}
            onClick={() => handleLangChange('en')}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              textAlign: 'left',
              background: lang === 'en' ? 'var(--accent-color, #3b82f6)' : 'transparent',
              color: 'inherit',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t.language.en}
          </button>
        </div>
      )}
      {/* Popover Vs IA */}
      {vsOpen && (
        <div
          id="vsai-popover"
          ref={popRef}
          className="popover vsai-popover"
          role="dialog"
          aria-label={t.vsAI.selectSide}
          style={{
            position: 'fixed',
            top: popTop ?? (anchorRect ? anchorRect.bottom + 8 : 8),
            right: 8,
          }}
        >
          <div className="vsai-section" aria-label={t.vsAI.selectSide}>
            <div className="vsai-title">{t.vsAI.title}</div>
            <div className="vsai-options" role="listbox" aria-label={t.vsAI.enemySide}>
              <button
                className={selectedSide === 'L' ? 'active' : ''}
                onClick={() => setSelectedSide('L')}
                aria-selected={selectedSide === 'L'}
              >
                <img src={bolaB} alt={t.vsAI.orange} />
                <span>{t.vsAI.orange}</span>
              </button>
              <button
                className={selectedSide === 'D' ? 'active' : ''}
                onClick={() => setSelectedSide('D')}
                aria-selected={selectedSide === 'D'}
              >
                <img src={bolaA} alt={t.vsAI.brown} />
                <span>{t.vsAI.brown}</span>
              </button>
            </div>
        </div>
        {/* Velocidad/tiempo removidos: configuración centralizada en IAPanel (DevTools) */}
        <div className="vsai-section" aria-label={t.vsAI.difficultyLevel}>
          <div className="vsai-title">{t.vsAI.difficulty}</div>
          <div className="vsai-diffs" role="listbox" aria-label={t.vsAI.difficultyLevel}>
            {[1,2,3,4,5,6,7,8,9,10].map((d) => (
              <button
                key={d}
                onClick={() => onPickDifficulty(d)}
                disabled={!selectedSide}
                title={selectedSide ? t.vsAI.startVsAI.replace('{level}', String(d)) : t.vsAI.chooseSideFirst}
              >{d}</button>
            ))}
          </div>
          <div className="vsai-hint">{t.vsAI.hint}</div>
        </div>
      </div>
      )}
    </section>
  );
}

export default HeaderPanel;
