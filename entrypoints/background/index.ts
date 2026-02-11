import { createChromeHandler } from 'trpc-chrome/adapter';
import { timerRouter } from '@/src/trpc/_appTimer';

export default defineBackground(() => {
  createChromeHandler({
    router: timerRouter,
    createContext: async () => ({}),
    onError: (opts: { type: string; path?: string; error: unknown }) => {
      console.error(`[tRPC:${opts.type}] ${opts.path ?? '<unknown>'}`, opts.error);
    },
  });
});
