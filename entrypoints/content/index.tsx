import React, { createElement } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

export default defineContentScript({
  matches: ["<all_urls>"],
  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: "inline",
      anchor: "body",
      onMount(container) {
        const div = document.createElement("div");
        container.append(div);

        const root = createRoot(div);
        root.render(<App />);
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
    ui.mount();
  },
});
