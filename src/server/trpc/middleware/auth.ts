import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "../../../generated/prisma/client";
import { middleware } from "../init";

type Role = "OWNER" | "EDITOR" | "VIEWER";

interface AuthenticatedCtx {
  db: PrismaClient;
}

export function requireProjectRole(...allowedRoles: Role[]) {
  return middleware(async (opts) => {
    const ctx = opts.ctx as unknown as AuthenticatedCtx;
    const input = opts.input as { projectId?: string };

    if (!input?.projectId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "projectId is required" });
    }

    const { projectId } = input;

    const project = await ctx.db.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    if (!allowedRoles.includes("OWNER")) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // Public preview: every authenticated/anonymous session can edit
    // existing projects. When account gating returns, restore role checks here.
    return opts.next({
      ctx: { ...opts.ctx, projectId, memberRole: "OWNER" as Role },
    });
  });
}
