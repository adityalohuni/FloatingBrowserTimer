import * as z from 'zod';

import {
  getTime,
  getVisibility,
  isRunning,
  isSuspended,
  resetClock,
  setSuspended,
  setTime,
  setVisibility,
  switchTimer,
} from '../core/timer';
import { procedure, router } from './trpc';

const visibilityScopeInput = z
  .object({
    site: z.string().min(1).optional(),
  })
  .optional();

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
  isSuspended: procedure.query(async () => await isSuspended()),
  setSuspended: procedure
    .input(z.object({ isSuspended: z.boolean() }))
    .mutation(async ({ input }) => await setSuspended(input.isSuspended)),

  isVisible: procedure
    .input(visibilityScopeInput)
    .query(async ({ input, ctx }) => {
      return await getVisibility({
        site: input?.site,
      });
    }),
  setVisibility: procedure
    .input(
      z.object({
        isVisible: z.boolean(),
        site: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await setVisibility(input.isVisible as boolean, {
        site: input.site,
      });
    }),
});

export type AppRouter = typeof timerRouter;
