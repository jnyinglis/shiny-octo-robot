import Editor from '@monaco-editor/react';
import type { MetricDefinition } from '../lib/engineBridge';

interface MetricEditorProps {
  value: string;
  onChange: (next: string) => void;
  onApply: () => void;
  onReset: () => void;
  parseError?: string;
  parsedMetrics: MetricDefinition[];
  isApplyingDisabled: boolean;
}

export function MetricEditor({
  value,
  onChange,
  onApply,
  onReset,
  parseError,
  parsedMetrics,
  isApplyingDisabled,
}: MetricEditorProps) {
  return (
    <section className="panel metric-editor">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Metric editor</p>
          <h2>factMeasure overrides</h2>
        </div>
        <div className="button-row">
          <button type="button" className="ghost" onClick={onReset}>
            Reset to defaults
          </button>
          <button type="button" onClick={onApply} disabled={isApplyingDisabled}>
            Apply overrides
          </button>
        </div>
      </div>
      <p>
        Paste a JSON array of <code>factMeasure</code> definitions. When applied, these entries will
        override the defaults that ship from <code>src/semanticEngine.ts</code> and instantly wire the
        new metrics into the query runner.
      </p>
      <Editor
        language="json"
        height="320px"
        theme="vs-dark"
        value={value}
        options={{ minimap: { enabled: false }, fontSize: 14 }}
        onChange={(nextValue: string | undefined) => onChange(nextValue ?? '')}
      />
      {parseError ? (
        <p className="error">{parseError}</p>
      ) : (
        <p className="status">Ready to apply {parsedMetrics.length} metric overrides.</p>
      )}
    </section>
  );
}
