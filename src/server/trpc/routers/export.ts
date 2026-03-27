import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../init";

export const exportRouter = createTRPCRouter({
  // Stub: PDF and Excel export will be implemented in Phase 9
  generatePdf: protectedProcedure
    .input(z.object({ projectId: z.string(), variantLabel: z.string() }))
    .mutation(async () => {
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Export will be available in a future update.",
      });
    }),

  generateExcel: protectedProcedure
    .input(z.object({ projectId: z.string(), variantLabel: z.string() }))
    .mutation(async () => {
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Export will be available in a future update.",
      });
    }),
});
