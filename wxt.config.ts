import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  manifest: {
    name: 'Floating Clock',
    description: 'A floating on-screen clock with quick toggle controls.',
    permissions: ['storage', 'alarms'],
    // icons: {
    //   16: '/icon/16.png',
    //   32: '/icon/32.png',
    //   48: '/icon/48.png',
    //   96: '/icon/96.png',
    //   128: '/icon/128.png',
    // },
  },
});
