import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../init";
import { requireProjectRole } from "../middleware/auth";

const BUILDING_USE_VALUES = [
  "RESIDENTIAL_SINGLE",
  "RESIDENTIAL_MULTI",
  "OFFICE",
  "EDUCATION",
  "COMMERCIAL",
  "INDUSTRIAL",
  "OTHER",
] as const;

const VARIANT_LABELS = ["VARIANT_1", "VARIANT_2"] as const;

export const projectRouter = createTRPCRouter({
  // 1. List own projects
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      where: { userId: ctx.user.id },
      select: {
        id: true,
        name: true,
        buildingUse: true,
        city: true,
        updatedAt: true,
        _count: { select: { variants: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }),

  // 2. Get project by ID (with access check)
  getById: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        include: {
          variants: { select: { id: true, label: true, description: true } },
          members: {
            select: {
              id: true,
              userId: true,
              role: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Access check: creator or member
      const isCreator = project.userId === ctx.user.id;
      const isMember = project.members.some((m) => m.userId === ctx.user.id);
      if (!isCreator && !isMember) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return project;
    }),

  // 3. Create project with BASE variant and default sub-records
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        country: z.string().optional(),
        region: z.string().optional(),
        city: z.string().optional(),
        location: z.string().optional(),
        author: z.string().optional(),
        buildingUse: z.enum(BUILDING_USE_VALUES).default("RESIDENTIAL_MULTI"),
        constructionYear: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.create({
        data: {
          ...input,
          userId: ctx.user.id,
          variants: {
            create: {
              label: "BASE",
              geometry: { create: {} },
              boundaryCondition: { create: {} },
              maintenanceConfig: { create: {} },
            },
          },
        },
        include: {
          variants: { select: { id: true, label: true, description: true } },
        },
      });
    }),

  // 4. Update project
  update: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1).max(200).optional(),
        country: z.string().optional(),
        region: z.string().optional(),
        city: z.string().optional(),
        location: z.string().optional(),
        author: z.string().optional(),
        buildingUse: z.enum(BUILDING_USE_VALUES).optional(),
        constructionYear: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, ...data } = input;

      // Check access: creator or OWNER/EDITOR member
      const project = await ctx.db.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (project.userId !== ctx.user.id) {
        const membership = await ctx.db.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: ctx.user.id } },
        });
        if (!membership || membership.role === "VIEWER") {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
      }

      return ctx.db.project.update({
        where: { id: projectId },
        data,
      });
    }),

  // 5. Delete project (creator or EDITOR)
  delete: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (project.userId !== ctx.user.id) {
        const membership = await ctx.db.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: input.projectId,
              userId: ctx.user.id,
            },
          },
        });
        if (!membership || membership.role === "VIEWER") {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
      }

      await ctx.db.project.delete({ where: { id: input.projectId } });
      return { success: true };
    }),

  // 6. Add member (OWNER only = creator)
  addMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        email: z.string().email(),
        role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only creator (implicit OWNER) can manage members
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Find target user by email
      const targetUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Cannot add self
      if (targetUser.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot add yourself as a member",
        });
      }

      // Upsert: update role if already exists
      return ctx.db.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: targetUser.id,
          },
        },
        create: {
          projectId: input.projectId,
          userId: targetUser.id,
          role: input.role,
        },
        update: { role: input.role },
      });
    }),

  // 7. Remove member (OWNER only = creator)
  removeMember: protectedProcedure
    .input(z.object({ projectId: z.string(), memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Find the member record
      const member = await ctx.db.projectMember.findUnique({
        where: { id: input.memberId },
      });
      if (!member || member.projectId !== input.projectId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Cannot remove self (creator)
      if (member.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot remove yourself",
        });
      }

      await ctx.db.projectMember.delete({ where: { id: input.memberId } });
      return { success: true };
    }),

  // 8. Add variant (OWNER or EDITOR)
  addVariant: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        label: z.enum(VARIANT_LABELS),
        description: z.string().optional(),
      }),
    )
    .use(requireProjectRole("OWNER", "EDITOR"))
    .mutation(async ({ ctx, input }) => {
      // Check if variant with this label already exists
      const existing = await ctx.db.variant.findUnique({
        where: {
          projectId_label: {
            projectId: input.projectId,
            label: input.label,
          },
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Variant ${input.label} already exists for this project`,
        });
      }

      return ctx.db.variant.create({
        data: {
          projectId: input.projectId,
          label: input.label,
          description: input.description,
          geometry: { create: {} },
          boundaryCondition: { create: {} },
          maintenanceConfig: { create: {} },
        },
        select: { id: true, label: true, description: true },
      });
    }),
});
