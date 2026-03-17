export function renderEnvVars(container: HTMLElement): void {
  const env = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};

  const rows = Object.entries(env)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const display = value === undefined ? '<em>undefined</em>' : String(value);
      return `<tr><td class="envvars-key">${key}</td><td class="envvars-val">${display}</td></tr>`;
    })
    .join('');

  container.innerHTML = `
    <h1 class="page-title">Environment Variables</h1>
    <div class="settings-section">
      <p>Variables visible to the frontend at build time (<code>import.meta.env</code>).</p>
      ${rows.length > 0 ? `
        <table class="envvars-table">
          <thead><tr><th>Variable</th><th>Value</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      ` : '<p>No environment variables found.</p>'}
    </div>
  `;
}
