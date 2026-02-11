import { initTRPC } from '@trpc/server';

type Context = {};

export const t = initTRPC.context<Context>().create({
  isServer: false,
  allowOutsideOfServer: true,
});

export const router = t.router;
export const procedure = t.procedure;
