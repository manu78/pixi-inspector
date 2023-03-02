import type { PixiDevtools } from "../types";

export default function pixiDevtoolsOverlay(devtools: PixiDevtools) {
  const overlayEl = document.createElement("div");
  Object.assign(overlayEl.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: `${devtools.app?.renderer.width}px`,
    height: `${devtools.app?.renderer.height}px`,
    pointerEvents: "none",
    transformOrigin: "top left",
  });
  const highlightEl = document.createElement("div");
  Object.assign(highlightEl.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "0",
    height: "0",
    outline: "3px solid #ffaf29",
    transformOrigin: "top left",
  });
  overlayEl.appendChild(highlightEl);

  let prevSize = { width: -1, height: -1 };

  function calibrateOverlay() {
    const { app } = devtools;
    if (!app) return;
    overlayEl.style.width = `${app.renderer.width / app.renderer.resolution}px`;
    overlayEl.style.height = `${
      app.renderer.height / app.renderer.resolution
    }px`;
    const canvasBounds = app.view.getBoundingClientRect();
    overlayEl.style.transform = "";
    const overlayBounds = overlayEl.getBoundingClientRect();
    overlayEl.style.transform = `translate(${
      canvasBounds.x - overlayBounds.x
    }px, ${canvasBounds.y - overlayBounds.y}px) scale(${
      canvasBounds.width / overlayBounds.width
    }, ${canvasBounds.height / overlayBounds.height})`;
  }

  function updateHighlight() {
    const node = devtools.active();
    if (!node) {
      highlightEl.style.transform = "scale(0)";
      return;
    }
    if (!node.parent || node.visible === false) {
      highlightEl.style.transform = "scale(0)";
      return;
    }
    calibrateOverlay();
    const size = node.getLocalBounds();
    if (prevSize.width !== size.width && prevSize.height !== size.height) {
      prevSize = { width: size.width, height: size.height };
      highlightEl.style.width = `${size.width}px`;
      highlightEl.style.height = `${size.height}px`;
    }
    const m = node.worldTransform;
    const offset = `translate(${size.x}px, ${size.y}px)`;
    highlightEl.style.transform = `matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, ${m.tx}, ${m.ty}) ${offset}`;
  }
  devtools.on("connect", (app) => {
    app.ticker.add(updateHighlight);
    updateHighlight();
    document.body.appendChild(overlayEl);

    devtools.once("disconnect", () => {
      app.ticker.remove(updateHighlight);
      overlayEl.remove();
    });
  });
}
