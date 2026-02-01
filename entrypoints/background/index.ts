import { createChromeHandler } from 'trpc-chrome/adapter';
import { timerRouter } from '@/src/trpc/_appTimer';

export default defineBackground(async () => {
  createChromeHandler({ router: timerRouter });
});
