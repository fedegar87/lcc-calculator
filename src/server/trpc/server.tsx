import "server-only";
import { cache } from "react";
import { createCallerFactory, createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./router";
import { headers } from "next/headers";

const createCaller = createCallerFactory(appRouter);

export const getQueryClient = cache(makeQueryClient);

export const caller = createCaller(async () => {
  const h = await headers();
  return createTRPCContext({ headers: h });
});
