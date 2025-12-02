import Plotly from "plotly.js-basic-dist";

export const BASE_PLOT_CONFIG = {
  displayModeBar: false,
  responsive: true,
  scrollZoom: true,
  doubleClick: "reset",
};

export function enableMiddleMousePan(graphDiv) {
  if (!graphDiv || graphDiv.__middleMousePanEnabled) return;
  graphDiv.__middleMousePanEnabled = true;

  let isMiddlePanning = false;
  let previousDragmode = null;

  const getLayout = () => graphDiv._fullLayout || graphDiv._fullLayoutInitial;

  const dispatchSynthetic = (type, sourceEvent) => {
    if (
      typeof window === "undefined" ||
      typeof MouseEvent === "undefined" ||
      !sourceEvent
    ) {
      return;
    }

    const target = sourceEvent.target || graphDiv;

    const evt = new MouseEvent(type, {
      bubbles: false, // prevent recursion through window listeners
      cancelable: true,
      clientX: sourceEvent.clientX,
      clientY: sourceEvent.clientY,
      buttons: 1,
      button: 0,
      ctrlKey: sourceEvent.ctrlKey,
      altKey: sourceEvent.altKey,
      shiftKey: sourceEvent.shiftKey,
      metaKey: sourceEvent.metaKey,
    });

    target.dispatchEvent(evt);
  };

  const onMouseDown = (event) => {
    if (event.button !== 1) return;

    const layout = getLayout();
    previousDragmode = layout && layout.dragmode ? layout.dragmode : "zoom";
    isMiddlePanning = true;

    event.preventDefault();
    event.stopPropagation();

    Plotly.relayout(graphDiv, { dragmode: "pan" });
    dispatchSynthetic("mousedown", event);
  };

  const onMouseMove = (event) => {
    if (!isMiddlePanning) return;
    event.preventDefault();
    event.stopPropagation();
    dispatchSynthetic("mousemove", event);
  };

  const endPan = (event) => {
    if (!isMiddlePanning) return;
    isMiddlePanning = false;

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    dispatchSynthetic(
      "mouseup",
      event || { target: graphDiv, clientX: 0, clientY: 0 }
    );

    if (previousDragmode) {
      Plotly.relayout(graphDiv, { dragmode: previousDragmode });
    }
  };

  graphDiv.addEventListener("mousedown", onMouseDown, { capture: true });

  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endPan);
    window.addEventListener("blur", endPan);
  }
}
