import type { FC, ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
}

const Card: FC<CardProps> = ({ title, children }) => (
  <div className="card" style={{ border: '1px solid #30363d', borderRadius: 8, padding: 12, background: '#0d1117' }}>
    <div className="card__title" style={{ marginBottom: 8, fontWeight: 600 }}>{title}</div>
    {children}
  </div>
);

export default Card;
