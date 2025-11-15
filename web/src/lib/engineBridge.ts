import {
  demoDb,
  demoDimensionConfig,
  demoFactTables,
  demoMetrics,
  demoTransforms,
  runQuery,
  type FilterContext,
  type MetricDefinition,
  type MetricRegistry,
  type Row,
} from '@engine/semanticEngine';
import { ZodError, z } from 'zod';

export interface PlaygroundQueryRequest {
  rows: string[];
  metrics: string[];
  factForRows: string;
  filters: FilterContext;
}

export interface QueryRunResult {
  rows: Row[];
  durationMs: number;
}

const FACT_MEASURE_SCHEMA = z.object({
  kind: z.literal('factMeasure'),
  name: z.string().min(1),
  description: z.string().optional(),
  factTable: z.string().min(1),
  factColumn: z.string().min(1),
  format: z.string().optional(),
  agg: z.enum(['sum', 'avg', 'count']).optional(),
  grain: z.array(z.string()).min(1).optional(),
});

const METRIC_ARRAY_SCHEMA = z.array(FACT_MEASURE_SCHEMA);

const EDITABLE_METRICS = ['totalSalesAmount', 'totalSalesQuantity', 'totalBudget', 'salesAmountYearRegion'];

export const defaultMetricEditorText = JSON.stringify(
  EDITABLE_METRICS.map((name) => demoMetrics[name]).filter(Boolean),
  null,
  2,
);

export function validateMetricOverrides(value: string): {
  definitions: MetricDefinition[];
  error?: string;
} {
  if (!value.trim()) {
    return { definitions: [] };
  }

  try {
    const parsed = JSON.parse(value);
    const metrics = METRIC_ARRAY_SCHEMA.parse(parsed);
    return { definitions: metrics };
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join('; ');
      return { definitions: [], error: message };
    }
    return { definitions: [], error: (error as Error).message };
  }
}

export function buildMetricRegistry(overrides: MetricDefinition[]): MetricRegistry {
  const registry: MetricRegistry = { ...demoMetrics };
  overrides.forEach((metric) => {
    registry[metric.name] = metric;
  });
  return registry;
}

export function runPlaygroundQuery(
  request: PlaygroundQueryRequest,
  overrides: MetricDefinition[],
): QueryRunResult {
  const metricRegistry = buildMetricRegistry(overrides);
  const start = performance.now();
  const rows = runQuery(
    demoDb,
    demoFactTables,
    metricRegistry,
    demoTransforms,
    demoDimensionConfig,
    request,
  );
  const durationMs = performance.now() - start;
  return { rows, durationMs };
}

export const dimensionLabels: Record<string, string> = {
  year: 'Year',
  month: 'Month',
  regionId: 'Region',
  productId: 'Product',
};

export const factTableOptions = (Object.entries(demoFactTables) as [
  string,
  (typeof demoFactTables)[keyof typeof demoFactTables],
][]).map(([name, def]) => ({
  id: name,
  label: name,
  grain: def.grain,
}));

function uniqueNumericValues(tableKey: keyof typeof demoDb['facts'], field: string): number[] {
  const rows = demoDb.facts[tableKey] ?? [];
  const values = rows
    .map((row) => Number(row[field]))
    .filter((value) => !Number.isNaN(value));
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

export const yearOptions = uniqueNumericValues('sales', 'year');
export const monthOptions = Array.from({ length: 12 }, (_, idx) => idx + 1);
export type RegionOption = { regionId: string; name: string };
export type ProductOption = { productId: number; name: string };

export const regionOptions = (demoDb.dimensions.regions ?? []) as RegionOption[];
export const productOptions = (demoDb.dimensions.products ?? []) as ProductOption[];

export const defaultQueryRequest: PlaygroundQueryRequest = {
  rows: ['regionId', 'productId'],
  metrics: ['totalSalesAmount', 'pricePerUnit', 'salesVsBudgetPct'],
  factForRows: 'sales',
  filters: { year: 2025, month: 2 },
};

export const dimensionForFact: Record<string, string[]> = Object.fromEntries(
  (Object.entries(demoFactTables) as [
    string,
    (typeof demoFactTables)[keyof typeof demoFactTables],
  ][]).map(([fact, def]) => [fact, def.grain]),
);

export const dimensionConfig = demoDimensionConfig;

export const dbSnapshot = demoDb;

export type { FilterContext, MetricDefinition, MetricRegistry, Row } from '@engine/semanticEngine';
