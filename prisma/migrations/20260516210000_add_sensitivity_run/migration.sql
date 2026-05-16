-- CreateEnum
CREATE TYPE "SAMethod" AS ENUM ('DSA', 'EE');

-- CreateTable
CREATE TABLE "SensitivityRun" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "method" "SAMethod" NOT NULL,
    "config" JSONB NOT NULL,
    "parameterSpecs" JSONB NOT NULL,
    "baselineSnapshot" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "diagnostics" JSONB,
    "engineVersion" TEXT NOT NULL,
    "formulaMode" "FormulaMode" NOT NULL DEFAULT 'EXCEL_BUGFIXED',
    "methodProfile" TEXT NOT NULL DEFAULT 'CRAVEZERO_LEGACY',
    "seed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "SensitivityRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SensitivityRun_variantId_method_createdAt_idx" ON "SensitivityRun"("variantId", "method", "createdAt");

-- AddForeignKey
ALTER TABLE "SensitivityRun" ADD CONSTRAINT "SensitivityRun_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensitivityRun" ADD CONSTRAINT "SensitivityRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
