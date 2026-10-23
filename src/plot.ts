import type { Fit, Series } from "./series";

export const PLOT_WIDTH = 760;
export const PLOT_HEIGHT = 500;

const PAD = { left: 76, right: 24, top: 20, bottom: 56 };
const CAP = 5;

export type PlotPoint = {
  x: number;
  y: number;
  cx: number;
  cy: number;
  dx: number;
  dy: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  cap: number;
};

export type PlotTick = {
  value: number;
  x: number;
  y: number;
  label: string;
};

export type Plot = {
  width: number;
  height: number;
  pad: { left: number; right: number; top: number; bottom: number };
  xLabel: string;
  yLabel: string;
  xTicks: PlotTick[];
  yTicks: PlotTick[];
  points: PlotPoint[];
  curve: string | null;
  axis: { left: number; right: number; top: number; bottom: number };
};

export function plotSeries(series: Series, fit?: Fit | null): Plot {
  const xDomain = paddedDomain(
    series.points.map((point) => point.x),
    series.points.map((point) => point.dx),
  );
  const curveSamples = fit ? samplePolynomial(fit.coefficients, series.points.map((point) => point.x)) : [];
  const yDomain = paddedDomain(
    series.points.map((point) => point.y).concat(curveSamples.map((sample) => sample.y)),
    series.points.map((point) => point.dy).concat(curveSamples.map(() => 0)),
  );
  const plotWidth = PLOT_WIDTH - PAD.left - PAD.right;
  const plotHeight = PLOT_HEIGHT - PAD.top - PAD.bottom;
  const xScale = (value: number) =>
    PAD.left + ((value - xDomain.min) / (xDomain.max - xDomain.min)) * plotWidth;
  const yScale = (value: number) =>
    PAD.top + (1 - (value - yDomain.min) / (yDomain.max - yDomain.min)) * plotHeight;
  const axis = {
    left: PAD.left,
    right: PLOT_WIDTH - PAD.right,
    top: PAD.top,
    bottom: PLOT_HEIGHT - PAD.bottom,
  };

  return {
    width: PLOT_WIDTH,
    height: PLOT_HEIGHT,
    pad: PAD,
    xLabel: series.x_name,
    yLabel: series.y_name,
    xTicks: ticks(xDomain.min, xDomain.max).map((value) => ({
      value,
      x: xScale(value),
      y: axis.bottom,
      label: formatTick(value),
    })),
    yTicks: ticks(yDomain.min, yDomain.max).map((value) => ({
      value,
      x: axis.left,
      y: yScale(value),
      label: formatTick(value),
    })),
    points: series.points.map((point) => ({
      x: point.x,
      y: point.y,
      cx: xScale(point.x),
      cy: yScale(point.y),
      dx: point.dx,
      dy: point.dy,
      x1: xScale(point.x - point.dx),
      x2: xScale(point.x + point.dx),
      y1: yScale(point.y - point.dy),
      y2: yScale(point.y + point.dy),
      cap: CAP,
    })),
    curve:
      curveSamples.length < 2
        ? null
        : curveSamples
            .map((sample, index) => {
              const command = index === 0 ? "M" : "L";
              return `${command}${xScale(sample.x).toFixed(2)} ${yScale(sample.y).toFixed(2)}`;
            })
            .join(" "),
    axis,
  };
}

function samplePolynomial(coefficients: number[], xs: number[]): { x: number; y: number }[] {
  if (coefficients.length === 0 || xs.length === 0) {
    return [];
  }
  let xMin = Infinity;
  let xMax = -Infinity;
  for (const x of xs) {
    if (!Number.isFinite(x)) {
      continue;
    }
    xMin = Math.min(xMin, x);
    xMax = Math.max(xMax, x);
  }
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) {
    return [];
  }
  const samples = 64;
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index < samples; index++) {
    const x = xMin + ((xMax - xMin) * index) / (samples - 1);
    const y = evaluate(coefficients, x);
    if (Number.isFinite(y)) {
      points.push({ x, y });
    }
  }
  return points;
}

function evaluate(coefficients: number[], x: number): number {
  return coefficients.reduceRight((value, coefficient) => value * x + coefficient, 0);
}

function paddedDomain(values: number[], errors: number[]): { min: number; max: number } {
  if (values.length === 0) {
    return { min: 0, max: 1 };
  }
  let min = Infinity;
  let max = -Infinity;
  for (let index = 0; index < values.length; index++) {
    min = Math.min(min, values[index] - errors[index]);
    max = Math.max(max, values[index] + errors[index]);
  }
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}

function ticks(min: number, max: number): number[] {
  const step = niceStep((max - min) / 5);
  const start = Math.ceil(min / step - 1e-9) * step;
  const values: number[] = [];
  for (let index = 0; index < 8; index++) {
    const value = start + index * step;
    if (value > max + step * 1e-6) {
      break;
    }
    if (value >= min - step * 1e-6) {
      values.push(roundTick(value, step));
    }
  }
  return values;
}

function niceStep(rough: number): number {
  if (!Number.isFinite(rough) || rough <= 0) {
    return 1;
  }
  const power = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

function roundTick(value: number, step: number): number {
  const digits = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  return Number(value.toFixed(digits));
}

function formatTick(value: number): string {
  if (value === 0) {
    return "0";
  }
  const absolute = Math.abs(value);
  if (absolute >= 1000 || absolute < 0.001) {
    return value.toExponential(1);
  }
  return String(Number(value.toPrecision(6)));
}
