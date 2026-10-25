# Fit a polynomial

Fit a polynomial takes the loaded series and shows a curve for degree 1, 2, or 3, with each coefficient's standard error and R^2.

## Sub-features

- `fit-line` shows a degree-1 fit of Hooke's law, including the slope and its standard error.
- `fit-curve` shows a degree-2 fit of the capacitor sample, including R^2.
- `fit-cubic` shows a degree-3 fit on the loaded series, with four coefficients.
- `fit-reject` leaves the shown fit unchanged when the series cannot be fit.

## How to get to it (user POV)

- Open a CSV, then choose `Fit degree 1`, `Fit degree 2`, or `Fit degree 3` in the group named `Polynomial degree`.

## Driving it with the LabBench harness

Preconditions:

- `.cursor/skills/verify-lab-bench/scripts/verify-lab-bench doctor` prints `status: worth driving`.
- The drive target is the `lab-bench` window.
- `/Users/andu/Documents/Coding/Projects/lab-bench/samples/hookes-law.csv` is loaded and the region `Loaded series` shows `10 points`.

- **Fit a line.** Press `Fit degree 1`. The desk shows degree 1, the constant and the slope, each with its standard error, and R^2. The slope is between 17.5 and 18.5. The plot image still names `force_N` against `extension_m`, its name adds `with a degree 1 fit`, and the plot shows the line.
- **Fit a curve.** Open `/Users/andu/Documents/Coding/Projects/lab-bench/samples/capacitor-discharge.csv`, then press `Fit degree 2`. The desk shows degree 2, each coefficient with its standard error, and R^2. The page has no time constant.
- **Fit a cubic.** With either sample still loaded, press `Fit degree 3`. The desk shows degree 3 and four coefficients, constant, x, x^2, and x^3, each with a standard error, and one R^2.
- **Reject a degree the series cannot support.** Open a four-column CSV that has four data rows. Press `Fit degree 1` and read degree 1. Press `Fit degree 3`. An alert reads `The series does not have enough points for that degree.` Degree 1, its slope, and R^2 stay on the desk.
- **Proof.** Save the Hooke's law degree-1 snapshot to `.cursor/skills/verify-lab-bench/artifacts/fit-polynomial/hooke.aria.txt` and a screenshot to `.cursor/skills/verify-lab-bench/artifacts/fit-polynomial/hooke.png`. Both show the degree, the slope, a standard error, and R^2. Write `.cursor/skills/verify-lab-bench/artifacts/fit-polynomial/notes.txt` with the feature id `fit-polynomial` and the entry point `Fit degree 1`.

## Gotchas

- A browser tab's Fit degree button is not this journey. That tab has no file dialog and does not run the fit.
- Opening another CSV clears the shown fit. Capture the Hooke's law proof before the capacitor open. Fit degree 1 again on the four-row file before requesting the degree it cannot support.
- Four data rows can still fit degree 2. The reject check is degree 3.
- Degree 4 is not a button. This journey does not invent a way to request it.
- The Hooke's law slope check is the on-screen number. A unit test of the slope is not the proof.
