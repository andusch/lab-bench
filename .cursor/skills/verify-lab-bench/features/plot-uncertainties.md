# Plot both uncertainties

After a CSV loads, the desk draws every point with the uncertainty on each axis. The plot does not draw a fitted curve.

## Sub-features

- `plot-hooke` draws the 10 Hooke's law points and both uncertainties.
- `plot-capacitor` draws the 17 capacitor points and both uncertainties.
- `plot-no-curve` keeps a coefficient, a degree, and R^2 off the plot.

## How to get to it (user POV)

- Choose `Open CSV` and open a sample. The plot is in the loaded series, under the fit buttons. There is no separate plot command.

## Driving it with the LabBench harness

Preconditions:

- `.cursor/skills/verify-lab-bench/scripts/verify-lab-bench doctor` prints `status: worth driving`.
- The drive target is the `lab-bench` window.
- `/Users/andu/Documents/Coding/Projects/lab-bench/samples/hookes-law.csv` and `/Users/andu/Documents/Coding/Projects/lab-bench/samples/capacitor-discharge.csv` exist.

- **Plot Hooke's law.** Press `Open CSV` and choose `/Users/andu/Documents/Coding/Projects/lab-bench/samples/hookes-law.csv`. The region `Loaded series` contains an image named `10 points of force_N against extension_m, with uncertainties on both axes`. The first table row shows `0.02`, `0.001`, `0.355`, and `0.05`.
- **Plot the capacitor sample.** Press `Open CSV` and choose `/Users/andu/Documents/Coding/Projects/lab-bench/samples/capacitor-discharge.csv`. The image is named `17 points of voltage_V against time_s, with uncertainties on both axes`.
- **Confirm there is no curve.** On either plot, the image name does not mention a fit, and the desk does not show a coefficient or R^2.
- **Proof.** Save the Hooke's law snapshot to `.cursor/skills/verify-lab-bench/artifacts/plot-uncertainties/hooke.aria.txt` and a screenshot to `.cursor/skills/verify-lab-bench/artifacts/plot-uncertainties/hooke.png`. Both show the image name for `force_N` against `extension_m`. The snapshot or a scrolled view of the same series also shows the first table row `0.02`, `0.001`, `0.355`, `0.05`. Write `.cursor/skills/verify-lab-bench/artifacts/plot-uncertainties/notes.txt` with the feature id `plot-uncertainties` and the entry point `Open CSV`.

## Gotchas

- The plot is not on the empty desk. Opening the sample is part of the journey.
- A browser tab does not show a series opened in the window.
- The words `with uncertainties on both axes` are the image name. The first table row is the check that a real uncertainty is attached to a point. Either one alone is incomplete.
- The window accessibility tree does not expose the plot's per-point title as its own node. The first table row carries the same numbers: `0.02`, `0.001`, `0.355`, `0.05`.
- The column names and the table sit below the plot. Scroll `Loaded series` before reading them.
- Fit degree buttons sit above the plot. Their presence is not a curve. This journey does not press them.
- Point text uses a short decimal form. Compare `0.02` and `0.001`, not the raw CSV token `0.020`.
