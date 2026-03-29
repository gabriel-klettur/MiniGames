import { useState, memo } from 'react';
import { getHintById } from '../../data/hints';
import { useI18n } from '../../i18n';

interface Props {
  conceptId: string;
}

function HelpPanel({ conceptId }: Props) {
  const { t, locale } = useI18n();
  const help = getHintById(conceptId, locale);
  const [open, setOpen] = useState(false);

  if (!help) return null;

  return (
    <div className="rounded-card border border-gray-700/50 bg-gray-800/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-300 transition hover:text-brand-300"
      >
        <span>{open ? t('help_hide') : t('help_show')}</span>
        <span className={`transform transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-700/30 p-4 animate-slide-up space-y-3">
          <p className="text-xs italic text-gray-400">{help.context}</p>
          <ul className="space-y-2">
            {help.glossary.map((entry) => (
              <li key={entry.term} className="text-sm">
                <span className="font-semibold text-brand-300">{entry.term}:</span>{' '}
                <span className="text-gray-300">{entry.explanation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default memo(HelpPanel);
