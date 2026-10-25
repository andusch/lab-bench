# Sample sources

`hookes-law.csv` and `capacitor-discharge.csv` are generated for this repo. The README states the models, the noise, and random seed 7. The ten files below were added as ready four-column tables. The numbers were not rewritten here.

No Vernier sample library files are included.

## Open STEM Lab (synthetic)

Teaching models from Open STEM Lab reports, with classroom-scale noise. These rows are synthetic. They are not a claim of a physical run.

| File | Model | Report |
|---|---|---|
| `ohms-law.csv` | Ideal R = 100 Ω, plus ammeter and voltmeter noise. Uncertainties ±0.0001 A and ±0.02 V. | https://openstemlab.org/physics/ohms-law/report/ |
| `youngs-modulus.csv` | Y = 200 GPa, L = 2.000 m, d = 0.500 mm, plus micrometer noise. | https://openstemlab.org/physics/young-modulus/report/ |
| `mass-spring.csv` | k = 20 N/m, effective mass 20 g, with stopwatch-scale noise on T². | https://openstemlab.org/physics/loaded-spring/report/ |
| `newtons-cooling.csv` | T(t) = 20 + (80 − 20)·exp(−0.096 t), t in minutes, plus thermometer noise. | https://openstemlab.org/physics/newtons-cooling/report/ |
| `resistivity-temp.csv` | R = 100·(1 + 3.930×10⁻³ T) ohms, T in °C, plus bridge noise. | https://openstemlab.org/physics/temperature-resistance/report/ |

## Measured or published sample tables

`simple-pendulum.csv` uses the processed length and T² table, with the published uncertainties, from the Madeline Smith and Scarlett Gemmer IB Physics SL pendulum lab (2013). https://mrsmithsphysics.weebly.com/uploads/1/2/1/5/12150755/a_sample_7_lab_-_finding_g.pdf

`free-fall.csv` uses height and time pairs from the 3B Scientific UE103030 free-fall sheet, rewritten as height against t². Height uncertainty is an assumed ±0.002 m. Time uncertainty is an assumed ±0.001 s, propagated into u(t²). https://www.3bscientific.com/medialibrary/experiments/en/UE103030_E.pdf

`boyles-law.csv` uses University of Waterloo Chem 13 News nitrogen syringe data from John Eix, plotted as total pressure against 1/V with the source uncertainties. The source's anomalous last point was dropped. https://uwaterloo.ca/centre-advanced-science-education/news/different-way-do-gas-laws-part-1-pressure-volume

`snells-law.csv` uses the Mini Physics illustrative glass-block angle table (constructed example readings, whole degrees). An uncertainty of ±1° was propagated into each sine. https://www.miniphysics.com/secondary/g3-science/physics/practical-requirements/refraction-investigation

## Synthetic, method only

`faraday-induction.csv` is a generative model, peak emf = 0.32 V·s/m times the speed from drop heights 10–45 cm. Speed uncertainty comes from a drop-height uncertainty of ±0.005 m. The method follows magnet-through-coil labs such as the Data Harvest velocity-versus-induced-voltage sheet. The numbers are not taken from that sheet. https://d4iqe7beda780.cloudfront.net/resources/static/main/pdf/dath1131_6_velocity_vs_induced_voltage.pdf
