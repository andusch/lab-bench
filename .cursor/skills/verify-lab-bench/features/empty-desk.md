# Empty desk

The empty desk is what LabBench shows at launch: the title, a way to open a CSV, and no series.

## Sub-features

- `empty-launch` shows the heading and the Open CSV control.
- `empty-clear` shows that no series, plot, or fit control is on the desk.

## How to get to it (user POV)

- Launch LabBench and look at the window before choosing a file.

## Driving it with the LabBench harness

Preconditions:

- `.cursor/skills/verify-lab-bench/scripts/verify-lab-bench doctor` prints `status: worth driving`.
- The page address is `http://localhost:1420/`.

- **Open the desk.** Open `http://localhost:1420/` in the Cursor browser and lock the tab. The document title is `LabBench`. The heading reads `LabBench`. A button named `Open CSV` is present. The text `No series.` is present.
- **Confirm the desk is empty.** Read the accessibility snapshot. There is no region named `Loaded series`, no group named `Polynomial degree`, no button named `Fit degree 1`, and no image whose name contains `points of`.
- **Proof.** Save the snapshot to `.cursor/skills/verify-lab-bench/artifacts/empty-desk/desk.aria.txt` and a screenshot to `.cursor/skills/verify-lab-bench/artifacts/empty-desk/desk.png`. Both show `LabBench`, `Open CSV`, and `No series.` Write `.cursor/skills/verify-lab-bench/artifacts/empty-desk/notes.txt` with the feature id `empty-desk` and the entry point `launch`.

## Gotchas

- `http://127.0.0.1:1420/` does not connect. Open `http://localhost:1420/`.
- Vite printing `ready` does not mean the LabBench window is up. Wait for the launch script to print `ready`.
- The browser tab is a second copy of the page. It proves the empty document. It does not prove a later Open CSV or fit.
- Clicking `Open CSV` in the browser tab does not open the file panel. Leave the button unclicked for this journey.
- A screenshot of the document title without `No series.` is not proof.
- The browser screenshot tool may write the PNG outside the repo. Copy the file it reports under `Saved to` onto `.cursor/skills/verify-lab-bench/artifacts/empty-desk/desk.png` before cleanup.
