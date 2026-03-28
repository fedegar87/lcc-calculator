-- CreateEnum
CREATE TYPE "BuildingUse" AS ENUM ('RESIDENTIAL_SINGLE', 'RESIDENTIAL_MULTI', 'OFFICE', 'EDUCATION', 'COMMERCIAL', 'INDUSTRIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "VariantLabel" AS ENUM ('BASE', 'VARIANT_1', 'VARIANT_2');

-- CreateEnum
CREATE TYPE "EndUse" AS ENUM ('HEATING_1', 'HEATING_2', 'COOLING_1', 'COOLING_2', 'DHW_1', 'DHW_2', 'HOUSEHOLD_ELECTRICITY', 'PV_PRODUCTION');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('A1_ROOFS', 'A2_FACADES', 'A3_FLOORS', 'A4_WALLS', 'A5_WINDOWS', 'A6_SHADING', 'A7_DOORS', 'A8_INTERNAL', 'A9_STRUCTURE', 'A10_OTHER', 'B1_HEATING', 'B2_COOLING', 'B3_VENTILATION', 'B4_HVAC_COMBINED', 'B5_ELECTRICAL', 'B6_HYDRAULIC', 'C1_SOLAR_THERMAL', 'C2_PV', 'C3_OTHER_RES', 'D1_FURNISHINGS', 'E1_OUTDOOR');

-- CreateEnum
CREATE TYPE "FormulaMode" AS ENUM ('EXCEL_REPLICA', 'EXCEL_BUGFIXED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "organization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "location" TEXT,
    "author" TEXT,
    "buildingUse" "BuildingUse" NOT NULL DEFAULT 'RESIDENTIAL_MULTI',
    "constructionYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "label" "VariantLabel" NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Geometry" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "grossFloorArea" DECIMAL(14,2),
    "netFloorArea" DECIMAL(14,2),
    "grossVolume" DECIMAL(14,2),
    "netVolume" DECIMAL(14,2),
    "unheatedGFA" DECIMAL(14,2),
    "unheatedNFA" DECIMAL(14,2),
    "unheatedGrossVol" DECIMAL(14,2),
    "unheatedNetVol" DECIMAL(14,2),
    "balconiesArea" DECIMAL(14,2),
    "otherSurfacesArea" DECIMAL(14,2),
    "treatedFloorArea" DECIMAL(14,2),
    "windowArea" DECIMAL(14,2),
    "totalThermalEnvelope" DECIMAL(14,2),
    "avgUvalueOpaque" DECIMAL(8,4),
    "avgUvalueGlazing" DECIMAL(8,4),
    "avgHeatRecovery" DECIMAL(6,2),
    "airTightness" DECIMAL(8,4),
    "pvInstalledCapacity" DECIMAL(12,2),
    "manualDesignConstructionCost" DECIMAL(14,2),

    CONSTRAINT "Geometry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoundaryCondition" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "stakeholderRole" INTEGER DEFAULT 1,
    "referencePeriod" INTEGER NOT NULL DEFAULT 40,
    "interestRate" DECIMAL(10,8) NOT NULL DEFAULT 0.0151,
    "inflationRate" DECIMAL(10,8) NOT NULL DEFAULT 0.0056,
    "energyPrices" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "BoundaryCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyInput" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "endUse" "EndUse" NOT NULL,
    "energySourceIndex" INTEGER NOT NULL DEFAULT 1,
    "specificConsumption" DECIMAL(12,4),
    "pvProductionKwh" DECIMAL(14,2),

    CONSTRAINT "EnergyInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "subcategory" TEXT,
    "description" TEXT,
    "materialCostAgg" DECIMAL(14,2) DEFAULT 0,
    "laborCostAgg" DECIMAL(14,2) DEFAULT 0,
    "otherCostAgg" DECIMAL(14,2) DEFAULT 0,

    CONSTRAINT "CostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostItemDetail" (
    "id" TEXT NOT NULL,
    "costItemId" TEXT NOT NULL,
    "layerOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "area" DECIMAL(14,2),
    "materialCost" DECIMAL(14,2),
    "unitPrice" DECIMAL(10,4),
    "laborCost" DECIMAL(14,2),
    "otherCost" DECIMAL(14,2),

    CONSTRAINT "CostItemDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceComponent" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "constructionCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "en15459ComponentIndex" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ServiceComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WLCInput" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "landArea" DECIMAL(14,2) DEFAULT 0,
    "buildingIndex" DECIMAL(8,4),
    "floorHeight" DECIMAL(6,2),
    "landPrice" DECIMAL(14,2) DEFAULT 0,
    "enablingCost1" DECIMAL(14,2) DEFAULT 0,
    "enablingCost2" DECIMAL(14,2) DEFAULT 0,
    "planningFees1" DECIMAL(14,2) DEFAULT 0,
    "planningFees2" DECIMAL(14,2) DEFAULT 0,
    "userSupportPropMgmt" DECIMAL(14,2) DEFAULT 0,
    "userSupportCharges" DECIMAL(14,2) DEFAULT 0,
    "userSupportAdmin" DECIMAL(14,2) DEFAULT 0,
    "financeCost" DECIMAL(14,2) DEFAULT 0,

    CONSTRAINT "WLCInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignCost" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "preliminaryCost" DECIMAL(14,2) DEFAULT 0,
    "definitiveCost" DECIMAL(14,2) DEFAULT 0,
    "executiveCost" DECIMAL(14,2) DEFAULT 0,
    "siteManagementCost" DECIMAL(14,2) DEFAULT 0,

    CONSTRAINT "DesignCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeInput" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "rent1MonthlyPerM2" DECIMAL(10,2),
    "rent1Area" DECIMAL(14,2),
    "rent1Taxes" DECIMAL(14,2),
    "rent2MonthlyPerM2" DECIMAL(10,2),
    "rent2Area" DECIMAL(14,2),
    "rent2Taxes" DECIMAL(14,2),
    "rent3MonthlyPerM2" DECIMAL(10,2),
    "rent3Area" DECIMAL(14,2),
    "rent3Taxes" DECIMAL(14,2),
    "otherIncome1" DECIMAL(14,2),
    "otherIncome1Taxes" DECIMAL(14,2),
    "otherIncome2" DECIMAL(14,2),
    "otherIncome2Taxes" DECIMAL(14,2),
    "otherIncome3" DECIMAL(14,2),
    "otherIncome3Taxes" DECIMAL(14,2),
    "expectedPricePerM2" DECIMAL(10,2),

    CONSTRAINT "IncomeInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceConfig" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "buildingElementMaintenancePercent" DECIMAL(8,6) NOT NULL DEFAULT 0.01,

    CONSTRAINT "MaintenanceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultSnapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "variantLabel" "VariantLabel" NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "formulaMode" "FormulaMode" NOT NULL DEFAULT 'EXCEL_BUGFIXED',
    "inputs" JSONB NOT NULL,
    "inputsHash" TEXT,
    "outputs" JSONB NOT NULL,
    "trigger" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "ResultSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRevision" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "snapshotIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "snapshotId" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "Variant_projectId_idx" ON "Variant"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_projectId_label_key" ON "Variant"("projectId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Geometry_variantId_key" ON "Geometry"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "BoundaryCondition_variantId_key" ON "BoundaryCondition"("variantId");

-- CreateIndex
CREATE INDEX "EnergyInput_variantId_idx" ON "EnergyInput"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "EnergyInput_variantId_endUse_key" ON "EnergyInput"("variantId", "endUse");

-- CreateIndex
CREATE INDEX "CostItem_variantId_category_idx" ON "CostItem"("variantId", "category");

-- CreateIndex
CREATE INDEX "CostItemDetail_costItemId_idx" ON "CostItemDetail"("costItemId");

-- CreateIndex
CREATE INDEX "ServiceComponent_variantId_idx" ON "ServiceComponent"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "WLCInput_variantId_key" ON "WLCInput"("variantId");

-- CreateIndex
CREATE INDEX "DesignCost_variantId_idx" ON "DesignCost"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "IncomeInput_variantId_key" ON "IncomeInput"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceConfig_variantId_key" ON "MaintenanceConfig"("variantId");

-- CreateIndex
CREATE INDEX "ResultSnapshot_projectId_idx" ON "ResultSnapshot"("projectId");

-- CreateIndex
CREATE INDEX "ProjectRevision_projectId_idx" ON "ProjectRevision"("projectId");

-- CreateIndex
CREATE INDEX "ExportRecord_projectId_idx" ON "ExportRecord"("projectId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Geometry" ADD CONSTRAINT "Geometry_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoundaryCondition" ADD CONSTRAINT "BoundaryCondition_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnergyInput" ADD CONSTRAINT "EnergyInput_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItemDetail" ADD CONSTRAINT "CostItemDetail_costItemId_fkey" FOREIGN KEY ("costItemId") REFERENCES "CostItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceComponent" ADD CONSTRAINT "ServiceComponent_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WLCInput" ADD CONSTRAINT "WLCInput_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignCost" ADD CONSTRAINT "DesignCost_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeInput" ADD CONSTRAINT "IncomeInput_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceConfig" ADD CONSTRAINT "MaintenanceConfig_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultSnapshot" ADD CONSTRAINT "ResultSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultSnapshot" ADD CONSTRAINT "ResultSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRevision" ADD CONSTRAINT "ProjectRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportRecord" ADD CONSTRAINT "ExportRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportRecord" ADD CONSTRAINT "ExportRecord_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ResultSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
