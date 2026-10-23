import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { plotSeries } from "./plot";
import SeriesPlot from "./SeriesPlot";
import type { Series } from "./series";

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

describe("series plot", () => {
  it("draws every Hooke's law point with both uncertainties and no curve", () => {
    assertSamplePlots("hookes-law.csv");
  });

  it("draws every capacitor point with both uncertainties and no curve", () => {
    assertSamplePlots("capacitor-discharge.csv");
  });
});
