---
name: verify-lab-bench
description: Drive the LabBench desk, the Tauri window and the SolidJS page it loads, to prove the empty desk, opening a four-column CSV, the uncertainty plot, and the fit controls. Use when changing that desk, the CSV load, the plot, or the fit buttons, and when a change needs a launched app rather than unit tests.
---

# Verify LabBench

LabBench is an offline desk for one physics series. The user opens the LabBench window, chooses Open CSV, and reads the points, both uncertainties, and the fit controls. Version 1 behavior is in `README.md`. The desk keeps the series in memory. There is no account, no data directory, and no saved fit.

The window loads `http://localhost:1420/` from `pnpm tauri dev`. Vite listens on IPv6 localhost only. `http://127.0.0.1:1420/` is connection refused. A browser tab at the dev URL is a second copy of the page. It does not share the window's series, and it has no Tauri bridge, so Open CSV and Fit degree do nothing useful there.

Two desks cannot run at once. Port 1420 is fixed. Do not drive a `lab-bench` process this run did not start.

## Launch

From the repo root:

```bash
.cursor/skills/verify-lab-bench/scripts/verify-lab-bench launch
```

The script unsets `CARGO_TARGET_DIR`, starts `pnpm tauri dev` in its own process group, and waits until all of these are true:

- The dev log contains cargo's `Running` line for `lab-bench`.
- That binary path is inside this checkout. A binary under the Cursor sandbox cargo cache is not this desk.
- The `lab-bench` process is alive.
- `http://localhost:1420/` returns the document titled `LabBench`.
- The process listening on port 1420 is a child of this launch.

Vite's own `ready` line is earlier and is not the desk. The script exits 0 and prints `ready` only after the window process and the document are both up. It then prints `url`, `session_pid`, `lab_bench_pid`, `binary`, and `vite_pid`.

The desk starts empty. There is no migration and no seed. Usable means the page shows the heading `LabBench`, the button `Open CSV`, and the text `No series.` Confirm that with the snapshot in Drive before any other action. A document title alone is not that check.

Samples stay in the repo: `samples/hookes-law.csv` (10 points) and `samples/capacitor-discharge.csv` (17 points). The launch does not copy them.

## Doctor

Run this first whenever a drive looks wrong, and before every drive:

```bash
.cursor/skills/verify-lab-bench/scripts/verify-lab-bench doctor
```

Doctor is read-only. It exits 0 only when this launch is still the process on port 1420, the binary is still the one under this checkout, `package.json` is version `0.1.0`, and the LabBench document answers on `http://localhost:1420/`. The last line is `status: worth driving`. Any other exit means stop. Do not click a desk doctor rejected.

Doctor does not prove the rendered empty state. The snapshot does.

## Drive

Read `features/README.md`, then the feature file. Start from the empty desk unless that file names other preconditions.

The page inside the window and a browser tab use the same dev URL and the same accessible names. Use the Cursor browser on `http://localhost:1420/` for the empty desk only. Use the LabBench window for Open CSV, the plot, and Fit degree. The window process name is `lab-bench`. Press the control whose accessible name is in the feature file. Do not drive by coordinates.

Window drive needs Accessibility for the `lab-bench` process. If that read is refused, report the feature blocked and name the refusal. Do not click the same control in the browser tab and count it as the window.

Stable names on the page:

- heading `LabBench`
- button `Open CSV` (label `Opening…` while a file dialog is open)
- text `No series.`
- alert text when a load or a fit fails
- region `Loaded series`
- group `Polynomial degree`
- buttons `Fit degree 1`, `Fit degree 2`, `Fit degree 3`
- image whose name is `<count> points of <y> against <x>, with uncertainties on both axes`

The native open panel title is `Open CSV`. It accepts one CSV file.

## Evidence

Write proof under `.cursor/skills/verify-lab-bench/artifacts/<feature-id>/`. Record the feature id and the entry point in a `notes.txt` beside the captures.

A proof shows the action and the resulting state. For the empty desk, save the accessibility snapshot as `desk.aria.txt` and a screenshot as `desk.png`. Both must show `LabBench`, `Open CSV`, and `No series.` The browser screenshot tool may store the PNG outside the repo and report that path as `Saved to`. Copy that file to `desk.png` before cleanup. For a loaded series, capture the region `Loaded series` after the open panel closes, including the point count and the column names. For a fit, capture the degree, each coefficient with its standard error, and R^2 on the desk. An enabled button and a missing alert are not that proof.

Do not call a test-only setter, a unit test, or a browser tab's failed Open CSV a desk proof. The safe path is the launched window. There is no dry-run mode.

## Cleanup

```bash
.cursor/skills/verify-lab-bench/scripts/verify-lab-bench cleanup
```

Cleanup sends a signal to the process group this launch recorded, then to the recorded `lab-bench` binary and the recorded port-1420 process if they are still the ones that were started. It does not search the machine for a process named `lab-bench`. It deletes `.cursor/skills/verify-lab-bench/run/` and leaves `.cursor/skills/verify-lab-bench/artifacts/` in place.

Run cleanup after a failed launch too, so the port is not left held.

## Helpers

The helper is `.cursor/skills/verify-lab-bench/scripts/verify-lab-bench`. Run it from the repo root:

```bash
.cursor/skills/verify-lab-bench/scripts/verify-lab-bench launch
.cursor/skills/verify-lab-bench/scripts/verify-lab-bench doctor
.cursor/skills/verify-lab-bench/scripts/verify-lab-bench cleanup
```

`launch` prints `ready` when the window process and the document are up. `doctor` prints `status: worth driving` when that instance is still the one to drive. `cleanup` prints `stopped` and the artifacts path.
