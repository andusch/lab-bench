# LabBench

LabBench is a free offline desk app for school and olympiad physics labs. You open a CSV, plot the points, fit a line or a polynomial with uncertainties, and export a PNG and a Markdown file. It replaces paid Vernier and PASCO analysis tools for tables you already exported.

Status: P0 is done. P1 is done. P2 is next.

## What version 1 does

- Version 1 reads one CSV of measured points.
- Version 1 plots those points with both uncertainties.
- Version 1 fits a line or a polynomial and reports an uncertainty on each coefficient.
- Version 1 writes a PNG of the plot and a Markdown file.

The CSV has four columns in this order. The first column is the independent value. The second column is the uncertainty on that value. The third column is the dependent value. The fourth column is the uncertainty on that value. Names in the header carry the quantity and the unit.

The fit is weighted least squares. The weight of a point is the inverse square of the dependent uncertainty. The independent uncertainty is stored and plotted. It does not enter the weight.

You choose polynomial degree 1, 2, or 3. Degree 1 is the straight line. A polynomial stays in version 1 because the model is linear in its coefficients.

The reported uncertainty on a coefficient is the standard error from that fit. The Markdown file lists the degree, each coefficient with that uncertainty, and R^2.

## What version 1 does not do

- Nonlinear least squares, including Levenberg-Marquardt and named curves such as an exponential.
- Typst and PDF. The prose export is Markdown.
- A live serial stream.
- Packaged installers.
- A Show HN post, and any other launch announcement.

You can plot `samples/capacitor-discharge.csv` and fit a polynomial through it. Version 1 does not return a time constant.

## Stack

The stack is Tauri, Rust, and SolidJS.

## License

The license is MIT. The terms are in `LICENSE`.

## Sample tables

`samples/hookes-law.csv` is force against extension. Force equals 18 newtons per meter times extension, plus Gaussian noise with standard deviation 0.02 N. The extension uncertainty is 0.001 m. The force uncertainty is 0.05 N.

`samples/capacitor-discharge.csv` is voltage against time. The noiseless voltage is `4.80*exp(-t/3.2)` volts, with time in seconds. The voltage values include Gaussian noise with standard deviation 0.015 V. The time uncertainty is 0.05 s. The voltage uncertainty is 0.03 V.

The Hooke's law noise is the first draw from random seed 7. The capacitor noise is the second draw.
