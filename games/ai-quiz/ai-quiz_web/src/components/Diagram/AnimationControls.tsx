import { memo } from 'react';
import type { AnimationStep } from '../../data/diagrams/types';
import { useI18n } from '../../i18n';

interface Props {
  steps: AnimationStep[];
  currentStep: number;
  isPlaying: boolean;
  onStepChange: (step: number) => void;
  onTogglePlay: () => void;
}

function AnimationControls({ steps, currentStep, isPlaying, onStepChange, onTogglePlay }: Props) {
  const { t } = useI18n();
  const total = steps.length;
  const step = steps[currentStep];

  const handlePrev = () => {
    if (currentStep > 0) onStepChange(currentStep - 1);
  };

  const handleNext = () => {
    if (currentStep < total - 1) onStepChange(currentStep + 1);
  };

  const handleReset = () => {
    onStepChange(0);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Step description */}
      <div className="min-h-[2.5rem] rounded-lg bg-gray-800/60 px-3 py-2 text-center text-sm text-gray-300">
        {step?.description ?? t('anim_no_desc')}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleReset}
          disabled={currentStep === 0}
          className="rounded-lg px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
          title={t('anim_reset')}
        >
          ⏮
        </button>

        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="rounded-lg px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
          title={t('anim_prev')}
        >
          ◀
        </button>

        <button
          onClick={onTogglePlay}
          className="rounded-lg bg-brand-600/80 px-3 py-1 text-xs font-medium text-white transition hover:bg-brand-500"
          title={isPlaying ? t('anim_pause_tip') : t('anim_play_tip')}
        >
          {isPlaying ? t('anim_pause') : t('anim_play')}
        </button>

        <button
          onClick={handleNext}
          disabled={currentStep >= total - 1}
          className="rounded-lg px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
          title={t('anim_next')}
        >
          ▶
        </button>

        {/* Step counter */}
        <span className="ml-2 text-xs text-gray-500">
          {currentStep + 1}/{total}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => onStepChange(i)}
            className={`h-2 w-2 rounded-full transition ${
              i === currentStep
                ? 'bg-brand-400 scale-125'
                : i < currentStep
                  ? 'bg-brand-700'
                  : 'bg-gray-700'
            }`}
            title={t('anim_step', { n: i + 1 })}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(AnimationControls);
