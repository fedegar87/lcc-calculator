import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "../../../generated/prisma/client";
import { middleware } from "../init";

type Role = "OWNER" | "EDITOR" | "VIEWER";

interface AuthenticatedCtx {
  db: PrismaClient;
  user: { id: string };
}

export function requireProjectRole(...allowedRoles: Role[]) {
  return middleware(async (opts) => {
    const ctx = opts.ctx as unknown as AuthenticatedCtx;
    const input = opts.input as { projectId?: string };

    if (!input?.projectId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "projectId is required" });
    }

    const { projectId } = input;
    const userId = ctx.user.id;

    const membership = await ctx.db.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (membership) {
      if (!allowedRoles.includes(membership.role as Role)) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return opts.next({
        ctx: { ...opts.ctx, projectId, memberRole: membership.role as Role },
      });
    }

    // Check if user is project creator (implicit OWNER)
    const project = await ctx.db.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    if (!allowedRoles.includes("OWNER")) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return opts.next({
      ctx: { ...opts.ctx, projectId, memberRole: "OWNER" as Role },
    });
  });
}
