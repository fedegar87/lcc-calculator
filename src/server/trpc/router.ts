import { createTRPCRouter, baseProcedure } from "./init";
import { projectRouter } from "./routers/project";
import { variantRouter } from "./routers/variant";
import { costItemRouter } from "./routers/cost-item";
import { calculationRouter } from "./routers/calculation";
import { referenceRouter } from "./routers/reference";
import { exportRouter } from "./routers/export";

export const appRouter = createTRPCRouter({
  healthcheck: baseProcedure.query(() => ({ status: "ok" as const })),
  project: projectRouter,
  variant: variantRouter,
  costItem: costItemRouter,
  calculation: calculationRouter,
  reference: referenceRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
