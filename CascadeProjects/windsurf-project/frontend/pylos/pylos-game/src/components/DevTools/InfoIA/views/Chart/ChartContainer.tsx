import type { InfoIAGameRecord } from '../../../../../utils/infoiaDb';
import Chart from './Chart';
import { useChartResize } from '../../hooks/useChartResize';
import { computeAggregates } from '../../utils/aggregates';

export type ChartDataset = {
  id?: string;
  name: string;
  color: string;
  records: InfoIAGameRecord[];
};

export default function ChartContainer({ datasets }: { datasets: ChartDataset[] }) {
  const { boxRef, width, height } = useChartResize();
  const W = width || 980;
  const H = height || 460;

  const dsAgg = datasets.map((ds) => ({
    id: ds.id,
    name: ds.name,
    color: ds.color,
    aggregates: computeAggregates(ds.records),
  }));
  const hasAnyAgg = dsAgg.some((d) => d.aggregates.length > 0);

  return (
    <div ref={boxRef} className="infoia__chart-container">
      {hasAnyAgg ? (
        <Chart width={W} height={H} datasets={dsAgg} />
      ) : (
        <p style={{ opacity: 0.8 }}>Sin datos todavía. Ejecuta simulaciones o agrega archivos para comparar.</p>
      )}
    </div>
  );
}
