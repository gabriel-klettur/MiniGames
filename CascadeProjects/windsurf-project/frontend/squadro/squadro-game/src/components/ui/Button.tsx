import React from 'react';

export type ButtonVariant = 'primary' | 'neutral' | 'accent' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pressed?: boolean;
}

const base = 'inline-flex items-center justify-center rounded-md border shadow-sm focus:outline-none focus:ring-2 ring-offset-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const sizes: Record<ButtonSize, string> = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
};
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 active:bg-blue-600 focus:ring-blue-400/30',
  neutral: 'bg-gray-800 text-gray-200 border-white/10 hover:bg-gray-700 active:bg-gray-700 focus:ring-blue-400/20',
  accent: 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 active:bg-indigo-600 focus:ring-indigo-400/30',
  outline: 'bg-transparent text-neutral-200 border-neutral-600 hover:bg-neutral-800/40 active:bg-neutral-800/60 focus:ring-blue-400/20',
  danger: 'bg-red-700 text-white border-red-600 hover:bg-red-600 active:bg-red-700 focus:ring-red-400/30',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'sm',
    className = '',
    pressed,
    type = 'button',
    children,
    ...rest
  },
  ref,
) {
  const cls = [base, sizes[size], variants[variant], className].join(' ').trim();
  return (
    <button ref={ref} type={type} aria-pressed={pressed} className={cls} {...rest}>
      {children}
    </button>
  );
});

export default Button;
