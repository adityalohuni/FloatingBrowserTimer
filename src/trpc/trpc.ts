import { initTRPC } from '@trpc/server';
import { type CreateChromeContextOptions } from 'trpc-chrome/adapter';

type Context = CreateChromeContextOptions & {};

export const t = initTRPC.context<Context>().create({
  isServer: false,
  allowOutsideOfServer: true,
});

export const router = t.router;
export const procedure = t.procedure;
