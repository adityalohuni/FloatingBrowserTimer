import React from "react";
import ReactDOM, { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import App from "./App";

export async function mountContentScriptUi(ctx: any) {
  const ui = await createShadowRootUi(ctx, {
    onMount: (container) => {
      const overlayContainer = document.createElement("div");
      overlayContainer.attachShadow({ mode: "open" });
      overlayContainer.id = "my-overlay-root";

      document.body.appendChild(overlayContainer);
      const overlayRoot = createRoot(overlayContainer);
      overlayRoot.render(<App />);
    },
    onRemove: (root) => {
      root?.unmount;
    },
  });
  return ui;
}
