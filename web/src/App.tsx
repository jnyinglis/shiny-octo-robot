import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { IntroPanel } from './components/IntroPanel';
import { MetricEditor } from './components/MetricEditor';
import { QueryBuilder } from './components/QueryBuilder';
import { ResultsPanel } from './components/ResultsPanel';
import {
  buildMetricRegistry,
  defaultMetricEditorText,
  defaultQueryRequest,
  runPlaygroundQuery,
  validateMetricOverrides,
  type MetricDefinition,
  type PlaygroundQueryRequest,
  type Row,
} from './lib/engineBridge';

const STORAGE_KEY = 'sme-metric-overrides';

const defaultParsed = validateMetricOverrides(defaultMetricEditorText).definitions;

function snapshotRequest(request: PlaygroundQueryRequest): PlaygroundQueryRequest {
  return {
    factForRows: request.factForRows,
    metrics: [...request.metrics],
    rows: [...request.rows],
    filters: { ...request.filters },
  };
}

export default function App() {
  const [editorValue, setEditorValue] = useState(defaultMetricEditorText);
  const [activeOverrides, setActiveOverrides] = useState<MetricDefinition[]>(defaultParsed);
  const [queryState, setQueryState] = useState<PlaygroundQueryRequest>(snapshotRequest(defaultQueryRequest));
  const [resultRows, setResultRows] = useState<Row[]>([]);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [lastRequest, setLastRequest] = useState<PlaygroundQueryRequest>(snapshotRequest(defaultQueryRequest));
  const [isRunning, setIsRunning] = useState(false);

  const parsed = useMemo(() => validateMetricOverrides(editorValue), [editorValue]);

  const runAndStore = useCallback(
    (request: PlaygroundQueryRequest, overrides: MetricDefinition[]) => {
      setIsRunning(true);
      try {
        const result = runPlaygroundQuery(request, overrides);
        setResultRows(result.rows);
        setDurationMs(result.durationMs);
        setLastRequest(request);
        setError(undefined);
      } catch (err) {
        setResultRows([]);
        setDurationMs(null);
        setError((err as Error).message);
        setLastRequest(request);
      } finally {
        setIsRunning(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setEditorValue(stored);
      const storedParse = validateMetricOverrides(stored);
      if (!storedParse.error) {
        setActiveOverrides(storedParse.definitions);
        runAndStore(snapshotRequest(defaultQueryRequest), storedParse.definitions);
        return;
      }
    }
    runAndStore(snapshotRequest(defaultQueryRequest), defaultParsed);
  }, [runAndStore]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, editorValue);
  }, [editorValue]);

  const handleRun = useCallback(() => {
    const snapshot = snapshotRequest(queryState);
    runAndStore(snapshot, activeOverrides);
  }, [activeOverrides, queryState, runAndStore]);

  const availableMetrics = useMemo(() => {
    const registry = buildMetricRegistry(activeOverrides);
    return Object.keys(registry).sort((a, b) => a.localeCompare(b));
  }, [activeOverrides]);

  const handleApplyOverrides = () => {
    if (parsed.error) return;
    setActiveOverrides(parsed.definitions);
    const snapshot = snapshotRequest(queryState);
    runAndStore(snapshot, parsed.definitions);
  };

  const handleResetEditor = () => {
    setEditorValue(defaultMetricEditorText);
    setActiveOverrides(defaultParsed);
    const snapshot = snapshotRequest(queryState);
    runAndStore(snapshot, defaultParsed);
  };

  return (
    <div className="app-shell">
      <IntroPanel />
      <div className="grid">
        <MetricEditor
          value={editorValue}
          onChange={setEditorValue}
          onApply={handleApplyOverrides}
          onReset={handleResetEditor}
          parseError={parsed.error}
          parsedMetrics={parsed.definitions}
          isApplyingDisabled={Boolean(parsed.error)}
        />
        <QueryBuilder
          state={queryState}
          onChange={setQueryState}
          availableMetrics={availableMetrics}
          onRun={handleRun}
          isRunning={isRunning}
        />
        <ResultsPanel rows={resultRows} lastRequest={lastRequest} durationMs={durationMs} error={error} />
      </div>
    </div>
  );
}
