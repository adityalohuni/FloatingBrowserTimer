import { initTRPC } from "@trpc/server";
import { createChromeHandler } from "trpc-chrome/adapter";

import * as z from "zod";

import { storage } from "#imports";

const t = initTRPC.create({
  isServer: false,
  allowOutsideOfServer: true,
});

var defaultTime = 100;
var currentTime = 0;

let timeInterval: any | null = null;

function runTimer() {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  timeInterval = setInterval(async () => {
    if (currentTime <= 0) {
      currentTime = defaultTime;
    } else {
      currentTime -= 1;
    }
  }, 1000);
}

function stopTimer() {
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
}

const appRouter = t.router({
  startStopTime: t.procedure.mutation(() => {
    if (timeInterval) stopTimer();
    else runTimer();
  }),
  isRunning: t.procedure.query(({}) => !!timeInterval),
  changeTime: t.procedure
    .input(z.object({ time: z.number() }))
    .mutation(async ({ input }) => {
      await storage.setItem("local:time", input.time);
      currentTime = input.time;
      defaultTime = input.time;
    }),
  resetTime: t.procedure.mutation(({}) => {
    currentTime = defaultTime;
  }),
  getTime: t.procedure.query(({}) => currentTime),
});

export type AppRouter = typeof appRouter;

export default defineBackground(async () => {
  defaultTime = (await storage.getItem<number>("local:time")) ?? defaultTime;
  createChromeHandler({ router: appRouter });

  runTimer();
});
