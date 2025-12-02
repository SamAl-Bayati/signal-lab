import { describe, it, expect } from "vitest";
import { BASE_PLOT_LAYOUT, createPlotLayout } from "./plotConfig";

describe("createPlotLayout", () => {
  it("starts from the base layout", () => {
    const layout = createPlotLayout();

    expect(layout.margin).toEqual(BASE_PLOT_LAYOUT.margin);
    expect(layout.plot_bgcolor).toBe(BASE_PLOT_LAYOUT.plot_bgcolor);
    expect(layout.font).toEqual(BASE_PLOT_LAYOUT.font);
  });

  it("applies top-level overrides", () => {
    const layout = createPlotLayout({ dragmode: "pan" });
    expect(layout.dragmode).toBe("pan");
  });

  it("merges xaxis and yaxis overrides while keeping base grid styles", () => {
    const layout = createPlotLayout({
      xaxis: { title: "Time (s)" },
      yaxis: { title: "Amplitude" },
    });

    expect(layout.xaxis.title).toBe("Time (s)");
    expect(layout.yaxis.title).toBe("Amplitude");

    // base grid styling is preserved
    expect(layout.xaxis.gridcolor).toBe(BASE_PLOT_LAYOUT.xaxis.gridcolor);
    expect(layout.yaxis.zerolinecolor).toBe(
      BASE_PLOT_LAYOUT.yaxis.zerolinecolor
    );
  });
});
