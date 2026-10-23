# LabBench verification map

This directory is the maintained source for verifying the user-facing behavior of LabBench. Read this index before driving the desk, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch the desk with `.cursor/skills/verify-lab-bench/scripts/verify-lab-bench launch` and require the line `ready`.
- Drive `http://localhost:1420/`. `http://127.0.0.1:1420/` is connection refused.
- The desk starts with no series. Samples are files in the repo, not rows already on the desk.
- Run `.cursor/skills/verify-lab-bench/scripts/verify-lab-bench doctor` and require `status: worth driving`, version `0.1.0`, and a binary inside this checkout.
- Never drive a `lab-bench` process that this launch did not start. A second launch cannot share port 1420.

## Driving conventions

- Start every recipe from the empty desk unless its preconditions say otherwise.
- Prefer the accessible names in the feature file over coordinates and tab order.
- Treat every command as literal. Keep quoted names and paths unchanged.
- Read the empty desk through the Cursor browser at `http://localhost:1420/`.
- Open a CSV, read the plot, and fit a degree in the LabBench window. A browser tab does not share the window's series and cannot open the file panel.
- Leave proof artifacts in place during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- Empty-desk proof includes an accessibility snapshot and a screenshot that show `LabBench`, `Open CSV`, and `No series.`
- A loaded series includes the point count and the four column names in the region `Loaded series`.
- A fit includes the degree, each coefficient with its standard error, and R^2 on the desk.
- Record the feature id and the entry point used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with the LabBench harness` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Empty desk](./empty-desk.md) covers the launched desk before any file is chosen.
- [Open a CSV](./open-csv.md) covers both samples, the column names and point counts, and a file that is not four columns.
- [Plot both uncertainties](./plot-uncertainties.md) covers the plotted points, both uncertainties, and the absence of a fitted curve.
- [Fit a polynomial](./fit-polynomial.md) covers degree 1, 2, and 3 and the numbers the desk must show for that fit.

Export PNG and Export Markdown are buttons shown after a fit. This map does not drive those buttons.
