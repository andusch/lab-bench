# Open a CSV

Open a CSV loads one four-column table into the desk and shows its point count, column names, and rows. A file that is not four columns does not become the series.

## Sub-features

- `open-hooke` loads `samples/hookes-law.csv` as 10 points with that file's header names.
- `open-capacitor` loads `samples/capacitor-discharge.csv` as 17 points with that file's header names.
- `open-reject` leaves the desk without a series from a three-column file.
- `open-cancel` leaves the desk unchanged when the file panel is dismissed.

## How to get to it (user POV)

- Choose the `Open CSV` button in the LabBench window.

## Driving it with the LabBench harness

Preconditions:

- `.cursor/skills/verify-lab-bench/scripts/verify-lab-bench doctor` prints `status: worth driving`.
- The empty desk is showing `No series.`
- These files exist: `/Users/andu/Documents/Coding/Projects/lab-bench/samples/hookes-law.csv` and `/Users/andu/Documents/Coding/Projects/lab-bench/samples/capacitor-discharge.csv`.
- The drive target is the `lab-bench` window, pid `lab_bench_pid` from doctor.

- **Open Hooke's law.** Press the button named `Open CSV`. In the panel titled `Open CSV`, choose `/Users/andu/Documents/Coding/Projects/lab-bench/samples/hookes-law.csv`. The region `Loaded series` shows `10 points`. The names `extension_m`, `extension_unc_m`, `force_N`, and `force_unc_N` are on the desk, and the table uses those headers. The text `No series.` is gone.
- **Replace with the capacitor sample.** Press `Open CSV` again and choose `/Users/andu/Documents/Coding/Projects/lab-bench/samples/capacitor-discharge.csv`. The region shows `17 points` and the names `time_s`, `time_unc_s`, `voltage_V`, and `voltage_unc_V`. The Hooke's law names are gone.
- **Reject three columns.** From the empty desk, press `Open CSV` and choose a CSV whose header is `a,b,c` and whose only data row is `1,2,3`. An alert reads `The file has 3 columns. A series needs four: x, dx, y, and dy.` The text `No series.` remains.
- **Dismiss the panel.** From the empty desk, press `Open CSV` and dismiss the panel without choosing a file. The text `No series.` remains and no alert appears.
- **Proof.** After the Hooke's law open, save the accessibility snapshot of `Loaded series` to `.cursor/skills/verify-lab-bench/artifacts/open-csv/hooke.aria.txt` and a screenshot to `.cursor/skills/verify-lab-bench/artifacts/open-csv/hooke.png`. Both show `10 points` and `extension_m`. Write `.cursor/skills/verify-lab-bench/artifacts/open-csv/notes.txt` with the feature id `open-csv` and the entry point `Open CSV`.

## Gotchas

- The Cursor browser at `http://localhost:1420/` cannot open this panel. A click there is not this journey.
- If the window's accessibility tree cannot be read, stop and report that refusal. Do not mark the journey verified from the browser tab.
- Opening the capacitor sample replaces the Hooke's law series. Capture the Hooke's law proof before the second open.
- A failed open does not clear a series that is already on the desk. Run `open-reject` and `open-cancel` from `No series.`, not after a successful open.
- The button reads `Opening…` while the panel is open. The series is visible only after the panel closes.
