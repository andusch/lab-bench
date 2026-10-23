import { createMemo, For, Show } from "solid-js";
import { plotSeries } from "./plot";
import type { Fit, Series } from "./series";

export default function SeriesPlot(props: { series: Series; fit?: Fit | null }) {
  const plot = createMemo(() => plotSeries(props.series, props.fit));
  const label = () => {
    const base = `${props.series.points.length} points of ${props.series.y_name} against ${props.series.x_name}, with uncertainties on both axes`;
    return props.fit ? `${base}, with a degree ${props.fit.degree} fit` : base;
  };

  return (
    <svg
      class="plot"
      viewBox={`0 0 ${plot().width} ${plot().height}`}
      role="img"
      aria-label={label()}
    >
      <line
        x1={plot().axis.left}
        y1={plot().axis.top}
        x2={plot().axis.left}
        y2={plot().axis.bottom}
        stroke="#8b909a"
        stroke-width="1"
      />
      <line
        x1={plot().axis.left}
        y1={plot().axis.bottom}
        x2={plot().axis.right}
        y2={plot().axis.bottom}
        stroke="#8b909a"
        stroke-width="1"
      />
      <For each={plot().xTicks}>
        {(tick) => (
          <>
            <line
              x1={tick.x}
              y1={plot().axis.bottom}
              x2={tick.x}
              y2={plot().axis.bottom + 6}
              stroke="#8b909a"
              stroke-width="1"
            />
            <text x={tick.x} y={plot().axis.bottom + 22} text-anchor="middle" fill="#3c4149" font-size="13">
              {tick.label}
            </text>
          </>
        )}
      </For>
      <For each={plot().yTicks}>
        {(tick) => (
          <>
            <line
              x1={plot().axis.left - 6}
              y1={tick.y}
              x2={plot().axis.left}
              y2={tick.y}
              stroke="#8b909a"
              stroke-width="1"
            />
            <text
              x={plot().axis.left - 10}
              y={tick.y}
              text-anchor="end"
              dominant-baseline="middle"
              fill="#3c4149"
              font-size="13"
            >
              {tick.label}
            </text>
          </>
        )}
      </For>
      <text
        x={plot().axis.left + (plot().axis.right - plot().axis.left) / 2}
        y={plot().height - 14}
        text-anchor="middle"
        fill="#1b1e23"
        font-size="14"
      >
        {plot().xLabel}
      </text>
      <text
        text-anchor="middle"
        fill="#1b1e23"
        font-size="14"
        transform={`translate(18 ${plot().axis.top + (plot().axis.bottom - plot().axis.top) / 2}) rotate(-90)`}
      >
        {plot().yLabel}
      </text>
      <Show when={plot().curve}>
        {(curve) => (
          <path data-fit d={curve()} fill="none" stroke="#9a3412" stroke-width="2" />
        )}
      </Show>
      <For each={plot().points}>
        {(point) => (
          <g>
            <line
              data-uncertainty="x"
              data-value={point.dx}
              x1={point.x1}
              x2={point.x2}
              y1={point.cy}
              y2={point.cy}
              stroke="#24557a"
              stroke-width="1.5"
            />
            <line
              x1={point.x1}
              x2={point.x1}
              y1={point.cy - point.cap}
              y2={point.cy + point.cap}
              stroke="#24557a"
              stroke-width="1.5"
            />
            <line
              x1={point.x2}
              x2={point.x2}
              y1={point.cy - point.cap}
              y2={point.cy + point.cap}
              stroke="#24557a"
              stroke-width="1.5"
            />
            <line
              data-uncertainty="y"
              data-value={point.dy}
              x1={point.cx}
              x2={point.cx}
              y1={point.y1}
              y2={point.y2}
              stroke="#24557a"
              stroke-width="1.5"
            />
            <line
              x1={point.cx - point.cap}
              x2={point.cx + point.cap}
              y1={point.y1}
              y2={point.y1}
              stroke="#24557a"
              stroke-width="1.5"
            />
            <line
              x1={point.cx - point.cap}
              x2={point.cx + point.cap}
              y1={point.y2}
              y2={point.y2}
              stroke="#24557a"
              stroke-width="1.5"
            />
            <circle data-point cx={point.cx} cy={point.cy} r="4" fill="#1b1e23">
              <title>
                {props.series.x_name}: {formatValue(point.x)} ± {formatValue(point.dx)};{" "}
                {props.series.y_name}: {formatValue(point.y)} ± {formatValue(point.dy)}
              </title>
            </circle>
          </g>
        )}
      </For>
    </svg>
  );
}

function formatValue(value: number): string {
  return String(Number(value.toPrecision(6)));
}
