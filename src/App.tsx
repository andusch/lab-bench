import { createSignal, For, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import SeriesPlot from "./SeriesPlot";
import type { Series } from "./series";
import "./App.css";

function App() {
  const [series, setSeries] = createSignal<Series | null>(null);
  const [error, setError] = createSignal("");
  const [opening, setOpening] = createSignal(false);
  const [fitting, setFitting] = createSignal(false);

  async function fitDegree(degree: 1 | 2 | 3) {
    setFitting(true);
    setError("");
    try {
      await invoke("fit_series", { degree });
    } catch (err) {
      setError(typeof err === "string" ? err : "The fit did not run.");
    } finally {
      setFitting(false);
    }
  }

  async function openCsv() {
    setOpening(true);
    setError("");
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
            <SeriesPlot series={loaded()} />
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

export default App;
