import * as z from "zod";

import {
  getTime,
  getVisibility,
  isRunning,
  resetClock,
  setTime,
  setVisibility,
  switchTimer,
} from "../core/timer";
import { t, router, procedure } from "./trpc";

export const timerRouter = t.router({
  switchTimer: procedure.mutation(switchTimer),
  isRunning: procedure.query(isRunning),
  changeTime: procedure
    .input(z.object({ time: z.number() }))
    .mutation(({ input }) => {
      setTime(input.time);
    }),
  resetTime: procedure.mutation(resetClock),
  getTime: procedure.query(getTime),

  isVisible: procedure.query(getVisibility),
  setVisibility: procedure
    .input(z.object({ isVisible: z.boolean() }))
    .mutation(({ input }) => setVisibility(input.isVisible as boolean)),
});

export type AppRouter = typeof timerRouter;
