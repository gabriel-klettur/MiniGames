import type { FC, ReactNode } from 'react';

interface CardProps {
  title: ReactNode;
  children: ReactNode;
}

const Card: FC<CardProps> = ({ title, children }) => (
  <div className="card" style={{ border: '1px solid #30363d', borderRadius: 8, padding: 12, background: '#0d1117' }}>
    <div className="card__title" style={{ marginBottom: 8, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      {title}
    </div>
    {children}
  </div>
);

export default Card;
