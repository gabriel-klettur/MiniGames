export { default as InfoIA } from './InfoIA';
export { default as InfoIAContainer } from './InfoIA';

// Views
export { default as Controls } from './views/Controls';
export { default as TimeBar } from './views/TimeBar';
export { default as CompareBar } from './views/CompareBar';
export { default as TablaIA } from './views/TablaIA';
export { default as Chart } from './views/Chart/ChartContainer';
export { default as ChartContainer } from './views/Chart/ChartContainer';

// Hooks (export functions only to avoid type name collisions)
export { useInfoIASim } from './hooks/useInfoIASim';
export { useCompareDatasets } from './hooks/useCompareDatasets';
export { useAggregates } from './hooks/useAggregates';
export { useChartResize } from './hooks/useChartResize';
export { useExports } from './hooks/useExports';
export { useRepetitionLimit } from './hooks/useRepetitionLimit';
export { useProgress } from './hooks/useProgress';

// Services
export * from './services/storage';
export * from './services/book';
export * from './services/aiRunner';

// Utils
export * from './utils/csv';
export * from './utils/date';
export * from './utils/aggregates';
export * from './utils/chart';
export * from './utils/colors';
export * from './utils/parse';

// Types (single source of truth)
export * from './types';
