import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { plotSeries } from "./plot";
import SeriesPlot from "./SeriesPlot";
import type { Fit, Series } from "./series";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function seriesFromSample(name: string): Series {
  const text = readFileSync(resolve(root, "samples", name), "utf8").trim();
  const [header, ...rows] = text.split(/\r?\n/);
  const [x_name, dx_name, y_name, dy_name] = header.split(",");
  return {
    x_name,
    dx_name,
    y_name,
    dy_name,
    points: rows.map((row) => {
      const [x, dx, y, dy] = row.split(",").map(Number);
      return { x, dx, y, dy };
    }),
  };
}

function renderPlot(series: Series): SVGSVGElement {
  const screen = render(() => <SeriesPlot series={series} />);
  const svg = screen.container.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    throw new Error("The plot did not render an SVG.");
  }
  return svg;
}

function assertSamplePlots(name: string) {
  const series = seriesFromSample(name);
  const geometry = plotSeries(series);
  const svg = renderPlot(series);

  expect(svg.querySelector("path, polyline")).toBeNull();
  expect(svg.querySelector("[data-fit]")).toBeNull();

  const points = svg.querySelectorAll("[data-point]");
  const xBars = svg.querySelectorAll('[data-uncertainty="x"]');
  const yBars = svg.querySelectorAll('[data-uncertainty="y"]');
  expect(points).toHaveLength(series.points.length);
  expect(xBars).toHaveLength(series.points.length);
  expect(yBars).toHaveLength(series.points.length);
  expect(geometry.points).toHaveLength(series.points.length);

  series.points.forEach((point, index) => {
    const xBar = xBars[index];
    const yBar = yBars[index];
    expect(Number(xBar.getAttribute("data-value"))).toBe(point.dx);
    expect(Number(yBar.getAttribute("data-value"))).toBe(point.dy);
    const xSpan = Number(xBar.getAttribute("x2")) - Number(xBar.getAttribute("x1"));
    const ySpan = Math.abs(Number(yBar.getAttribute("y2")) - Number(yBar.getAttribute("y1")));
    expect(xSpan).toBeGreaterThan(2);
    expect(ySpan).toBeGreaterThan(2);
    expect(xSpan).toBeCloseTo(geometry.points[index].x2 - geometry.points[index].x1, 5);
    expect(ySpan).toBeCloseTo(Math.abs(geometry.points[index].y2 - geometry.points[index].y1), 5);
  });
}

function lineFit(): Fit {
  return {
    degree: 1,
    coefficients: [0.0123, 18.1003],
    standard_errors: [0.02, 0.15],
    r_squared: 0.998,
  };
}

function quadraticFit(): Fit {
  return {
    degree: 2,
    coefficients: [4.8, -1.2, 0.08],
    standard_errors: [0.02, 0.01, 0.005],
    r_squared: 0.997,
  };
}

function pathPoints(d: string): { x: number; y: number }[] {
  return [...d.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
  }));
}

function offTheChord(points: { x: number; y: number }[]): number {
  const start = points[0];
  const end = points[points.length - 1];
  const mid = points[Math.floor(points.length / 2)];
  const span = end.x - start.x;
  const expected = start.y + ((mid.x - start.x) / span) * (end.y - start.y);
  return Math.abs(mid.y - expected);
}

describe("series plot", () => {
  it("draws every Hooke's law point with both uncertainties and no curve", () => {
    assertSamplePlots("hookes-law.csv");
  });

  it("draws every capacitor point with both uncertainties and no curve", () => {
    assertSamplePlots("capacitor-discharge.csv");
  });

  it("draws a degree-1 line across the Hooke's law points", () => {
    const series = seriesFromSample("hookes-law.csv");
    const fit = lineFit();
    const geometry = plotSeries(series, fit);
    const screen = render(() => <SeriesPlot series={series} fit={fit} />);
    const svg = screen.container.querySelector("svg");
    const path = screen.container.querySelector("[data-fit]");

    expect(svg?.getAttribute("aria-label")).toContain("force_N against extension_m");
    expect(svg?.getAttribute("aria-label")).toContain("degree 1");
    expect(path?.tagName.toLowerCase()).toBe("path");
    expect(path?.getAttribute("d")).toBe(geometry.curve);

    const drawn = pathPoints(geometry.curve ?? "");
    expect(drawn.length).toBeGreaterThan(2);
    expect(offTheChord(drawn)).toBeLessThan(1);
    expect(drawn[0].x).toBeLessThan(drawn[drawn.length - 1].x);
    const markup = new XMLSerializer().serializeToString(svg);
    expect(markup.match(/data-point/g)).toHaveLength(series.points.length);
    expect(markup.match(/data-uncertainty="x"/g)).toHaveLength(series.points.length);
    expect(markup.match(/data-uncertainty="y"/g)).toHaveLength(series.points.length);
    expect(markup).toContain('data-fit=""');
    expect(markup).toContain('data-point=""');
  });

  it("draws a degree-2 curve through the capacitor points", () => {
    const series = seriesFromSample("capacitor-discharge.csv");
    const fit = quadraticFit();
    const geometry = plotSeries(series, fit);
    const screen = render(() => <SeriesPlot series={series} fit={fit} />);
    const path = screen.container.querySelector("[data-fit]");

    expect(screen.container.querySelector("svg")?.getAttribute("aria-label")).toContain("degree 2");
    expect(path?.getAttribute("d")).toBe(geometry.curve);
    expect(offTheChord(pathPoints(geometry.curve ?? ""))).toBeGreaterThan(8);
    const markup = new XMLSerializer().serializeToString(screen.container.querySelector("svg")!);
    expect(markup.match(/data-point/g)).toHaveLength(17);
    expect(markup.match(/data-uncertainty="x"/g)).toHaveLength(17);
    expect(markup.match(/data-uncertainty="y"/g)).toHaveLength(17);
    expect(markup).toContain('data-fit=""');
    expect(markup).toContain('data-point=""');
  });
});
