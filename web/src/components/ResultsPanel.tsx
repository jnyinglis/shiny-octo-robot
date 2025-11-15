import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import type { PlaygroundQueryRequest, Row } from '../lib/engineBridge';
import { dimensionConfig } from '../lib/engineBridge';

interface ResultsPanelProps {
  rows: Row[];
  lastRequest: PlaygroundQueryRequest;
  durationMs: number | null;
  error?: string;
}

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function parseNumericValue(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const sanitized = value.replace(/[^0-9.-]/g, '');
  if (!sanitized) return null;
  const parsed = Number(sanitized);
  return Number.isNaN(parsed) ? null : parsed;
}

function getLabelField(dimKey: string): string | undefined {
  return dimensionConfig[dimKey]?.labelAlias;
}

export function ResultsPanel({ rows, lastRequest, durationMs, error }: ResultsPanelProps) {
  const [chartMetric, setChartMetric] = useState<string | null>(
    lastRequest.metrics[0] ?? null,
  );
  const [chartMode, setChartMode] = useState<'bar' | 'line'>('bar');

  const activeChartMetric = lastRequest.metrics.includes(chartMetric ?? '')
    ? chartMetric
    : lastRequest.metrics[0] ?? null;

  const tableHeaders = useMemo(() => {
    if (rows.length === 0) {
      return lastRequest.rows.concat(lastRequest.metrics);
    }
    return Object.keys(rows[0]);
  }, [rows, lastRequest.rows, lastRequest.metrics]);

  const chartData = useMemo(() => {
    if (!activeChartMetric) return [];
    return rows
      .map((row) => {
        const dimensionKey = lastRequest.rows[0];
        const labelField = dimensionKey ? getLabelField(dimensionKey) : undefined;
        const labelValue = (labelField ? row[labelField] : undefined) ??
          (dimensionKey ? row[dimensionKey] : '');
        return {
          label: labelValue,
          value: parseNumericValue(row[activeChartMetric]),
        };
      })
      .filter((entry) => entry.value != null);
  }, [activeChartMetric, rows, lastRequest.rows]);

  const payload = useMemo(() => JSON.stringify(lastRequest, null, 2), [lastRequest]);
  const response = useMemo(() => JSON.stringify(rows, null, 2), [rows]);

  return (
    <section className="panel results-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Results</p>
          <h2>Dataset preview</h2>
        </div>
        <div className="button-row">
          <select
            value={activeChartMetric ?? ''}
            onChange={(event) => setChartMetric(event.target.value || null)}
          >
            <option value="">No chart</option>
            {lastRequest.metrics.map((metric) => (
              <option key={metric} value={metric}>
                {metric}
              </option>
            ))}
          </select>
          <select value={chartMode} onChange={(event) => setChartMode(event.target.value as 'bar' | 'line')}>
            <option value="bar">Bar</option>
            <option value="line">Line</option>
          </select>
        </div>
      </div>
      {durationMs != null && (
        <p className="hint">Query completed in {numberFormatter.format(durationMs)} ms.</p>
      )}
      {error && <p className="error">{error}</p>}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {tableHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={tableHeaders.length}>No rows returned.</td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx}>
                  {tableHeaders.map((header) => (
                    <td key={header}>{String(row[header] ?? '')}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {activeChartMetric && chartData.length > 0 && (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={240}>
            {chartMode === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" interval={0} angle={-15} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" interval={0} angle={-15} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
      <details>
        <summary>Request payload</summary>
        <pre>{payload}</pre>
      </details>
      <details>
        <summary>Raw response</summary>
        <pre>{response}</pre>
      </details>
    </section>
  );
}
