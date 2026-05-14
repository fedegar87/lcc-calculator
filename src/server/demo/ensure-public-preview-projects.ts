import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { DEMO_USER, PROJECT_META, BOUNDARY_CONDITIONS } from "../../../prisma/seed-data/shared";
import { baseVariantData } from "../../../prisma/seed-data/base-variant";
import { variant1Data } from "../../../prisma/seed-data/variant-1";
import { variant2Data } from "../../../prisma/seed-data/variant-2";
import {
  ASPERN_BOUNDARY,
  ASPERN_PROJECT,
  aspernVariant,
} from "../../../prisma/seed-data/cravezero-aspern";
import {
  HELIADES_BOUNDARY,
  HELIADES_PROJECT,
  heliadesVariant,
} from "../../../prisma/seed-data/cravezero-heliades";
import {
  SOLALLEN_BOUNDARY,
  SOLALLEN_PROJECT,
  solallenVariant,
} from "../../../prisma/seed-data/cravezero-solallen";
import {
  VALAGARD_BOUNDARY,
  VALAGARD_PROJECT,
  valagardVariant,
} from "../../../prisma/seed-data/cravezero-valagard";

type BoundaryConditions = typeof BOUNDARY_CONDITIONS;
type SeedVariant =
  | typeof baseVariantData
  | typeof variant1Data
  | typeof variant2Data
  | typeof aspernVariant
  | typeof heliadesVariant
  | typeof solallenVariant
  | typeof valagardVariant;

const PREVIEW_USER_ID = "preview-demo-user";

const PREVIEW_PROJECTS = [
  {
    id: "preview-reference-building",
    meta: PROJECT_META,
    boundary: BOUNDARY_CONDITIONS,
    variants: [baseVariantData, variant1Data, variant2Data],
  },
  {
    id: "preview-aspern-iq",
    meta: ASPERN_PROJECT,
    boundary: ASPERN_BOUNDARY,
    variants: [aspernVariant],
  },
  {
    id: "preview-heliades",
    meta: HELIADES_PROJECT,
    boundary: HELIADES_BOUNDARY,
    variants: [heliadesVariant],
  },
  {
    id: "preview-solallen",
    meta: SOLALLEN_PROJECT,
    boundary: SOLALLEN_BOUNDARY,
    variants: [solallenVariant],
  },
  {
    id: "preview-valagard",
    meta: VALAGARD_PROJECT,
    boundary: VALAGARD_BOUNDARY,
    variants: [valagardVariant],
  },
] as const;

let ensurePromise: Promise<void> | null = null;

function buildVariantCreate(
  variantData: SeedVariant,
  boundary: BoundaryConditions,
) {
  return {
    label: variantData.label,
    description: variantData.description,
    geometry: {
      create: variantData.geometry,
    },
    boundaryCondition: {
      create: {
        referencePeriod: boundary.referencePeriod,
        interestRate: boundary.interestRate,
        inflationRate: boundary.inflationRate,
        energyPrices: boundary.energyPrices,
      },
    },
    energyInputs: {
      create: variantData.energyInputs,
    },
    costItems: {
      create: variantData.costItems,
    },
    serviceComponents: {
      create: variantData.serviceComponents.map((component, index) => ({
        ...component,
        sortOrder: index,
      })),
    },
    wlcInput: {
      create: variantData.wlcInput,
    },
    designCosts: {
      create: variantData.designCosts,
    },
    incomeInput: {
      create: variantData.incomeInput,
    },
    maintenanceConfig: {
      create: variantData.maintenanceConfig,
    },
  };
}

async function ensurePublicPreviewProjectsInner(db: PrismaClient) {
  const previewUser = await db.user.upsert({
    where: { email: DEMO_USER.email },
    update: { name: DEMO_USER.name },
    create: {
      id: PREVIEW_USER_ID,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      emailVerified: true,
    },
  });

  for (const project of PREVIEW_PROJECTS) {
    const existingProject = await db.project.findFirst({
      where: {
        OR: [{ id: project.id }, { name: project.meta.name }],
      },
      select: { id: true },
    });

    if (existingProject) {
      continue;
    }

    await db.project.upsert({
      where: { id: project.id },
      update: {},
      create: {
        id: project.id,
        ...project.meta,
        userId: previewUser.id,
        members: {
          create: { userId: previewUser.id, role: "OWNER" },
        },
        variants: {
          create: project.variants.map((variant) =>
            buildVariantCreate(variant, project.boundary),
          ),
        },
      },
    });
  }
}

export async function ensurePublicPreviewProjects(db: PrismaClient) {
  ensurePromise ??= ensurePublicPreviewProjectsInner(db).catch((error) => {
    ensurePromise = null;
    throw error;
  });

  await ensurePromise;
}
