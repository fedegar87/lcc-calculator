import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { DEMO_USER, PROJECT_META, BOUNDARY_CONDITIONS } from "./seed-data/shared";
import { baseVariantData } from "./seed-data/base-variant";
import { variant1Data } from "./seed-data/variant-1";
import { variant2Data } from "./seed-data/variant-2";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function buildVariantCreate(
  variantData: typeof baseVariantData | typeof variant1Data | typeof variant2Data,
) {
  return {
    label: variantData.label,
    description: variantData.description,
    geometry: {
      create: variantData.geometry,
    },
    boundaryCondition: {
      create: {
        referencePeriod: BOUNDARY_CONDITIONS.referencePeriod,
        interestRate: BOUNDARY_CONDITIONS.interestRate,
        inflationRate: BOUNDARY_CONDITIONS.inflationRate,
        energyPrices: BOUNDARY_CONDITIONS.energyPrices,
      },
    },
    energyInputs: {
      create: variantData.energyInputs,
    },
    costItems: {
      create: variantData.costItems,
    },
    serviceComponents: {
      create: variantData.serviceComponents,
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

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await hashPassword(DEMO_USER.password);

  // Upsert demo user (idempotent)
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: { name: DEMO_USER.name },
    create: {
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      emailVerified: true,
    },
  });

  // Upsert credential account for Better Auth
  await prisma.account.upsert({
    where: { id: `seed-credential-${user.id}` },
    update: { password: hashedPassword },
    create: {
      id: `seed-credential-${user.id}`,
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: hashedPassword,
    },
  });

  // Delete existing demo project (cascade deletes all variants and nested data)
  await prisma.project.deleteMany({
    where: { name: PROJECT_META.name, userId: user.id },
  });

  // Create project with 3 variants and all nested data
  const project = await prisma.project.create({
    data: {
      name: PROJECT_META.name,
      buildingUse: PROJECT_META.buildingUse,
      country: PROJECT_META.country,
      city: PROJECT_META.city,
      constructionYear: PROJECT_META.constructionYear,
      userId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
      variants: {
        create: [
          buildVariantCreate(baseVariantData),
          buildVariantCreate(variant1Data),
          buildVariantCreate(variant2Data),
        ],
      },
    },
    include: {
      variants: true,
      members: true,
    },
  });

  console.log(`Seeded demo user: ${user.email} (id: ${user.id})`);
  console.log(
    `Seeded project: ${project.name} with ${project.variants.length} variants`,
  );
  console.log(
    `Variants: ${project.variants.map((v) => v.label).join(", ")}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
