import { initTRPC } from "@trpc/server";
import { createChromeHandler } from "trpc-chrome/adapter";
import { timerRouter } from "@/src/trpc/_appTimer";

import { storage } from "#imports";
export default defineBackground(async () => {
  createChromeHandler({ router: timerRouter });
});
