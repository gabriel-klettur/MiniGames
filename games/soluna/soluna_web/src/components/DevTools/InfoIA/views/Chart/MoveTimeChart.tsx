import React from 'react';
import Chart from './Chart';

const MoveTimeChart: React.FC<{ perMoveMs: number[] }> = ({ perMoveMs }) => {
  const labels = perMoveMs.map((_, i) => `#${i+1}`);
  const series = perMoveMs.map(ms => Math.max(2, Math.round(ms/10)));
  return <Chart labels={labels} series={series} title="Tiempo por jugada" />;
};

export default MoveTimeChart;
