import React from 'react';

export interface ChartProps {
  labels: string[];
  series: number[];
  title?: string;
}

const Chart: React.FC<ChartProps> = ({ labels, series, title }) => {
  return (
    <div className="chart" style={{ border: '1px solid #30363d', borderRadius: 8, padding: 8 }}>
      {title && <div className="section-title" style={{ marginBottom: 6 }}>{title}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
        {series.map((v, i) => (
          <div key={i} title={`${labels[i]}: ${v}`} style={{ width: 16, height: Math.max(2, v), background: '#2a6bcc' }} />
        ))}
      </div>
    </div>
  );
};

export default Chart;
