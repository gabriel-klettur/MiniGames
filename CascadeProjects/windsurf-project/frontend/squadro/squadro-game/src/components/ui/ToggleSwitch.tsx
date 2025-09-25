interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  className?: string;
}

/**
 * A simple accessible toggle switch built with a button.
 * - role="switch", aria-checked
 * - Labels shown inline left/right
 */
export default function ToggleSwitch({
  checked,
  onChange,
  onLabel = 'On',
  offLabel = 'Off',
  className = '',
}: ToggleSwitchProps) {
  const knobTranslate = checked ? 'translate-x-5' : 'translate-x-0';
  const trackColor = checked ? 'bg-blue-600' : 'bg-gray-600';
  return (
    <div className={["inline-flex items-center gap-2", className].join(' ').trim()}>
      <span className="text-xs text-gray-300 select-none">{offLabel}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/40',
          trackColor,
        ].join(' ')}
        title={`${checked ? onLabel : offLabel}`}
      >
        <span className="sr-only">Toggle</span>
        <span
          aria-hidden
          className={[
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
            knobTranslate,
          ].join(' ')}
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
        />
      </button>
      <span className="text-xs text-gray-300 select-none">{onLabel}</span>
    </div>
  );
}
