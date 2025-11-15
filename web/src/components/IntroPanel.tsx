export function IntroPanel() {
  return (
    <section className="panel intro-panel">
      <header>
        <p className="eyebrow">Semantic Metrics Engine</p>
        <h1>Playground</h1>
      </header>
      <p>
        Explore the proof-of-concept semantic engine directly in your browser. Edit metric
        definitions, build a query, and visualize the result set without leaving this page.
      </p>
      <ul>
        <li>Metrics are reusable semantic objects (fact, derived, expression, time-intelligence).</li>
        <li>
          Query rows respect metric-level grain so you can mix yearly, regional, and product slices
          safely.
        </li>
        <li>
          The runner below uses the exact <code>runQuery</code> helper that ships inside
          <code>src/semanticEngine.ts</code>.
        </li>
      </ul>
      <p className="tip">
        Need a fresh start? Use the reset button in the editor to reload the README defaults.
      </p>
    </section>
  );
}
