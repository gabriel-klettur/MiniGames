import type { FC, ReactNode } from 'react';

interface SectionProps {
  title: string;
  children?: ReactNode;
}

const Section: FC<SectionProps> = ({ title, children }) => (
  <div className="section" style={{ marginTop: 10 }}>
    <div className="section-title" style={{ fontSize: 13, opacity: 0.9 }}>{title}</div>
    <div style={{ marginTop: 8 }}>{children}</div>
  </div>
);

export default Section;
