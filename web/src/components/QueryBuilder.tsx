import type { PlaygroundQueryRequest } from '../lib/engineBridge';
import {
  dimensionLabels,
  dimensionForFact,
  factTableOptions,
  monthOptions,
  productOptions,
  regionOptions,
  yearOptions,
} from '../lib/engineBridge';

interface QueryBuilderProps {
  state: PlaygroundQueryRequest;
  onChange: (next: PlaygroundQueryRequest) => void;
  availableMetrics: string[];
  onRun: () => void;
  isRunning: boolean;
}

const NUMERIC_FILTERS: readonly string[] = ['year', 'month', 'productId'];

type FilterKey = 'year' | 'month' | 'regionId' | 'productId';

export function QueryBuilder({ state, onChange, availableMetrics, onRun, isRunning }: QueryBuilderProps) {
  const toggleRow = (key: string) => {
    const exists = state.rows.includes(key);
    const rows = exists ? state.rows.filter((dim) => dim !== key) : [...state.rows, key];
    onChange({ ...state, rows });
  };

  const toggleMetric = (metric: string) => {
    const exists = state.metrics.includes(metric);
    const metrics = exists
      ? state.metrics.filter((value) => value !== metric)
      : [...state.metrics, metric];
    onChange({ ...state, metrics });
  };

  const updateFilter = (key: FilterKey, value: string) => {
    const rawValue = value === '' ? undefined : value;
    const parsedValue =
      rawValue == null
        ? undefined
        : NUMERIC_FILTERS.includes(key)
        ? Number(rawValue)
        : rawValue;
    const nextFilters = { ...state.filters };
    if (parsedValue === undefined) {
      delete nextFilters[key];
    } else {
      nextFilters[key] = parsedValue;
    }
    onChange({
      ...state,
      filters: nextFilters,
    });
  };

  const availableRows = dimensionForFact[state.factForRows] ?? [];

  return (
    <section className="panel query-builder">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Visual runner</p>
          <h2>Query builder</h2>
        </div>
        <button type="button" onClick={onRun} disabled={isRunning}>
          {isRunning ? 'Running…' : 'Run query'}
        </button>
      </div>
      <div className="form-grid">
        <div>
          <label htmlFor="fact-table">Fact for rows</label>
          <select
            id="fact-table"
            value={state.factForRows}
            onChange={(event) =>
              onChange({
                ...state,
                factForRows: event.target.value,
                rows: [],
              })
            }
          >
            {factTableOptions.map((fact) => (
              <option key={fact.id} value={fact.id}>
                {fact.label}
              </option>
            ))}
          </select>
        </div>
        <div className="rows-panel">
          <span>Row dimensions</span>
          <div className="chip-grid">
            {availableRows.map((dim) => {
              const label = dimensionLabels[dim] ?? dim;
              return (
                <button
                  type="button"
                  key={dim}
                  className={state.rows.includes(dim) ? 'chip selected' : 'chip'}
                  onClick={() => toggleRow(dim)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="rows-panel">
          <span>Metric selection</span>
          <div className="metric-grid">
            {availableMetrics.map((metric) => (
              <label key={metric}>
                <input
                  type="checkbox"
                  checked={state.metrics.includes(metric)}
                  onChange={() => toggleMetric(metric)}
                />
                {metric}
              </label>
            ))}
          </div>
        </div>
        <div className="filters">
          <span>Filters</span>
          <div className="filter-grid">
            <label>
              Year
              <select
                value={(state.filters.year as number | undefined)?.toString() ?? ''}
                onChange={(event) => updateFilter('year', event.target.value)}
              >
                <option value="">Any</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Month
              <select
                value={(state.filters.month as number | undefined)?.toString() ?? ''}
                onChange={(event) => updateFilter('month', event.target.value)}
              >
                <option value="">Any</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month.toString()}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Region
              <select
                value={(state.filters.regionId as string | undefined) ?? ''}
                onChange={(event) => updateFilter('regionId', event.target.value)}
              >
                <option value="">Any</option>
                {regionOptions.map((region) => (
                  <option key={region.regionId} value={region.regionId}>
                    {region.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Product
              <select
                value={
                  state.filters.productId !== undefined && state.filters.productId !== null
                    ? String(state.filters.productId)
                    : ''
                }
                onChange={(event) => updateFilter('productId', event.target.value)}
              >
                <option value="">Any</option>
                {productOptions.map((product) => (
                  <option key={product.productId} value={product.productId.toString()}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
      <p className="hint">
        Row dimensions are constrained by the grain of the fact table you select. Choose at least one
        metric before running the query.
      </p>
    </section>
  );
}
