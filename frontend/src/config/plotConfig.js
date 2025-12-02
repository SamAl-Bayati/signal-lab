export const BASE_PLOT_LAYOUT = {
  autosize: true,
  margin: { l: 45, r: 10, t: 10, b: 38 },
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(15,23,42,1)",
  font: { color: "#e5e7eb", size: 10 },
  dragmode: "zoom",
  xaxis: {
    gridcolor: "rgba(55,65,81,0.7)",
    zerolinecolor: "rgba(55,65,81,0.7)",
  },
  yaxis: {
    gridcolor: "rgba(55,65,81,0.7)",
    zerolinecolor: "rgba(55,65,81,0.7)",
  },
};

export function createPlotLayout(overrides = {}) {
  const base = BASE_PLOT_LAYOUT;

  return {
    ...base,
    ...overrides,
    xaxis: {
      ...base.xaxis,
      ...(overrides.xaxis || {}),
    },
    yaxis: {
      ...base.yaxis,
      ...(overrides.yaxis || {}),
    },
  };
}
