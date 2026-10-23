import { createSignal, For, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import SeriesPlot from "./SeriesPlot";
import type { Fit, Series } from "./series";
import "./App.css";

function hasTauriBridge() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function App() {
  const [series, setSeries] = createSignal<Series | null>(null);
  const [fit, setFit] = createSignal<Fit | null>(null);
  const [error, setError] = createSignal("");
  const [opening, setOpening] = createSignal(false);
  const [fitting, setFitting] = createSignal(false);
  const [exportingPng, setExportingPng] = createSignal(false);
  const [exportingMarkdown, setExportingMarkdown] = createSignal(false);

  async function fitDegree(degree: 1 | 2 | 3) {
    setFitting(true);
    setError("");
    if (!hasTauriBridge()) {
      setError("Polynomial fits run in the LabBench window. This browser tab cannot call the fit.");
      setFitting(false);
      return;
    }
    try {
      const fit = await invoke<Fit>("fit_series", { degree });
      setFit(fit);
    } catch (err) {
      setError(typeof err === "string" ? err : "The fit did not run.");
    } finally {
      setFitting(false);
    }
  }

  async function exportPng() {
    setError("");
    if (!hasTauriBridge()) {
      setError("Export PNG runs in the LabBench window.");
      return;
    }
    const svg = document.querySelector("svg.plot");
    if (!(svg instanceof SVGSVGElement) || !fit()) {
      setError("Fit a polynomial before exporting a PNG.");
      return;
    }
    const markup = new XMLSerializer().serializeToString(svg);
    setExportingPng(true);
    try {
      const selected = await save({
        title: "Export PNG",
        defaultPath: "plot.png",
        filters: [{ name: "PNG", extensions: ["png"] }],
      });
      if (typeof selected !== "string") {
        return;
      }
      await invoke("export_png", { path: selected, svg: markup });
    } catch (err) {
      setError(typeof err === "string" ? err : "The PNG was not written.");
    } finally {
      setExportingPng(false);
    }
  }

  async function exportMarkdown() {
    setError("");
    if (!hasTauriBridge()) {
      setError("Export Markdown runs in the LabBench window.");
      return;
    }
    if (!fit()) {
      setError("Fit a polynomial before exporting Markdown.");
      return;
    }
    setExportingMarkdown(true);
    try {
      const selected = await save({
        title: "Export Markdown",
        defaultPath: "fit.md",
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      if (typeof selected !== "string") {
        return;
      }
      await invoke("export_markdown", { path: selected });
    } catch (err) {
      setError(typeof err === "string" ? err : "The Markdown file was not written.");
    } finally {
      setExportingMarkdown(false);
    }
  }

  async function openCsv() {
    setOpening(true);
    setError("");
    if (!hasTauriBridge()) {
      setError("Open CSV runs in the LabBench window. This browser tab has no file dialog.");
      setOpening(false);
      return;
    }
    try {
      const selected = await open({
        title: "Open CSV",
        multiple: false,
        directory: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (typeof selected !== "string") {
        return;
      }
      const loaded = await invoke<Series>("open_csv", { path: selected });
      setFit(null);
      setSeries(loaded);
    } catch (err) {
      setError(typeof err === "string" ? err : "The file did not load.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <main>
      <header>
        <h1>LabBench</h1>
        <button type="button" onClick={() => void openCsv()} disabled={opening()}>
          {opening() ? "Opening…" : "Open CSV"}
        </button>
      </header>

      <Show when={error()}>
        <p class="error" role="alert">
          {error()}
        </p>
      </Show>

      <Show when={series()} fallback={<p class="empty">No series.</p>}>
        {(loaded) => (
          <section aria-label="Loaded series">
            <p class="count">{loaded().points.length} points</p>
            <div class="fit-actions" role="group" aria-label="Polynomial degree">
              <For each={[1, 2, 3] as const}>
                {(degree) => (
                  <button
                    type="button"
                    class="secondary"
                    onClick={() => void fitDegree(degree)}
                    disabled={fitting()}
                  >
                    Fit degree {degree}
                  </button>
                )}
              </For>
            </div>
            <Show when={fit()}>
              {(current) => (
                <div class="fit-summary">
                  <p>
                    Degree {current().degree}
                  </p>
                  <dl>
                    <For each={current().coefficients}>
                      {(coefficient, index) => (
                        <div>
                          <dt>{termName(index(), current().degree)}</dt>
                          <dd>
                            {formatStat(coefficient)}, standard error{" "}
                            {formatStat(current().standard_errors[index()])}
                          </dd>
                        </div>
                      )}
                    </For>
                    <div>
                      <dt>R^2</dt>
                      <dd>{formatStat(current().r_squared)}</dd>
                    </div>
                  </dl>
                  <div class="export-actions">
                    <button
                      type="button"
                      class="secondary"
                      onClick={() => void exportPng()}
                      disabled={exportingPng() || exportingMarkdown()}
                    >
                      {exportingPng() ? "Exporting…" : "Export PNG"}
                    </button>
                    <button
                      type="button"
                      class="secondary"
                      onClick={() => void exportMarkdown()}
                      disabled={exportingPng() || exportingMarkdown()}
                    >
                      {exportingMarkdown() ? "Exporting…" : "Export Markdown"}
                    </button>
                  </div>
                </div>
              )}
            </Show>
            <SeriesPlot series={loaded()} fit={fit()} />
            <dl>
              <div>
                <dt>x</dt>
                <dd>{loaded().x_name}</dd>
              </div>
              <div>
                <dt>dx</dt>
                <dd>{loaded().dx_name}</dd>
              </div>
              <div>
                <dt>y</dt>
                <dd>{loaded().y_name}</dd>
              </div>
              <div>
                <dt>dy</dt>
                <dd>{loaded().dy_name}</dd>
              </div>
            </dl>
            <table>
              <thead>
                <tr>
                  <th scope="col">{loaded().x_name}</th>
                  <th scope="col">{loaded().dx_name}</th>
                  <th scope="col">{loaded().y_name}</th>
                  <th scope="col">{loaded().dy_name}</th>
                </tr>
              </thead>
              <tbody>
                <For each={loaded().points}>
                  {(point) => (
                    <tr>
                      <td>{point.x}</td>
                      <td>{point.dx}</td>
                      <td>{point.y}</td>
                      <td>{point.dy}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </section>
        )}
      </Show>
    </main>
  );
}

function termName(index: number, degree: number): string {
  if (index === 0) {
    return "constant";
  }
  if (index === 1 && degree === 1) {
    return "slope";
  }
  if (index === 1) {
    return "x";
  }
  return `x^${index}`;
}

function formatStat(value: number): string {
  if (!Number.isFinite(value)) {
    return "not a number";
  }
  return String(Number(value.toPrecision(6)));
}

export default App;
