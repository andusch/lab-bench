import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Fit, Series } from "./series";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

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

const hookeFit: Fit = {
  degree: 1,
  coefficients: [0.0123, 18.1003],
  standard_errors: [0.02, 0.15],
  r_squared: 0.998765,
};

const capacitorFit: Fit = {
  degree: 2,
  coefficients: [4.8, -1.2, 0.08],
  standard_errors: [0.02, 0.01, 0.005],
  r_squared: 0.997,
};

function bridge() {
  Object.defineProperty(window, "__TAURI_INTERNALS__", {
    value: {},
    configurable: true,
  });
}

describe("fit on the desk", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    bridge();
    vi.mocked(invoke).mockReset();
    vi.mocked(open).mockReset();
    vi.mocked(save).mockReset();
  });

  it("shows the Hooke's law line, slope, standard error, and R^2", async () => {
    vi.mocked(open).mockResolvedValue("/samples/hookes-law.csv");
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === "open_csv") {
        return seriesFromSample("hookes-law.csv");
      }
      if (command === "fit_series") {
        return hookeFit;
      }
      throw new Error(command);
    });

    const screen = render(() => <App />);
    fireEvent.click(screen.getByRole("button", { name: "Open CSV" }));
    expect(await screen.findByText("10 points")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Fit degree 1" }));

    expect(await screen.findByText("Degree 1")).toBeTruthy();
    expect(screen.getByText("slope").nextElementSibling?.textContent).toBe(
      "18.1003, standard error 0.15",
    );
    expect(screen.getByText("R^2").nextElementSibling?.textContent).toBe("0.998765");
    expect(screen.container.querySelector("[data-fit]")?.tagName.toLowerCase()).toBe("path");
    expect(screen.container.textContent).not.toContain("time constant");
    expect(vi.mocked(invoke).mock.calls.map((call) => call[0])).toEqual(["open_csv", "fit_series"]);
  });

  it("shows a degree-2 capacitor curve and R^2", async () => {
    vi.mocked(open).mockResolvedValue("/samples/capacitor-discharge.csv");
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === "open_csv") {
        return seriesFromSample("capacitor-discharge.csv");
      }
      if (command === "fit_series") {
        return capacitorFit;
      }
      throw new Error(command);
    });

    const screen = render(() => <App />);
    fireEvent.click(screen.getByRole("button", { name: "Open CSV" }));
    expect(await screen.findByText("17 points")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fit degree 2" }));

    expect(await screen.findByText("Degree 2")).toBeTruthy();
    expect(screen.getByText("x^2").nextElementSibling?.textContent).toContain("standard error 0.005");
    expect(screen.getByText("R^2").nextElementSibling?.textContent).toBe("0.997");
    expect(screen.container.querySelector("[data-fit]")?.tagName.toLowerCase()).toBe("path");
    expect(screen.container.textContent).not.toContain("time constant");
  });

  it("keeps the shown fit when a later fit fails", async () => {
    vi.mocked(open).mockResolvedValue("/samples/hookes-law.csv");
    vi.mocked(invoke).mockImplementation(async (command, args) => {
      if (command === "open_csv") {
        return seriesFromSample("hookes-law.csv");
      }
      if (command === "fit_series" && (args as { degree: number }).degree === 1) {
        return hookeFit;
      }
      throw "The points do not determine that polynomial.";
    });

    const screen = render(() => <App />);
    fireEvent.click(screen.getByRole("button", { name: "Open CSV" }));
    await screen.findByText("10 points");
    fireEvent.click(screen.getByRole("button", { name: "Fit degree 1" }));
    await screen.findByText("Degree 1");

    fireEvent.click(screen.getByRole("button", { name: "Fit degree 3" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("The points do not determine that polynomial.");
    expect(screen.getByText("Degree 1")).toBeTruthy();
    expect(screen.getByText("slope").nextElementSibling?.textContent).toContain("18.1003");
  });

  it("sends the Hooke's law plot to the PNG export", async () => {
    vi.mocked(open).mockResolvedValue("/samples/hookes-law.csv");
    vi.mocked(save).mockResolvedValue("/tmp/hookes-law.png");
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === "open_csv") {
        return seriesFromSample("hookes-law.csv");
      }
      if (command === "fit_series") {
        return hookeFit;
      }
      if (command === "export_png") {
        return null;
      }
      throw new Error(command);
    });

    const screen = render(() => <App />);
    fireEvent.click(screen.getByRole("button", { name: "Open CSV" }));
    await screen.findByText("10 points");
    expect(screen.queryByRole("button", { name: "Export PNG" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Fit degree 1" }));
    fireEvent.click(await screen.findByRole("button", { name: "Export PNG" }));

    await vi.waitFor(() => expect(vi.mocked(save)).toHaveBeenCalled());
    const call = vi.mocked(invoke).mock.calls.find(([command]) => command === "export_png");
    const args = call?.[1] as { path: string; svg: string };
    expect(args.path).toBe("/tmp/hookes-law.png");
    expect(args.svg.match(/data-point/g)).toHaveLength(10);
    expect(args.svg.match(/data-uncertainty="x"/g)).toHaveLength(10);
    expect(args.svg.match(/data-uncertainty="y"/g)).toHaveLength(10);
    expect(args.svg).toContain('data-fit=""');
    expect(args.svg).not.toContain("time constant");
  });

  it("sends the capacitor curve to the PNG export", async () => {
    vi.mocked(open).mockResolvedValue("/samples/capacitor-discharge.csv");
    vi.mocked(save).mockResolvedValue("/tmp/capacitor.png");
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === "open_csv") {
        return seriesFromSample("capacitor-discharge.csv");
      }
      if (command === "fit_series") {
        return capacitorFit;
      }
      if (command === "export_png") {
        return null;
      }
      throw new Error(command);
    });

    const screen = render(() => <App />);
    fireEvent.click(screen.getByRole("button", { name: "Open CSV" }));
    await screen.findByText("17 points");
    fireEvent.click(screen.getByRole("button", { name: "Fit degree 2" }));
    fireEvent.click(await screen.findByRole("button", { name: "Export PNG" }));

    await vi.waitFor(() => expect(vi.mocked(save)).toHaveBeenCalled());
    const call = vi.mocked(invoke).mock.calls.find(([command]) => command === "export_png");
    const args = call?.[1] as { path: string; svg: string };
    expect(args.svg.match(/data-point/g)).toHaveLength(17);
    expect(args.svg).toContain('data-fit=""');
    expect(args.svg).not.toContain("time constant");
  });

  it("asks for a Markdown file of the Hooke's law fit", async () => {
    vi.mocked(open).mockResolvedValue("/samples/hookes-law.csv");
    vi.mocked(save).mockResolvedValue("/tmp/hookes-law.md");
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === "open_csv") {
        return seriesFromSample("hookes-law.csv");
      }
      if (command === "fit_series") {
        return hookeFit;
      }
      if (command === "export_markdown") {
        return null;
      }
      throw new Error(command);
    });

    const screen = render(() => <App />);
    fireEvent.click(screen.getByRole("button", { name: "Open CSV" }));
    await screen.findByText("10 points");
    expect(screen.queryByRole("button", { name: "Export Markdown" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Fit degree 1" }));
    fireEvent.click(await screen.findByRole("button", { name: "Export Markdown" }));

    await vi.waitFor(() => expect(vi.mocked(save)).toHaveBeenCalled());
    expect(vi.mocked(save).mock.calls.at(-1)?.[0]).toMatchObject({
      title: "Export Markdown",
      defaultPath: "fit.md",
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    const call = vi.mocked(invoke).mock.calls.find(([command]) => command === "export_markdown");
    expect(call?.[1]).toEqual({ path: "/tmp/hookes-law.md" });
  });

  it("leaves the fit in place when Markdown export is cancelled", async () => {
    vi.mocked(open).mockResolvedValue("/samples/capacitor-discharge.csv");
    vi.mocked(save).mockResolvedValue(null);
    vi.mocked(invoke).mockImplementation(async (command) => {
      if (command === "open_csv") {
        return seriesFromSample("capacitor-discharge.csv");
      }
      if (command === "fit_series") {
        return capacitorFit;
      }
      throw new Error(command);
    });

    const screen = render(() => <App />);
    fireEvent.click(screen.getByRole("button", { name: "Open CSV" }));
    await screen.findByText("17 points");
    fireEvent.click(screen.getByRole("button", { name: "Fit degree 2" }));
    fireEvent.click(await screen.findByRole("button", { name: "Export Markdown" }));

    await vi.waitFor(() => expect(vi.mocked(save)).toHaveBeenCalled());
    expect(vi.mocked(invoke).mock.calls.map(([command]) => command)).not.toContain("export_markdown");
    expect(screen.getByText("Degree 2")).toBeTruthy();
    expect(screen.getByText("R^2").nextElementSibling?.textContent).toBe("0.997");
  });
});
