import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'floating-clock',
      position: 'inline',
      anchor: 'body',
      onMount(container) {
        const div = document.createElement('div');
        container.append(div);

        const root = createRoot(div);
        root.render(<App />);
      },
      // onRemove: (root) => {
      //   root?.unmount();
      // },
    });
    ui.mount();
  },
});
