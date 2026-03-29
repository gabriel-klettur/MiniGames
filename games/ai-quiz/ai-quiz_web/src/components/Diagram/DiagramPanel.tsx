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
    <div className="rounded-card border border-gray-700/50 bg-gray-800/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-300 transition hover:text-brand-300"
      >
        <span>{open ? t('diagram_hide') : t('diagram_show')}</span>
        <span className={`transform transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-700/30 p-4 animate-slide-up">
          <InteractiveDiagram diagram={diagram} />
        </div>
      )}
    </div>
  );
}

export default memo(DiagramPanel);
