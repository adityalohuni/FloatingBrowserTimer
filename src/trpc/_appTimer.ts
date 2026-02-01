import * as z from 'zod';

import {
  getTime,
  getVisibility,
  isRunning,
  resetClock,
  setTime,
  setVisibility,
  switchTimer,
} from '../core/timer';
import { procedure, router } from './trpc';

export const timerRouter = router({
  switchTimer: procedure.mutation(async () => await switchTimer()),
  isRunning: procedure.query(async () => await isRunning()),
  changeTime: procedure
    .input(z.object({ time: z.number() }))
    .mutation(async ({ input }) => {
      await setTime(input.time);
    }),
  resetTime: procedure.mutation(async () => await resetClock()),
  getTime: procedure.query(async () => await getTime()),

  isVisible: procedure.query(async () => await getVisibility()),
  setVisibility: procedure
    .input(z.object({ isVisible: z.boolean() }))
    .mutation(
      async ({ input }) => await setVisibility(input.isVisible as boolean)
    ),
});

export type AppRouter = typeof timerRouter;
