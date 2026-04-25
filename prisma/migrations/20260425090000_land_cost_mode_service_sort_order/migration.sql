-- Add explicit land-cost semantics and stable service-component ordering.

CREATE TYPE "LandCostMode" AS ENUM ('UNIT_PRICE', 'TOTAL_COST');

ALTER TABLE "WLCInput"
ADD COLUMN "landCostMode" "LandCostMode" NOT NULL DEFAULT 'UNIT_PRICE',
ADD COLUMN "landCostTotal" DECIMAL(14,2) DEFAULT 0;

UPDATE "WLCInput"
SET
  "landCostMode" = 'TOTAL_COST',
  "landCostTotal" = "landPrice"
WHERE COALESCE("landArea", 0) = 0
  AND COALESCE("landPrice", 0) > 0;

ALTER TABLE "ServiceComponent"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "variantId"
      ORDER BY "id" ASC
    ) - 1 AS row_order
  FROM "ServiceComponent"
)
UPDATE "ServiceComponent" AS sc
SET "sortOrder" = ordered.row_order
FROM ordered
WHERE sc."id" = ordered."id";

CREATE INDEX "ServiceComponent_variantId_sortOrder_idx"
ON "ServiceComponent"("variantId", "sortOrder");
