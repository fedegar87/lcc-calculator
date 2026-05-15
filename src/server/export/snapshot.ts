import { createHash } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import type {
  VariantInput,
  FormulaMode,
  LCCResult,
  MethodProfileId,
} from "@/engine/types";
import { DEFAULT_METHOD_PROFILE } from "@/engine/method-profiles";

/**
 * Produce a deterministic SHA-256 hex hash of the variant input + formula mode.
 * Object keys are recursively sorted so insertion order does not affect the hash.
 */
export function computeInputsHash(
  input: VariantInput,
  formulaMode: FormulaMode,
  methodProfile: MethodProfileId = DEFAULT_METHOD_PROFILE,
): string {
  const payload = { input, formulaMode, methodProfile };
  const json = JSON.stringify(payload, (_key, value) => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce<Record<string, unknown>>((sorted, k) => {
          sorted[k] = (value as Record<string, unknown>)[k];
          return sorted;
        }, {});
    }
    return value as unknown;
  });
  return createHash("sha256").update(json).digest("hex");
}

interface SnapshotParams {
  projectId: string;
  variantLabel: "BASE" | "VARIANT_1" | "VARIANT_2";
  engineVersion: string;
  formulaMode: FormulaMode;
  methodProfile?: MethodProfileId;
  variantInput: VariantInput;
  result: LCCResult;
  userId: string;
}

/**
 * Return an existing ResultSnapshot with the same inputsHash, or create a new one.
 * This ensures export reproducibility without duplicate snapshots.
 */
export async function getOrCreateSnapshot(
  db: PrismaClient,
  params: SnapshotParams,
) {
  const inputsHash = computeInputsHash(
    params.variantInput,
    params.formulaMode,
    params.methodProfile ?? params.result.methodProfile ?? DEFAULT_METHOD_PROFILE,
  );

  // Check for existing snapshot with identical inputs
  const existing = await db.resultSnapshot.findFirst({
    where: { projectId: params.projectId, inputsHash },
  });

  if (existing) {
    return existing;
  }

  // Prisma FormulaMode enum uses SCREAMING_CASE
  const prismaFormulaMode =
    params.formulaMode === "excel_replica"
      ? ("EXCEL_REPLICA" as const)
      : ("EXCEL_BUGFIXED" as const);

  return db.resultSnapshot.create({
    data: {
      projectId: params.projectId,
      variantLabel: params.variantLabel,
      engineVersion: params.engineVersion,
      formulaMode: prismaFormulaMode,
      inputs: JSON.parse(JSON.stringify(params.variantInput)),
      outputs: JSON.parse(JSON.stringify(params.result)),
      inputsHash,
      trigger: "export",
      createdById: params.userId,
    },
  });
}
