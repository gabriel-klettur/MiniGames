import React from 'react';
import Button from '../../../ui/Button.tsx';
import { nextVal } from '../utils/controls.ts';

export interface ControlRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  sliderStep: number;
  buttonStep?: number; // defaults to sliderStep
  inputStep?: number; // defaults to sliderStep
  accentClass?: string; // e.g., 'accent-blue-400'
  ariaLabelSlider: string;
  ariaLabelDec: string;
  ariaLabelInc: string;
  ariaLabelInput: string;
  minusTitle?: string;
  plusTitle?: string;
  resetValue?: number;
  numberInputWidthClass?: string; // e.g., 'w-14', 'w-16', 'w-20'
}

const ControlRow: React.FC<ControlRowProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  sliderStep,
  buttonStep,
  inputStep,
  accentClass = '',
  ariaLabelSlider,
  ariaLabelDec,
  ariaLabelInc,
  ariaLabelInput,
  minusTitle,
  plusTitle,
  resetValue,
  numberInputWidthClass = 'w-16',
}) => {
  const btnStep = typeof buttonStep === 'number' ? buttonStep : sliderStep;
  const inpStep = typeof inputStep === 'number' ? inputStep : sliderStep;

  return (
    <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] items-center gap-2 w-full">
      <label className="text-xs text-neutral-400 whitespace-nowrap">{label}</label>
      <Button
        size="sm"
        variant="neutral"
        onClick={() => onChange(nextVal(value, btnStep, min, max, -1))}
        aria-label={ariaLabelDec}
        title={minusTitle}
      >
        −
      </Button>
      <input
        type="range"
        min={min}
        max={max}
        step={sliderStep}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`min-w-0 w-full ${accentClass}`}
        aria-label={ariaLabelSlider}
      />
      <Button
        size="sm"
        variant="neutral"
        onClick={() => onChange(nextVal(value, btnStep, min, max, +1))}
        aria-label={ariaLabelInc}
        title={plusTitle}
      >
        +
      </Button>
      <input
        type="number"
        min={min}
        max={max}
        step={inpStep}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${numberInputWidthClass} rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 text-center`}
        aria-label={ariaLabelInput}
      />
      {typeof resetValue === 'number' && (
        <Button size="sm" variant="neutral" onClick={() => onChange(resetValue)}>Reset</Button>
      )}
    </div>
  );
};

export default ControlRow;
