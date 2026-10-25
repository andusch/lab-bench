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

`samples/ohms-law.csv` is voltage against current. The noiseless line is an Open STEM synthetic resistor of 100 ohms, plus ammeter and voltmeter noise. The current uncertainty is 0.0001 A. The voltage uncertainty is 0.02 V. A degree-1 fit should give a slope near 100 ohms.

`samples/simple-pendulum.csv` is period squared against length. The rows are measured values from a Smith IB Physics pendulum lab, with that lab's published uncertainties. The length uncertainty is 0.001 m. The period-squared uncertainty changes from row to row. A degree-1 slope is near `4*pi^2/g`, and the intercept is near zero.

`samples/free-fall.csv` is height against time squared. The pairs are a 3B Scientific free-fall sample, rewritten so the independent column is t squared. The height uncertainty is 0.002 m. A time uncertainty of 0.001 s was propagated into the time-squared uncertainty. A degree-1 slope is near `g/2`.

`samples/boyles-law.csv` is pressure against inverse volume. The rows are measured University of Waterloo nitrogen syringe data, with that source's uncertainties. The last anomalous point from the source table was left out. A degree-1 fit is the Boyle line. Pressure times volume stays near 6.4 L kPa.

`samples/snells-law.csv` is the sine of the angle of incidence against the sine of the angle of refraction. The angles are an illustrative Mini Physics glass-block table. Each angle is a whole degree, and an uncertainty of 1 degree was propagated into the sine. The scatter is that rounding. A degree-1 slope is near a refractive index of 1.50.

`samples/youngs-modulus.csv` is extension against force. The noiseless extension is an Open STEM synthetic wire, Young's modulus 200 GPa, length 2.000 m, diameter 0.500 mm, plus micrometer noise. The force uncertainty is 0.05 N. The extension uncertainty is 0.000001 m. The points stay in the linear elastic region. A degree-1 slope is `L/(A*Y)`.

`samples/mass-spring.csv` is period squared against mass. The noiseless period is an Open STEM synthetic loaded spring, spring constant 20 N/m and effective mass 20 g, with stopwatch-scale noise on T squared. The mass uncertainty is 0.0005 kg. The period-squared uncertainty grows with the period. A degree-1 slope is `4*pi^2/k`. The intercept encodes that effective mass. The static Hooke sample is force against extension and has an intercept near zero.

`samples/newtons-cooling.csv` is temperature against time. The noiseless temperature is an Open STEM synthetic Newton cooling curve: room temperature 20 degrees C, initial temperature 80 degrees C, rate constant 0.096 per minute, plus thermometer noise. The time uncertainty is 0.05 min. The temperature uncertainty is 0.1 degrees C. The curve is exponential. Version 1 only fits a polynomial, so degree 1 is a poor model and degrees 2 and 3 follow this window more closely.

`samples/resistivity-temp.csv` is resistance against temperature. The noiseless resistance is an Open STEM synthetic copper line, `100*(1 + 0.003930*T)` ohms with T in degrees C, plus bridge noise. The temperature uncertainty is 0.2 degrees C. The resistance uncertainty is 0.05 ohm. From 0 degrees C to 100 degrees C the relation is essentially linear. A degree-1 slope divided by the intercept is the temperature coefficient.

`samples/faraday-induction.csv` is peak induced emf against speed. The noiseless emf is 0.32 V s/m times the speed from drop heights of 10 cm to 45 cm. The numbers are a synthetic model. The method follows magnet-through-coil labs. The speed uncertainty comes from a height uncertainty of 0.005 m. The emf uncertainty is 0.01 V. A degree-1 fit is close to a straight line with a small intercept.

Attributions and links for the ten files above are in `samples/SOURCES.md`.
