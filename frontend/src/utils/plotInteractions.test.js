import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("plotly.js-basic-dist", () => ({
  default: {
    relayout: vi.fn(),
  },
}));

import Plotly from "plotly.js-basic-dist";
import { enableMiddleMousePan } from "./plotInteractions";

describe("enableMiddleMousePan", () => {
  let graphDiv;
  let graphHandlers;
  let windowHandlers;

  beforeEach(() => {
    graphHandlers = {};
    windowHandlers = {};

    graphDiv = {
      __middleMousePanEnabled: false,
      _fullLayout: { dragmode: "zoom" },
      addEventListener: (type, handler) => {
        graphHandlers[type] = handler;
      },
    };

    global.window = {
      addEventListener: (type, handler) => {
        windowHandlers[type] = handler;
      },
    };

    Plotly.relayout.mockReset();
  });

  it("enables middle mouse pan only once per graphDiv", () => {
    enableMiddleMousePan(graphDiv);
    expect(graphDiv.__middleMousePanEnabled).toBe(true);

    const firstHandler = graphHandlers.mousedown;

    enableMiddleMousePan(graphDiv);
    expect(graphHandlers.mousedown).toBe(firstHandler);
  });

  it("switches dragmode to pan on middle mousedown", () => {
    enableMiddleMousePan(graphDiv);

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    const evt = {
      button: 1,
      clientX: 100,
      clientY: 50,
      target: graphDiv,
      preventDefault,
      stopPropagation,
    };

    graphHandlers.mousedown(evt);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(Plotly.relayout).toHaveBeenCalledWith(graphDiv, { dragmode: "pan" });
  });

  it("restores previous dragmode on mouseup", () => {
    graphDiv._fullLayout.dragmode = "zoom";

    enableMiddleMousePan(graphDiv);

    const downEvt = {
      button: 1,
      clientX: 100,
      clientY: 50,
      target: graphDiv,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    graphHandlers.mousedown(downEvt);

    // simulate mouseup from window
    const upEvt = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      target: graphDiv,
      clientX: 110,
      clientY: 55,
    };

    windowHandlers.mouseup(upEvt);

    expect(Plotly.relayout).toHaveBeenCalledWith(graphDiv, { dragmode: "pan" });
    expect(Plotly.relayout).toHaveBeenCalledWith(graphDiv, {
      dragmode: "zoom",
    });
  });
});
