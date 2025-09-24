import React from 'react';

export type ButtonVariant = 'primary' | 'neutral';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pressed?: boolean;
}

const base = 'inline-flex items-center justify-center rounded-md border shadow-sm focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const sizes: Record<ButtonSize, string> = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
};
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-700 text-white border-blue-600 hover:bg-blue-600 active:bg-blue-600 focus:ring-blue-400/30',
  neutral: 'bg-gray-800 text-gray-200 border-white/10 hover:bg-gray-700 active:bg-gray-700 focus:ring-blue-400/20',
};

export default function Button({
  variant = 'primary',
  size = 'sm',
  className = '',
  pressed,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const cls = [base, sizes[size], variants[variant], className].join(' ').trim();
  return (
    <button type={type} aria-pressed={pressed} className={cls} {...rest}>
      {children}
    </button>
  );
}
