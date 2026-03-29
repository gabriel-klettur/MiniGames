import { useState, memo } from 'react';
import { getDiagramById } from '../../data/diagrams';
import { useI18n } from '../../i18n';
import InteractiveDiagram from './InteractiveDiagram';

interface Props {
  conceptId: string;
  defaultOpen?: boolean;
}

function DiagramPanel({ conceptId, defaultOpen = false }: Props) {
  const { t } = useI18n();
  const diagram = getDiagramById(conceptId);
  const [open, setOpen] = useState(defaultOpen);

  if (!diagram) return null;

  return (
    <div className="glass-subtle rounded-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium text-gray-400 transition hover:text-brand-300"
      >
        <span>{open ? t('diagram_hide') : t('diagram_show')}</span>
        <span className={`transform transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="border-t border-white/[0.04] p-4 animate-slide-up">
          <InteractiveDiagram diagram={diagram} />
        </div>
      )}
    </div>
  );
}

export default memo(DiagramPanel);
