import React from 'react';
import Chart from './Chart';

export interface Dataset { id: string; name: string; color: string; records: Array<{ durationMs: number }>; }

const ChartContainer: React.FC<{ datasets: Dataset[] }> = ({ datasets }) => {
  // Simple aggregate: total duration per dataset
  const labels = datasets.map(d => d.name);
  const series = datasets.map(d => d.records.reduce((a, r) => a + r.durationMs, 0) / 1000);
  return (
    <Chart labels={labels} series={series} title="Duración total (s)" />
  );
};

export default ChartContainer;
